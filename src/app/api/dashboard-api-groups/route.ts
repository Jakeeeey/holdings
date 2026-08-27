import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "distribution-sales";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
    // Attempt to fetch from Directus
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_api?filter[category][_eq]=${category}`, {
      headers: {
        'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return NextResponse.json(json.data);
      }
    }

    // Fallback Mock Data
    return NextResponse.json([
      { 
        id: 1, 
        category: "distribution-sales", 
        group_name: "Men2 Marketing",
        directus: "http://goatedcodoer:8091/",
        directus_token: "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn",
        springboot: "http://goatedcodoer:8083/"
      }
    ]);
  } catch (error) {
    console.error("Error fetching dashboard groups:", error);
    return NextResponse.json([
      { 
        id: 1, 
        category: "distribution-sales", 
        group_name: "Men2 Marketing",
        directus: "http://goatedcodoer:8091/",
        directus_token: "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn",
        springboot: "http://goatedcodoer:8083/"
      }
    ]);
  }
}
