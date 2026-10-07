import { NextResponse } from "next/server";
import { fetchMyRequests, submitConferenceRoomRequest } from "@/modules/holdings/conference-room-request/services/conference-room-request.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");
    const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
    
    const requests = await fetchMyRequests(userId);
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await submitConferenceRoomRequest(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 500 }
    );
  }
}
