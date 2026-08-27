import { NextResponse } from "next/server";
import { DashboardService } from "@/modules/executive-dashboard/services/dashboard";

export async function GET() {
  try {
    const data = await DashboardService.fetchDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
