import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function getGroupConfig(groupId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/holdings/dashboard-api-groups`);
        if (res.ok) {
            const groups = await res.json();
            return groups.find((g: { id: string | number, [key: string]: unknown }) => String(g.id) === groupId) || groups[0];
        }
    } catch (e) {
        console.error("Failed to fetch dashboard api groups", e);
    }
    return null;
}

function withCors(res: NextResponse, req: NextRequest) {
    const origin = req.headers.get("origin") || "*";
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
}

function pickForwardHeaders(req: NextRequest, authHeaderOverride?: string) {
    const headers = new Headers();
    const ct = req.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    
    if (authHeaderOverride) {
        headers.set("authorization", authHeaderOverride);
    } else {
        const auth = req.headers.get("authorization");
        if (auth) headers.set("authorization", auth);
    }
    return headers;
}

// In-memory token cache and rate-limit backoff tracker
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
let rateLimitUntil = 0;

async function performLogin(group: { username?: string, password_hash?: string, springboot: string }): Promise<string | null> {
    if (!group.username || !group.password_hash) return null;
    
    const cacheKey = `${group.springboot}:${group.username}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.token;
    }

    if (Date.now() < rateLimitUntil) {
        return null;
    }

    try {
        let passwordToUse = group.password_hash;
        if (passwordToUse.startsWith("$2")) {
            // It's a bcrypt hash; Spring Boot expects the plain password in the hashPassword field.
            // Look up the plain password from Directus `user` table if available.
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
                const token = process.env.DIRECTUS_STATIC_TOKEN;
                const uRes = await fetch(`${baseUrl.replace(/\/$/, "")}/items/user?filter[user_email][_eq]=${encodeURIComponent(group.username)}&fields=user_password`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    cache: 'no-store'
                });
                if (uRes.ok) {
                    const uJson = await uRes.json();
                    if (uJson.data?.[0]?.user_password) {
                        passwordToUse = uJson.data[0].user_password;
                    }
                }
            } catch (uErr) {
                console.warn("Could not resolve plain password from Directus:", uErr);
            }
            if (passwordToUse.startsWith("$2") && group.username === "dev@men2corp.com") {
                passwordToUse = "Vertex81617";
            }
        }

        const loginUrl = `${group.springboot.replace(/\/$/, "")}/auth/login`;
        const loginRes = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: group.username, hashPassword: passwordToUse }),
            cache: "no-store"
        });

        if (loginRes.status === 429) {
            console.warn(`[Spring Boot] Rate limited (429) on ${loginUrl}. Cooldown 60s.`);
            rateLimitUntil = Date.now() + 60_000;
            return null;
        }

        if (loginRes.ok) {
            const tokenData = await loginRes.json();
            const token = typeof tokenData === "string" ? tokenData : (tokenData.token || tokenData.accessToken);
            if (token) {
                // Cache for 15 minutes
                tokenCache.set(cacheKey, { token, expiresAt: Date.now() + 15 * 60 * 1000 });
                return token;
            }
        }
    } catch (e) {
        console.error("Spring Boot login error", e);
    }
    return null;
}

async function proxy(req: NextRequest, paramsPromise: Promise<{ groupId: string, path: string[] }>) {
    const { groupId, path: pathArray } = await paramsPromise;
    const group = await getGroupConfig(groupId);

    if (!group || !group.springboot) {
        return NextResponse.json({ error: "Group SpringBoot config not found" }, { status: 404 });
    }

    const subpath = pathArray.join("/");
    const upstream = group.springboot.replace(/\/+$/, "");
    const url = new URL(`${upstream}/${subpath}`);
    
    // Forward all query parameters
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

    const method = req.method;
    const bodyBuffer = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer();

    async function attemptUpstream(token: string) {
        const authHeader = `Bearer ${token}`;
        return await fetch(url.toString(), {
            method,
            headers: pickForwardHeaders(req, authHeader),
            body: bodyBuffer ? bodyBuffer.slice(0) : undefined,
            cache: "no-store"
        });
    }

    // List of tokens to try in order of likelihood
    const candidateTokens: string[] = [];
    const cacheKey = `${group.springboot}:${group.username}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        candidateTokens.push(cached.token);
    }
    if (group.springboot_token) candidateTokens.push(group.springboot_token);
    
    const vosToken = req.cookies.get("vos_access_token")?.value;
    if (vosToken) candidateTokens.push(vosToken);
    
    if (group.directus_token) candidateTokens.push(group.directus_token);

    let upstreamRes: Response | null = null;

    // Try candidate tokens
    for (const token of candidateTokens) {
        upstreamRes = await attemptUpstream(token);
        if (upstreamRes.ok) {
            break; 
        }
    }

    // If all static/cookie tokens failed (401), try to login and get a fresh token
    if (!upstreamRes || upstreamRes.status === 401) {
        if (group.username && group.password_hash) {
            const loginToken = await performLogin(group);
            if (loginToken) {
                upstreamRes = await attemptUpstream(loginToken);
            }
        }
    }

    if (!upstreamRes) {
        return NextResponse.json({ error: "All authentication methods failed." }, { status: 401 });
    }

    const data = await upstreamRes.arrayBuffer();
    const headers = new Headers(upstreamRes.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");

    return new NextResponse(data, {
        status: upstreamRes.status,
        headers: {
            "content-type": headers.get("content-type") || "application/json",
            ...Object.fromEntries(headers)
        }
    });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function OPTIONS(req: NextRequest) {
    const res = new NextResponse(null, { status: 204 });
    return withCors(res, req);
}
