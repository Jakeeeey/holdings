import { NextResponse } from "next/server";
import { fetchAllConferenceRoomRequests } from "@/modules/holdings/conference/conference-room-request/services/conference-room-request.service";

export async function GET() {
  try {
    const data = await fetchAllConferenceRoomRequests();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/holdings/conference/conference-room-requests/all] Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch all requests" },
      { status: 500 }
    );
  }
}
