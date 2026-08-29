import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
const token = process.env.DIRECTUS_STATIC_TOKEN;

export async function GET() {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_api`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }

    const json = await res.json();
    return NextResponse.json(json.data || []);
  } catch (error) {
    console.error("Error fetching dashboard_api items:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard API groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_api`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.errors?.[0]?.message || `Failed to create: ${res.statusText}`);
    }

    const json = await res.json();
    return NextResponse.json(json.data);
  } catch (error: unknown) {
    console.error("Error creating dashboard_api item:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to create dashboard API group" }, { status: 500 });
  }
}
