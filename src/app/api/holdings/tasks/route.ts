import { NextRequest, NextResponse } from "next/server";
import { taskService } from "../../../../modules/holdings/tasks/services/taskService";
import { CreateTaskSchema } from "../../../../modules/holdings/tasks/type";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdsParam = searchParams.get("userIds");
    const userIds = userIdsParam ? userIdsParam.split(',').filter(Boolean) : undefined;

    const tasks = await taskService.fetchAll(userIds);
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);

    const newTask = await taskService.create(validatedData);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    const err = error as Error & { errors?: unknown };
    console.error("Error creating task:", err);
    if (err.name === "ZodError") {
      return NextResponse.json({ message: "Validation error", errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create task" }, { status: 500 });
  }
}
