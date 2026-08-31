import { NextRequest, NextResponse } from "next/server";
import { fetchConferenceRoomById, updateConferenceRoom, deleteConferenceRoom } from "@/modules/holdings/conference-room/services/conference-room.service";
import { ConferenceRoomSchema } from "@/modules/holdings/conference-room/types/conference-room.schema";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
    }
    const room = await fetchConferenceRoomById(id);
    return NextResponse.json({ success: true, data: room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = ConferenceRoomSchema.partial().parse(body);

    const result = await updateConferenceRoom(id, validatedData);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json({ success: false, message: "Validation error", errors: (error as Record<string, unknown>).errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
    }

    const result = await deleteConferenceRoom(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
