import { NextRequest, NextResponse } from "next/server";
import { fetchAllConferenceRooms, createConferenceRoom } from "@/modules/holdings/conference/conference-room/services/conference-room.service";
import { ConferenceRoomSchema } from "@/modules/holdings/conference/conference-room/types/conference-room.schema";

export async function GET() {
  try {
    const rooms = await fetchAllConferenceRooms();
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const validatedData = ConferenceRoomSchema.parse(body);

    const result = await createConferenceRoom(validatedData);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json({ success: false, message: "Validation error", errors: (error as Record<string, unknown>).errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
