import { NextResponse } from "next/server";
import { fetchGlobalConferenceRooms } from "@/modules/holdings/conference-room-request/services/conference-room-request.service";

export async function GET() {
  try {
    const rooms = await fetchGlobalConferenceRooms();
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch global rooms" },
      { status: 500 }
    );
  }
}
