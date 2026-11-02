import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyOvertimeSummary,
  IntercompanyOvertimeKpis,
  IntercompanyOvertimeResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-overtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedOvertime {
  data: IntercompanyOvertimeResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedOvertime>();
const CACHE_TTL_MS = 30000; // 30s

function parseBit(val: unknown): boolean {
  if (!val) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data.length > 0) {
      return Number(obj.data[0]) === 1;
    }
  }
  return false;
}

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { data: [], ok: false };
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? (json.data as T[]) : [],
      ok: true,
    };
  } catch {
    return { data: [], ok: false };
  }
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find((g) => String(g.id) === groupId) ||
      groups.find((g) => g.category === "intercompany-overtime") ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Overtime Route] fetchDashboardGroups error:", e);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");

    const startDate =
      searchParams.get("startDate")?.trim() || `${currentYear}-${currentMonth}-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `ot_${groupId}_${startDate}_${endDate}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryBaseUrl = (
      (group?.directus as string | undefined) ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://goatedcodoer:8091"
    ).replace(/\/+$/, "");

    const staticToken =
      (group?.directus_token as string | undefined) ||
      process.env.DIRECTUS_STATIC_TOKEN ||
      "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";

    const primaryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staticToken}`,
    };

    // 1. Fetch company_list
    const companiesRes = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      5000
    );

    const validCompanies = companiesRes.data.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      return true;
    });

    const userFields = "user_id,is_employee,is_deleted,isDeleted";
    const otFields = "overtime_id,user_id,request_date,duration_minutes,status";

    // 2. Query each company's employees and overtime requests concurrently
    const companyFetchResults = await Promise.allSettled(
      validCompanies.map(async (company) => {
        const companyId = Number(company.company_id);
        const companyName = String(company.company_name || `Company #${companyId}`).trim();
        const companyCode = String(company.company_code || `CMP-${companyId}`).trim();
        const companyUrl = String(company.directus).replace(/\/+$/, "");
        const companyToken = (company.directus_token as string) || staticToken;

        const compHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${companyToken}`,
        };

        const [usersRes, otRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/overtime_request?limit=-1&fields=${otFields}&filter[request_date][_gte]=${startDate}&filter[request_date][_lte]=${endDate}`,
            compHeaders,
            6000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          otRequests: otRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const companySummaries: CompanyOvertimeSummary[] = [];

    let grandTotalEmployees = 0;
    let grandTotalRequests = 0;
    let grandApprovedRequests = 0;
    let grandPendingRequests = 0;
    let grandRejectedRequests = 0;
    let grandFiledMinutes = 0;
    let grandApprovedMinutes = 0;
    let activeCompaniesCount = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const {
        companyId,
        companyName,
        companyCode,
        users,
        otRequests,
        isOnline,
      } = res.value;

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalEmployees: 0,
          totalOtRequests: 0,
          approvedOtRequests: 0,
          pendingOtRequests: 0,
          rejectedOtRequests: 0,
          totalFiledOtHours: 0,
          totalApprovedOtHours: 0,
          totalActualOtHours: 0,
          otApprovalRate: 0,
          headcountSharePct: 0,
          otHoursSharePct: 0,
        });
        continue;
      }

      activeCompaniesCount++;

      const activeEmployees = users.filter((u) => {
        if (parseBit(u.is_deleted) || parseBit(u.isDeleted)) return false;
        if (u.is_employee !== undefined && !parseBit(u.is_employee)) return false;
        return true;
      });

      const empCount = activeEmployees.length;
      grandTotalEmployees += empCount;

      let filedMins = 0;
      let approvedMins = 0;
      let approvedReqs = 0;
      let pendingReqs = 0;
      let rejectedReqs = 0;

      otRequests.forEach((r) => {
        const d = Number(r.duration_minutes) || 0;
        filedMins += d;

        const st = String(r.status || "pending").toLowerCase();
        if (st === "approved") {
          approvedMins += d;
          approvedReqs++;
        } else if (st === "rejected") {
          rejectedReqs++;
        } else {
          pendingReqs++;
        }
      });

      grandTotalRequests += otRequests.length;
      grandApprovedRequests += approvedReqs;
      grandPendingRequests += pendingReqs;
      grandRejectedRequests += rejectedReqs;
      grandFiledMinutes += filedMins;
      grandApprovedMinutes += approvedMins;

      const filedHours = Number((filedMins / 60).toFixed(1));
      const approvedHours = Number((approvedMins / 60).toFixed(1));
      const approvalRate =
        otRequests.length > 0 ? Math.round((approvedReqs / otRequests.length) * 100) : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: empCount,
        totalOtRequests: otRequests.length,
        approvedOtRequests: approvedReqs,
        pendingOtRequests: pendingReqs,
        rejectedOtRequests: rejectedReqs,
        totalFiledOtHours: filedHours,
        totalApprovedOtHours: approvedHours,
        totalActualOtHours: approvedHours, // Fallback to approved hours
        otApprovalRate: approvalRate,
        headcountSharePct: 0,
        otHoursSharePct: 0,
      });
    }

    // Sort company summaries descending by approved overtime hours
    companySummaries.sort((a, b) => b.totalApprovedOtHours - a.totalApprovedOtHours);

    const grandApprovedHours = Number((grandApprovedMinutes / 60).toFixed(1));
    const grandFiledHours = Number((grandFiledMinutes / 60).toFixed(1));

    companySummaries.forEach((c) => {
      c.headcountSharePct =
        grandTotalEmployees > 0
          ? Number(((c.totalEmployees / grandTotalEmployees) * 100).toFixed(1))
          : 0;
      c.otHoursSharePct =
        grandApprovedHours > 0
          ? Number(((c.totalApprovedOtHours / grandApprovedHours) * 100).toFixed(1))
          : 0;
    });

    const topCompany = companySummaries[0] || null;

    const kpis: IntercompanyOvertimeKpis = {
      totalEmployees: grandTotalEmployees,
      totalOtRequests: grandTotalRequests,
      totalApprovedOtRequests: grandApprovedRequests,
      totalPendingOtRequests: grandPendingRequests,
      totalRejectedOtRequests: grandRejectedRequests,
      totalFiledOtHours: grandFiledHours,
      totalApprovedOtHours: grandApprovedHours,
      totalActualOtHours: grandApprovedHours,
      otApprovalRate:
        grandTotalRequests > 0
          ? Math.round((grandApprovedRequests / grandTotalRequests) * 100)
          : 0,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      topOtCompany: topCompany?.companyName || "N/A",
      topOtHours: topCompany?.totalApprovedOtHours || 0,
    };

    const responseData: IntercompanyOvertimeResponse = {
      startDate,
      endDate,
      generatedAt: now.toISOString(),
      kpis,
      companySummaries,
    };

    memoryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error("[Intercompany Overtime Route Error]:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

