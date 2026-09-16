import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Helper to get group config
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

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
let rateLimitUntil = 0;

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    if (!group || !group.springboot) {
        return NextResponse.json({ error: "Group SpringBoot config not found" }, { status: 404 });
    }

    // Try multiple token sources
    const cacheKey = `${group.springboot}:${group.username}`;
    const cached = tokenCache.get(cacheKey);
    let token = (cached && cached.expiresAt > Date.now()) 
        ? cached.token 
        : (group.springboot_token || group.directus_token);
    
    // Fetch the actual sales performance data
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const targetUrl = new URL(`${group.springboot.replace(/\/$/, "")}/api/view-sales-performance/all`);
    if (startDate) targetUrl.searchParams.append("startDate", startDate);
    if (endDate) targetUrl.searchParams.append("endDate", endDate);

    // 1. Try with cached, directus_token or springboot_token first
    let springRes;
    if (token) {
        springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${token}` },
            cache: "no-store",
        });
        if (springRes.ok) {
            return NextResponse.json(await springRes.json());
        }
    }

    // 2. If token fails or is absent, attempt to login to Spring Boot
    if (group.username && group.password_hash && Date.now() >= rateLimitUntil) {
        try {
            let passwordToUse = group.password_hash;
            if (passwordToUse.startsWith("$2")) {
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
                    const directusToken = process.env.DIRECTUS_STATIC_TOKEN;
                    const uRes = await fetch(`${baseUrl.replace(/\/$/, "")}/items/user?filter[user_email][_eq]=${encodeURIComponent(group.username)}&fields=user_password`, {
                        headers: directusToken ? { 'Authorization': `Bearer ${directusToken}` } : {},
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
                body: JSON.stringify({ 
                    email: group.username, 
                    hashPassword: passwordToUse 
                }),
                cache: "no-store"
            });

            if (loginRes.status === 429) {
                console.warn(`[Spring Boot] Rate limited (429) on ${loginUrl}. Cooldown 60s.`);
                rateLimitUntil = Date.now() + 60_000;
            } else if (loginRes.ok) {
                const tokenData = await loginRes.json();
                token = typeof tokenData === "string" ? tokenData : (tokenData.token || tokenData.accessToken);
                
                if (token) {
                    tokenCache.set(cacheKey, { token, expiresAt: Date.now() + 15 * 60 * 1000 });
                    springRes = await fetch(targetUrl.toString(), {
                        headers: { "Authorization": `Bearer ${token}` },
                        cache: "no-store",
                    });
                    
                    if (springRes.ok) {
                        return NextResponse.json(await springRes.json());
                    }
                }
            } else {
                console.error("Spring Boot login failed with status", loginRes.status);
            }
        } catch (e) {
            console.error("Spring Boot authentication error:", e);
        }
    }

    // 3. Last fallback: try the user's vos_access_token (BIA legacy fallback)
    const vosToken = req.cookies.get("vos_access_token")?.value;
    if (vosToken) {
        springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${vosToken}` },
            cache: "no-store",
        });
        if (springRes.ok) {
            return NextResponse.json(await springRes.json());
        }
    }

    return NextResponse.json({ error: "All authentication methods failed" }, { status: 401 });
}
