import { NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/lib/dashboard-groups";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const data = await fetchDashboardGroups(category);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in dashboard-api-groups GET route:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard groups" }, { status: 500 });
  }
}

