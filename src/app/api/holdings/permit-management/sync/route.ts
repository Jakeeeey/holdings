import { NextRequest, NextResponse } from "next/server";
import {
  syncAllPermitTypesToCompanies,
  broadcastPermitTypeToAllCompanies,
  syncSinglePermitToCompany,
  syncCompanyPermits,
  syncAllUnsyncedPermits,
  fetchMatrixData,
} from "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service";

export async function GET() {
  try {
    const data = await fetchMatrixData();
    return NextResponse.json({
      success: true,
      message: "Sync check completed.",
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, name, is_active, permit_id, company_id } = body;

    // 1. Single permit push
    if (action === "sync-single-permit") {
      if (!permit_id) {
        return NextResponse.json(
          { success: false, message: "permit_id is required." },
          { status: 400 }
        );
      }
      const result = await syncSinglePermitToCompany(permit_id);
      return NextResponse.json(result);
    }

    // 2. Company batch permits push
    if (action === "sync-company-permits") {
      if (!company_id) {
        return NextResponse.json(
          { success: false, message: "company_id is required." },
          { status: 400 }
        );
      }
      const result = await syncCompanyPermits(Number(company_id));
      return NextResponse.json(result);
    }

    // 2.1 Single Company Template & Connection Sync (Fail-Fast)
    if (action === "sync-single-company") {
      if (!company_id) {
        return NextResponse.json(
          { success: false, message: "company_id is required." },
          { status: 400 }
        );
      }
      const { fetchCompanyList, syncSingleCompanyPermitTypes } = await import(
        "@/modules/holdings/permit-management/permit-creation/services/permit-creation.service"
      );
      const companies = await fetchCompanyList();
      const target = companies.find((c) => c.company_id === Number(company_id));
      if (!target) {
        return NextResponse.json(
          { success: false, message: "Company not found." },
          { status: 404 }
        );
      }
      const syncResult = await syncSingleCompanyPermitTypes(target);
      return NextResponse.json(syncResult);
    }

    // 3. Global all unsynced permits push
    if (action === "sync-all-permits") {
      const result = await syncAllUnsyncedPermits();
      return NextResponse.json(result);
    }

    // 4. All permit types sync
    if (action === "sync-all-types") {
      const report = await syncAllPermitTypesToCompanies();
      return NextResponse.json(report);
    }

    // 5. Broadcast single type
    if (action === "broadcast-type") {
      if (!name || typeof name !== "string") {
        return NextResponse.json(
          { success: false, message: "Permit type name is required for broadcasting." },
          { status: 400 }
        );
      }
      const report = await broadcastPermitTypeToAllCompanies(name.trim(), is_active ?? 1);
      return NextResponse.json(report);
    }

    // 6. Comprehensive sync-all (Types + Permits)
    if (action === "sync-all") {
      const typesReport = await syncAllPermitTypesToCompanies();
      const permitsReport = await syncAllUnsyncedPermits();
      return NextResponse.json({
        success: typesReport.success && permitsReport.success,
        message: `${typesReport.message} ${permitsReport.message}`,
        typesReport,
        permitsReport,
      });
    }

    // Default: sync all types and permits
    const report = await syncAllPermitTypesToCompanies();
    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
