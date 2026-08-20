import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }

  return headers;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/items/holiday_calendar?limit=-1`, {
      cache: 'no-store',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Directus API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data.data || [], { status: 200 });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch holidays";
    return NextResponse.json({ message }, { status: 500 });
  }
}
