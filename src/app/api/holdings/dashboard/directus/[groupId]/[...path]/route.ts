import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function getGroupConfig(groupId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/holdings/dashboard-api-groups`);
        if (res.ok) {
            const groups = await res.json();
            return groups.find((g: any) => String(g.id) === groupId) || groups[0];
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

async function proxy(req: NextRequest, paramsPromise: Promise<{ groupId: string, path: string[] }>) {
    const { groupId, path: pathArray } = await paramsPromise;
    const group = await getGroupConfig(groupId);

    if (!group) {
        return NextResponse.json({ error: "Group config not found" }, { status: 404 });
    }

    const DIRECTUS_BASE_URL = group.directus || process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
    const DIRECTUS_TOKEN = group.directus_token || process.env.DIRECTUS_STATIC_TOKEN;

    const subpath = pathArray.join("/");
    const upstream = DIRECTUS_BASE_URL.replace(/\/+$/, "");
    const url = new URL(`${upstream}/${subpath}`);
    
    // Forward all query parameters
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

    try {
        const method = req.method;
        const body = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer();
        
        const authHeader = DIRECTUS_TOKEN ? `Bearer ${DIRECTUS_TOKEN}` : undefined;

        const upstreamRes = await fetch(url.toString(), {
            method,
            headers: pickForwardHeaders(req, authHeader),
            body,
            cache: "no-store"
        });

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

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 502 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string, path: string[] }> }) { return proxy(req, params); }
export async function OPTIONS(req: NextRequest) {
    const res = new NextResponse(null, { status: 204 });
    return withCors(res, req);
}
