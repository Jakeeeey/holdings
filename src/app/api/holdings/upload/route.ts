import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: "POST",
      headers: {
        ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Directus upload error:", errorText);
      return NextResponse.json({ success: false, message: "Failed to upload file to backend" }, { status: 500 });
    }

    const data = await response.json();
    // data.data.id contains the UUID of the uploaded file
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: unknown) {
    console.error("Upload route error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
