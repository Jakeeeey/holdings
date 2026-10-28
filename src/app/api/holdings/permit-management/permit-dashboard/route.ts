import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/modules/holdings/permit-management/permit-dashboard/services/permit-dashboard.service";

export async function GET() {
  try {
    const data = await fetchDashboardData();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
