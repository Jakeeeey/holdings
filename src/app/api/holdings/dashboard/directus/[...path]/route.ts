import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const url = new URL(`${DIRECTUS_BASE_URL.replace(/\/$/, "")}/${path}`);
    
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

    try {
        const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${DIRECTUS_TOKEN}`,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Directus fetch failed" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
    }
}
