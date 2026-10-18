import { NextRequest, NextResponse } from "next/server";
import {
  updatePermitRecord,
  deletePermitRecord,
} from "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload: Record<string, unknown> = {};
    if (body.company_id !== undefined) payload.company_id = Number(body.company_id);
    if (body.permit_type_id !== undefined) payload.permit_type_id = Number(body.permit_type_id);
    if (body.permit_number !== undefined) payload.permit_number = String(body.permit_number);
    if (body.issue_date || body.issued_date) payload.issue_date = body.issue_date || body.issued_date;
    if (body.expiry_date || body.expiration_date) payload.expiry_date = body.expiry_date || body.expiration_date;
    if (body.file_url !== undefined) payload.file_url = body.file_url;
    if (body.issuing_agency !== undefined) payload.issuing_agency = body.issuing_agency;
    if (body.status !== undefined) payload.status = body.status;
    if (body.notes !== undefined || body.remarks !== undefined) payload.notes = body.notes ?? body.remarks;

    const result = await updatePermitRecord(id, payload);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deletePermitRecord(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
