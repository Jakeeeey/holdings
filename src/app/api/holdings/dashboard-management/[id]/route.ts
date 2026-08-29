import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
const token = process.env.DIRECTUS_STATIC_TOKEN;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_api/${id}`, {
      method: "PATCH",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.errors?.[0]?.message || `Failed to update: ${res.statusText}`);
    }

    const json = await res.json();
    return NextResponse.json(json.data);
  } catch (error: unknown) {
    console.error(`Error updating dashboard_api item ${(error as Error).message}:`, error);
    return NextResponse.json({ error: (error as Error).message || "Failed to update dashboard API group" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_api/${id}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 204) return new NextResponse(null, { status: 204 });
      const errorData = await res.json();
      throw new Error(errorData.errors?.[0]?.message || `Failed to delete: ${res.statusText}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error(`Error deleting dashboard_api item ${(error as Error).message}:`, error);
    return NextResponse.json({ error: (error as Error).message || "Failed to delete dashboard API group" }, { status: 500 });
  }
}
