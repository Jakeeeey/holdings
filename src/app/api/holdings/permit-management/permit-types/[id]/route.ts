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

// PATCH /api/holdings/permit-management/permit-types/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Permit type ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const payload: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const trimmed = typeof body.name === "string" ? body.name.trim() : "";
      if (!trimmed) {
        return NextResponse.json(
          { success: false, message: "Permit type name cannot be empty." },
          { status: 400 }
        );
      }
      payload.name = trimmed;
    }

    if (body.is_active !== undefined) {
      payload.is_active = body.is_active ? 1 : 0;
    }

    const endpoint = `${API_BASE_URL}/items/permit_types/${id}`;
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg =
        result?.errors?.[0]?.message || result?.message || "Failed to update permit type.";
      return NextResponse.json({ success: false, message: errorMsg }, { status: response.status });
    }

    // Broadcast updates to configured companies
    let broadcastReport = null;
    const targetName = payload.name as string || result.data?.name;
    if (targetName) {
      try {
        const { broadcastPermitTypeToAllCompanies } = await import(
          "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service"
        );
        broadcastReport = await broadcastPermitTypeToAllCompanies(
          targetName,
          payload.is_active !== undefined ? (payload.is_active as number) : (result.data?.is_active ?? 1)
        );
      } catch (broadcastErr) {
        console.warn("Failed to broadcast permit type update to companies:", broadcastErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: broadcastReport
        ? `Permit type updated and synchronized to ${broadcastReport.syncedCount} of ${broadcastReport.totalConfigured} company instances.`
        : "Permit type updated successfully.",
      data: result.data,
      broadcastReport,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
