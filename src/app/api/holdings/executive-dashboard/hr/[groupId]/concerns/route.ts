import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyConcernsSummary,
  IntercompanyConcernsKpis,
  IntercompanyConcernsResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-concerns/types";
import { FALLBACK_CONCERNS_DATA } from "@/modules/holdings/executive-dashboard/intercompany-concerns/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedConcerns {
  data: IntercompanyConcernsResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedConcerns>();
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
          g.category === "intercompany-concerns" ||
          g.category === "concerns" ||
          g.category === "employee-concerns" ||
          g.category === "concerns-report" ||
          g.category === "intercompany_concerns"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Concerns Route] fetchDashboardGroups error:", e);
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

    const cacheKey = `concerns_${groupId}_${startDate}_${endDate}`;
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
      console.warn("[Intercompany Concerns] No valid companies found, returning fallback data");
      return NextResponse.json(FALLBACK_CONCERNS_DATA);
    }

    // 2. Query each company's employee_concerns concurrently
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

        const concernsRes = await fetchDirectusWithTimeout<AnyRec>(
          `${companyUrl}/items/employee_concerns?limit=-1&fields=id,user_id,subject_of_concern,concern,is_anonymous,status,created_at`,
          compHeaders,
          5000
        );

        return {
          companyId,
          companyName,
          companyCode,
          concerns: concernsRes.data,
          isOnline: concernsRes.ok,
        };
      })
    );

    const companySummaries: CompanyConcernsSummary[] = [];
    const categoryCounts: Record<string, number> = {};

    let grandTotalConcerns = 0;
    let grandPendingCount = 0;
    let grandInReviewCount = 0;
    let grandResolvedCount = 0;
    let grandClosedCount = 0;
    let grandAnonymousCount = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, concerns, isOnline } = res.value;

      if (!isOnline && concerns.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalConcerns: 0,
          pendingCount: 0,
          inReviewCount: 0,
          resolvedCount: 0,
          closedCount: 0,
          anonymousCount: 0,
          resolutionRate: 0,
          sharePercentage: 0,
        });
        continue;
      }

      let compPending = 0;
      let compInReview = 0;
      let compResolved = 0;
      let compClosed = 0;
      let compAnonymous = 0;

      // Filter by date if created_at exists
      const filteredConcerns = concerns.filter((c) => {
        if (!c.created_at) return true;
        const dateStr = String(c.created_at).slice(0, 10);
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
        return true;
      });

      for (const c of filteredConcerns) {
        const rawStatus = String(c.status || "").toUpperCase();
        const isAnon =
          c.is_anonymous === true ||
          c.is_anonymous === 1 ||
          String(c.is_anonymous).toLowerCase() === "true";

        if (isAnon) compAnonymous++;

        if (rawStatus === "RESOLVED") {
          compResolved++;
        } else if (rawStatus === "CLOSED") {
          compClosed++;
        } else if (rawStatus === "IN_REVIEW" || rawStatus === "UNDER_REVIEW") {
          compInReview++;
        } else {
          compPending++;
        }

        const subject = String(c.subject_of_concern || "General / Workplace").trim() || "General / Workplace";
        categoryCounts[subject] = (categoryCounts[subject] || 0) + 1;
      }

      const compTotal = filteredConcerns.length;
      const compResolutionRate = compTotal > 0
        ? Math.round(((compResolved + compClosed) / compTotal) * 1000) / 10
        : 100;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: isOnline ? "ACTIVE" : "OFFLINE",
        totalConcerns: compTotal,
        pendingCount: compPending,
        inReviewCount: compInReview,
        resolvedCount: compResolved,
        closedCount: compClosed,
        anonymousCount: compAnonymous,
        resolutionRate: compResolutionRate,
        sharePercentage: 0, // calculated below
      });

      grandTotalConcerns += compTotal;
      grandPendingCount += compPending;
      grandInReviewCount += compInReview;
      grandResolvedCount += compResolved;
      grandClosedCount += compClosed;
      grandAnonymousCount += compAnonymous;
    }

    // Calculate sharePercentage for each company
    for (const comp of companySummaries) {
      comp.sharePercentage = grandTotalConcerns > 0
        ? Math.round((comp.totalConcerns / grandTotalConcerns) * 1000) / 10
        : 0;
    }

    // Sort companySummaries by totalConcerns descending
    companySummaries.sort((a, b) => b.totalConcerns - a.totalConcerns);

    // If all companies returned 0 concerns or were unreachable, fallback
    if (grandTotalConcerns === 0 && companySummaries.every((c) => c.status === "OFFLINE" || c.totalConcerns === 0)) {
      return NextResponse.json(FALLBACK_CONCERNS_DATA);
    }

    // Determine top concern category
    let topConcernCategory = "General / Workplace";
    let topCategoryCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > topCategoryCount) {
        topCategoryCount = count;
        topConcernCategory = cat;
      }
    }

    const topCompany = companySummaries[0];
    const grandResolutionRate = grandTotalConcerns > 0
      ? Math.round(((grandResolvedCount + grandClosedCount) / grandTotalConcerns) * 1000) / 10
      : 100;
    const grandAnonymousPercentage = grandTotalConcerns > 0
      ? Math.round((grandAnonymousCount / grandTotalConcerns) * 1000) / 10
      : 0;

    const kpis: IntercompanyConcernsKpis = {
      totalConcerns: grandTotalConcerns,
      pendingCount: grandPendingCount,
      inReviewCount: grandInReviewCount,
      resolvedCount: grandResolvedCount,
      closedCount: grandClosedCount,
      anonymousCount: grandAnonymousCount,
      anonymousPercentage: grandAnonymousPercentage,
      resolutionRate: grandResolutionRate,
      topConcernCategory,
      topConcernCompany: topCompany ? topCompany.companyName : "None",
      topConcernCount: topCompany ? topCompany.totalConcerns : 0,
    };

    const responsePayload: IntercompanyConcernsResponse = {
      kpis,
      companySummaries,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    memoryCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[Intercompany Concerns Route] Unexpected error:", error);
    return NextResponse.json(FALLBACK_CONCERNS_DATA);
  }
}
