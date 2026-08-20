import { NextRequest, NextResponse } from "next/server";
import { taskService } from "../../../../../modules/holdings/tasks/services/taskService";
import { UpdateTaskSchema } from "../../../../../modules/holdings/tasks/type";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const updatedTask = await taskService.update(id, validatedData);
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    const err = error as Error & { errors?: unknown };
    console.error("Error updating task:", err);
    if (err.name === "ZodError") {
      return NextResponse.json({ message: "Validation error", errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await taskService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ message: "Failed to delete task" }, { status: 500 });
  }
}
