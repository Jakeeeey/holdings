import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyVacanciesSummary,
  IntercompanyVacanciesKpis,
  IntercompanyVacanciesResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-vacancies/types";
import { FALLBACK_VACANCIES_DATA } from "@/modules/holdings/executive-dashboard/intercompany-vacancies/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedVacancies {
  data: IntercompanyVacanciesResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedVacancies>();
const CACHE_TTL_MS = 30000; // 30s

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
      groups.find(
        (g) =>
          g.category === "intercompany-vacancies" ||
          g.category === "vacancies" ||
          g.category === "vacancies-report" ||
          g.category === "job-vacancies" ||
          g.category === "intercompany_vacancies"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Vacancies Route] fetchDashboardGroups error:", e);
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

    const cacheKey = `vacancies_${groupId}_${startDate}_${endDate}`;
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
      console.warn("[Intercompany Vacancies] No valid companies found, returning fallback data");
      return NextResponse.json(FALLBACK_VACANCIES_DATA);
    }

    // 2. Query each company's manpower_requests and recommendations concurrently
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

        const [reqsRes, recsRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/manpower_request?limit=-1&fields=id,request_no,position,no_manpower_needed,purpose,status,created_at`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/manpower_recommendation?limit=-1&fields=id,manpower_request_id,status`,
            compHeaders,
            4000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          requests: reqsRes.data,
          recommendations: recsRes.data,
          isOnline: reqsRes.ok,
        };
      })
    );

    const companySummaries: CompanyVacanciesSummary[] = [];

    let grandOpenVacancies = 0;
    let grandRequisitions = 0;
    let grandReplacementRoles = 0;
    let grandNewPositionRoles = 0;
    let grandCriticalRoles = 0;
    let grandTotalAgingDays = 0;
    let grandRolesWithAging = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, requests, recommendations, isOnline } = res.value;

      if (!isOnline && requests.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          openVacancies: 0,
          totalNeeded: 0,
          hiredCount: 0,
          activeRequisitions: 0,
          criticalCount: 0,
          avgAgingDays: 0,
          sharePercentage: 0,
        });
        continue;
      }

      // Group recommendations by manpower_request_id
      const hiredMap = new Map<number, number>();
      for (const rec of recommendations) {
        const reqId = Number(rec.manpower_request_id);
        const status = String(rec.status || "").toLowerCase();
        if (status === "hired" || status === "approved") {
          hiredMap.set(reqId, (hiredMap.get(reqId) || 0) + 1);
        }
      }

      let compOpenVacancies = 0;
      let compTotalNeeded = 0;
      let compHiredCount = 0;
      let compActiveReqs = 0;
      let compCriticalCount = 0;
      let compAgingDaysSum = 0;

      for (const req of requests) {
        const needed = Number(req.no_manpower_needed) || 1;
        const reqId = Number(req.id);
        const hired = hiredMap.get(reqId) || 0;
        const open = Math.max(0, needed - hired);

        if (open > 0) {
          compOpenVacancies += open;
          compTotalNeeded += needed;
          compHiredCount += hired;
          compActiveReqs++;

          // Aging calculation
          const createdAt = req.created_at ? new Date(req.created_at as string) : new Date();
          const agingDays = Math.max(0, Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
          compAgingDaysSum += agingDays;

          if (agingDays > 45) {
            compCriticalCount++;
            grandCriticalRoles += open;
          }

          // Purpose
          const purpose = String(req.purpose || "").toLowerCase();
          if (purpose.includes("replacement")) {
            grandReplacementRoles += open;
          } else {
            grandNewPositionRoles += open;
          }
        }
      }

      const avgAgingDays =
        compActiveReqs > 0 ? Number((compAgingDaysSum / compActiveReqs).toFixed(1)) : 0;

      grandOpenVacancies += compOpenVacancies;
      grandRequisitions += compActiveReqs;
      grandTotalAgingDays += compAgingDaysSum;
      grandRolesWithAging += compActiveReqs;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        openVacancies: compOpenVacancies,
        totalNeeded: compTotalNeeded,
        hiredCount: compHiredCount,
        activeRequisitions: compActiveReqs,
        criticalCount: compCriticalCount,
        avgAgingDays,
        sharePercentage: 0,
      });
    }

    if (grandOpenVacancies === 0 && companySummaries.every((c) => c.status === "OFFLINE")) {
      return NextResponse.json(FALLBACK_VACANCIES_DATA);
    }

    // Share percentage
    for (const c of companySummaries) {
      c.sharePercentage =
        grandOpenVacancies > 0
          ? Number(((c.openVacancies / grandOpenVacancies) * 100).toFixed(1))
          : 0;
    }

    const overallAvgAgingDays =
      grandRolesWithAging > 0
        ? Number((grandTotalAgingDays / grandRolesWithAging).toFixed(1))
        : 30;

    // Top vacancies entity
    const topComp = [...companySummaries]
      .filter((c) => c.openVacancies > 0)
      .sort((a, b) => b.openVacancies - a.openVacancies)[0];

    const kpis: IntercompanyVacanciesKpis = {
      totalOpenVacancies: grandOpenVacancies,
      totalRequisitions: grandRequisitions,
      replacementRoles: grandReplacementRoles,
      newPositionRoles: grandNewPositionRoles,
      avgAgingDays: overallAvgAgingDays,
      criticalRolesCount: grandCriticalRoles,
      topVacanciesCompany: topComp ? topComp.companyName : "N/A",
      topVacanciesCount: topComp ? topComp.openVacancies : 0,
    };

    const responsePayload: IntercompanyVacanciesResponse = {
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
    console.error("[Intercompany Vacancies Route Error]:", error);
    return NextResponse.json(FALLBACK_VACANCIES_DATA);
  }
}
