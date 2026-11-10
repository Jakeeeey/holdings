import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    if (!API_BASE_URL) {
      return NextResponse.json({ error: "Missing API_BASE_URL configuration" }, { status: 500 });
    }

    const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
    const upstreamUrl = `${normalizedBase}/assets/${encodeURIComponent(id)}`;

    const headers: Record<string, string> = {};
    if (DIRECTUS_TOKEN) {
      headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "force-cache",
    });

    if (!upstreamRes.ok) {
      return new NextResponse(null, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/png";
    const cacheControl = upstreamRes.headers.get("cache-control") || "public, max-age=86400, stale-while-revalidate=604800";
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error fetching asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

