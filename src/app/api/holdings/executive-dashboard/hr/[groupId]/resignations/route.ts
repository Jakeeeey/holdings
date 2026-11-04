import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyResignationSummary,
  IntercompanyResignationKpis,
  IntercompanyResignationResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-resignations/types";
import { FALLBACK_RESIGNATION_DATA } from "@/modules/holdings/executive-dashboard/intercompany-resignations/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedResignations {
  data: IntercompanyResignationResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedResignations>();
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

function calculateNoticeDays(filingDateStr?: string | null, resignationDateStr?: string | null): number {
  if (!filingDateStr || !resignationDateStr) return 30; // default standard
  const fileDate = new Date(filingDateStr);
  const resigDate = new Date(resignationDateStr);
  if (isNaN(fileDate.getTime()) || isNaN(resigDate.getTime())) return 30;
  const diffTime = resigDate.getTime() - fileDate.getTime();
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

function detectReasonCategory(reason: string): string {
  const text = (reason || "").toLowerCase();
  if (
    text.includes("career") ||
    text.includes("opportunity") ||
    text.includes("growth") ||
    text.includes("promotion") ||
    text.includes("offer")
  ) {
    return "Career Growth & Opportunity";
  }
  if (
    text.includes("salary") ||
    text.includes("pay") ||
    text.includes("compensation") ||
    text.includes("benefit")
  ) {
    return "Compensation & Benefits";
  }
  if (
    text.includes("relocat") ||
    text.includes("move") ||
    text.includes("commute") ||
    text.includes("travel")
  ) {
    return "Relocation & Commute";
  }
  if (
    text.includes("family") ||
    text.includes("personal") ||
    text.includes("care") ||
    text.includes("marriage")
  ) {
    return "Personal & Family Reasons";
  }
  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("sick")
  ) {
    return "Health & Medical";
  }
  return "General Resignation";
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find((g) => String(g.id) === groupId) ||
      groups.find(
        (g) =>
          g.category === "intercompany-resignations" ||
          g.category === "resignations" ||
          g.category === "resignation-report" ||
          g.category === "resignation" ||
          g.category === "intercompany_resignations"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Resignations Route] fetchDashboardGroups error:", e);
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
      searchParams.get("startDate")?.trim() || `${currentYear}-01-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `resig_${groupId}_${startDate}_${endDate}`;
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

    if (!validCompanies.length) {
      console.warn("[Intercompany Resignations] No valid companies found, returning fallback data");
      return NextResponse.json(FALLBACK_RESIGNATION_DATA);
    }

    const userFields = "user_id,is_employee,is_deleted,isDeleted";
    const resigFilter = `filter[resignation_date][_gte]=${startDate}&filter[resignation_date][_lte]=${endDate}`;

    // 2. Query each company's employees and resignations concurrently
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

        const [usersRes, reqRes, userResRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/resignation_request?limit=-1&fields=id,user_id,resignation_date,reason,status,filed_at&${resigFilter}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user_resignation?limit=-1&fields=id,user_id,filing_date,last_day,reason`,
            compHeaders,
            4000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          requests: reqRes.data,
          userResignations: userResRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const companySummaries: CompanyResignationSummary[] = [];

    let grandTotalEmployees = 0;
    let grandTotalResignations = 0;
    let grandPendingCount = 0;
    let grandApprovedCount = 0;
    let grandCompliantCount = 0;
    let grandTotalNoticeDays = 0;
    const reasonCounts = new Map<string, number>();

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, users, requests, userResignations, isOnline } = res.value;

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalResignations: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          completedCount: 0,
          avgNoticeDays: 0,
          complianceRate: 0,
          totalEmployees: 0,
          turnoverRate: 0,
          sharePercentage: 0,
        });
        continue;
      }

      // Filter active employees
      const activeEmployees = users.filter((u) => {
        const isEmp = parseBit(u.is_employee);
        const isDel = parseBit(u.is_deleted) || parseBit(u.isDeleted);
        return isEmp && !isDel;
      });

      const totalEmployees = activeEmployees.length;
      grandTotalEmployees += totalEmployees;

      // Combine requests and user resignations avoiding duplicates by userId
      const allResigRecords: { status: string; noticeDays: number; reason: string }[] = [];
      const seenUserIds = new Set<number>();

      for (const req of requests) {
        const uid = Number(req.user_id);
        if (uid && !seenUserIds.has(uid)) {
          seenUserIds.add(uid);
          const st = String(req.status || "PENDING").toUpperCase();
          const noticeDays = calculateNoticeDays(req.filed_at as string, req.resignation_date as string);
          const reason = String(req.reason || "");
          allResigRecords.push({ status: st, noticeDays, reason });
        }
      }

      for (const ur of userResignations) {
        const uid = Number(ur.user_id);
        if (uid && !seenUserIds.has(uid)) {
          seenUserIds.add(uid);
          const noticeDays = calculateNoticeDays(ur.filing_date as string, ur.last_day as string);
          const reason = String(ur.reason || "");
          allResigRecords.push({ status: "RECORDED", noticeDays, reason });
        }
      }

      let compPending = 0;
      let compApproved = 0;
      let compRejected = 0;
      let compCompleted = 0;
      let compCompliant = 0;
      let compNoticeDaysSum = 0;

      for (const rec of allResigRecords) {
        if (rec.status === "PENDING" || rec.status === "IN_REVIEW") {
          compPending++;
        } else if (rec.status === "APPROVED") {
          compApproved++;
        } else if (rec.status === "REJECTED") {
          compRejected++;
        } else {
          compCompleted++;
        }

        if (rec.noticeDays >= 30) {
          compCompliant++;
        }
        compNoticeDaysSum += rec.noticeDays;

        const reasonCat = detectReasonCategory(rec.reason);
        reasonCounts.set(reasonCat, (reasonCounts.get(reasonCat) || 0) + 1);
      }

      const totalResignations = allResigRecords.length;
      const avgNoticeDays =
        totalResignations > 0 ? Number((compNoticeDaysSum / totalResignations).toFixed(1)) : 30;
      const complianceRate =
        totalResignations > 0 ? Number(((compCompliant / totalResignations) * 100).toFixed(1)) : 100;
      const turnoverRate =
        totalEmployees > 0 ? Number(((totalResignations / totalEmployees) * 100).toFixed(1)) : 0;

      grandTotalResignations += totalResignations;
      grandPendingCount += compPending;
      grandApprovedCount += compApproved;
      grandCompliantCount += compCompliant;
      grandTotalNoticeDays += compNoticeDaysSum;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalResignations,
        pendingCount: compPending,
        approvedCount: compApproved,
        rejectedCount: compRejected,
        completedCount: compCompleted,
        avgNoticeDays,
        complianceRate,
        totalEmployees,
        turnoverRate,
        sharePercentage: 0,
      });
    }

    if (grandTotalResignations === 0 && companySummaries.every((c) => c.status === "OFFLINE")) {
      return NextResponse.json(FALLBACK_RESIGNATION_DATA);
    }

    // Share percentage
    for (const c of companySummaries) {
      c.sharePercentage =
        grandTotalResignations > 0
          ? Number(((c.totalResignations / grandTotalResignations) * 100).toFixed(1))
          : 0;
    }

    const overallTurnoverRate =
      grandTotalEmployees > 0
        ? Number(((grandTotalResignations / grandTotalEmployees) * 100).toFixed(1))
        : 0;

    const overallComplianceRate =
      grandTotalResignations > 0
        ? Number(((grandCompliantCount / grandTotalResignations) * 100).toFixed(1))
        : 100;

    const overallAvgNoticeDays =
      grandTotalResignations > 0
        ? Number((grandTotalNoticeDays / grandTotalResignations).toFixed(1))
        : 30;

    // Top reason
    let topReason = "Career Growth & Opportunity";
    let topReasonCount = 0;
    for (const [r, count] of reasonCounts.entries()) {
      if (count > topReasonCount) {
        topReasonCount = count;
        topReason = r;
      }
    }

    // Company with highest turnover rate
    const highestTurnoverComp = [...companySummaries]
      .filter((c) => c.totalEmployees > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate)[0];

    const kpis: IntercompanyResignationKpis = {
      totalResignations: grandTotalResignations,
      pendingCount: grandPendingCount,
      approvedCount: grandApprovedCount,
      turnoverRate: overallTurnoverRate,
      complianceRate: overallComplianceRate,
      avgNoticeDays: overallAvgNoticeDays,
      topResignationReason: topReason,
      highestTurnoverCompany: highestTurnoverComp ? highestTurnoverComp.companyName : "N/A",
      highestTurnoverRate: highestTurnoverComp ? highestTurnoverComp.turnoverRate : 0,
    };

    const responsePayload: IntercompanyResignationResponse = {
      kpis,
      companySummaries,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    memoryCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now(),
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[Intercompany Resignations Route Error]:", error);
    return NextResponse.json(FALLBACK_RESIGNATION_DATA);
  }
}
