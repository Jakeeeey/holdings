import { NextRequest, NextResponse } from "next/server";
import { taskService } from "../../../../modules/holdings/tasks/services/taskService";
import { CreateTaskSchema } from "../../../../modules/holdings/tasks/type";
import { emailService } from "../../../../modules/holdings/tasks/services/emailService";

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

    // Send email to assignees
    if (newTask.assignees && newTask.assignees.length > 0) {
      try {
        const usersResponse = await directusFetch(`/items/user?fields=user_id,user_email&limit=-1`);
        const users = usersResponse.data || [];
        
        const assigneeEmails = newTask.assignees
          .map((id: string | number) => users.find((u: { user_id: string | number; user_email: string }) => u.user_id?.toString() === id?.toString())?.user_email)
          .filter(Boolean);

        if (assigneeEmails.length > 0) {
          await emailService.sendTaskNotification(assigneeEmails, newTask, false);
        }
      } catch (emailError) {
        console.error("Failed to process email notifications:", emailError);
        // Don't fail the task creation just because email failed
      }
    }

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
