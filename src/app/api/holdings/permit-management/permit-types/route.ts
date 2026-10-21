import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  return headers;
};

export async function GET() {
  try {
    const endpoint = `${API_BASE_URL}/items/permit_types?limit=-1&sort=name`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg =
        result?.errors?.[0]?.message || result?.message || "Failed to fetch permit types.";
      return NextResponse.json({ success: false, message: errorMsg }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, is_active = 1 } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, message: "Permit type name is required." },
        { status: 400 }
      );
    }

    const endpoint = `${API_BASE_URL}/items/permit_types`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: trimmedName,
        is_active: is_active ? 1 : 0,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Check for unique constraint violation
      const errorMsg =
        result?.errors?.[0]?.message || result?.message || "Failed to create permit type.";
      if (
        errorMsg.toLowerCase().includes("unique") ||
        errorMsg.toLowerCase().includes("duplicate") ||
        errorMsg.toLowerCase().includes("already exists")
      ) {
        return NextResponse.json(
          { success: false, message: `Permit type "${trimmedName}" already exists.` },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, message: errorMsg }, { status: response.status });
    }

    // Broadcast/Synchronize to all configured company instances
    let broadcastReport = null;
    try {
      const { broadcastPermitTypeToAllCompanies } = await import(
        "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service"
      );
      broadcastReport = await broadcastPermitTypeToAllCompanies(trimmedName, is_active);
    } catch (broadcastErr) {
      console.warn("Failed to broadcast permit type to companies:", broadcastErr);
    }

    return NextResponse.json({
      success: true,
      message: broadcastReport
        ? `Permit type created and synchronized to ${broadcastReport.syncedCount} of ${broadcastReport.totalConfigured} company instances.`
        : "Permit type created successfully.",
      data: result.data,
      broadcastReport,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
