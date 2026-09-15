import { NextRequest, NextResponse } from "next/server";
import { taskService } from "../../../../../modules/holdings/tasks/services/taskService";
import { UpdateTaskSchema } from "../../../../../modules/holdings/tasks/type";
import { emailService } from "../../../../../modules/holdings/tasks/services/emailService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }
  return headers;
}

async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }
  return response.json();
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const updatedTask = await taskService.update(id, validatedData);

    // Fetch assignees and send email
    try {
      // Fetch assignees for this task
      const assigneesRes = await directusFetch(`/items/employee_task_assignee?filter[task_id][_eq]=${id}`);
      const assignees = assigneesRes.data?.map((a: { user_id: string | number }) => a.user_id) || [];

      if (assignees.length > 0) {
        const usersResponse = await directusFetch(`/items/user?fields=user_id,user_email&limit=-1`);
        const users = usersResponse.data || [];
        
        const assigneeEmails = assignees
          .map((uid: string | number) => users.find((u: { user_id: string | number; user_email: string }) => u.user_id?.toString() === uid?.toString())?.user_email)
          .filter(Boolean);

        if (assigneeEmails.length > 0) {
          await emailService.sendTaskNotification(assigneeEmails, updatedTask, true);
        }
      }
    } catch (emailError) {
      console.error("Failed to process email notifications:", emailError);
    }

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
