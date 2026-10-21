import { NextRequest, NextResponse } from "next/server";
import {
  fetchMatrixData,
  createPermitRecord,
  updatePermitRecord,
} from "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service";

export async function GET() {
  try {
    const data = await fetchMatrixData();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_id,
      permit_type_id,
      permit_number,
      issue_date,
      expiry_date,
      expiration_date,
      issued_date,
      file_url,
      issuing_agency,
      status,
      notes,
      remarks,
      renew_from_id,
    } = body;

    const finalExpiryDate = expiry_date || expiration_date;
    const finalIssueDate = issue_date || issued_date;
    const finalFileUrl = file_url || "";
    const finalNotes = notes || remarks || "";

    if (!company_id || !permit_type_id || !permit_number || !finalExpiryDate || !finalIssueDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill out all required fields (Company, Permit Type, Permit Number, Date Issued, Expiration Date).",
        },
        { status: 400 }
      );
    }

    const payload = {
      company_id: Number(company_id),
      permit_type_id: Number(permit_type_id),
      permit_number: String(permit_number).trim(),
      issue_date: String(finalIssueDate).trim(),
      expiry_date: String(finalExpiryDate).trim(),
      file_url: String(finalFileUrl).trim(),
      issuing_agency: issuing_agency ? String(issuing_agency).trim() : "Government Agency",
      status: status || "Active",
      notes: finalNotes ? String(finalNotes).trim() : null,
    };

    const result = await createPermitRecord(payload);

    // If this creation is part of a renewal, archive the previous permit record on server side
    if (result.success && renew_from_id) {
      try {
        await updatePermitRecord(renew_from_id, {
          company_id: Number(company_id),
          status: "Archived",
        });
      } catch (archiveErr) {
        console.warn("Failed to archive previous permit on renewal:", archiveErr);
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
