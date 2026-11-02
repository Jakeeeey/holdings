import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyPunctualitySummary,
  IntercompanyPunctualityKpis,
  IntercompanyPunctualityResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-punctuality/types";
import { FALLBACK_PUNCTUALITY_DATA } from "@/modules/holdings/executive-dashboard/intercompany-punctuality/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedPunctuality {
  data: IntercompanyPunctualityResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedPunctuality>();
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

function parseTimeToMinutes(rawTimeIn: unknown): number | null {
  if (!rawTimeIn || typeof rawTimeIn !== "string") return null;
  const s = rawTimeIn.trim();
  if (!s) return null;

  const timePart = s.includes("T") ? s.split("T")[1] : s;
  const match = timePart.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (isNaN(h) || isNaN(m)) return null;

  const upper = s.toUpperCase();
  if (upper.includes("PM") && h < 12) {
    h += 12;
  } else if (upper.includes("AM") && h === 12) {
    h = 0;
  }

  return h * 60 + m;
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find((g) => String(g.id) === groupId) ||
      groups.find(
        (g) =>
          g.category === "intercompany-punctuality" ||
          g.category === "punctuality" ||
          g.category === "punctuality-report"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Punctuality Route] fetchDashboardGroups error:", e);
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

    const cacheKey = `punctuality_${groupId}_${startDate}_${endDate}`;
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
      console.warn("[Intercompany Punctuality] No valid companies found, returning fallback data");
      return NextResponse.json(FALLBACK_PUNCTUALITY_DATA);
    }

    const userFields = "user_id,is_employee,is_deleted,isDeleted";
    const logFields = "log_id,user_id,log_date,time_in,time_out,status,approve_status";

    // 2. Query each company's employees and attendance logs concurrently
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

        const [usersRes, logsRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/attendance_log?limit=-1&fields=${logFields}&filter[log_date][_gte]=${startDate}&filter[log_date][_lte]=${endDate}`,
            compHeaders,
            6000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          logs: logsRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const companySummaries: CompanyPunctualitySummary[] = [];

    let grandTotalStaff = 0;
    let grandTotalLogs = 0;
    let grandOnTime = 0;
    let grandGracePeriod = 0;
    let grandModerateLate = 0;
    let grandSevereLate = 0;
    let grandTotalLate = 0;
    let grandUndertime = 0;
    let grandDelayMinutes = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, users, logs, isOnline } = res.value;

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalEmployees: 0,
          totalLogs: 0,
          onTimeCount: 0,
          gracePeriodCount: 0,
          moderateLateCount: 0,
          severeLateCount: 0,
          totalLateCount: 0,
          undertimeCount: 0,
          punctualityRate: 0,
          avgDelayMinutes: 0,
          punctualitySharePct: 0,
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
      grandTotalStaff += totalEmployees;

      let compOnTime = 0;
      let compGrace = 0;
      let compModerateLate = 0;
      let compSevereLate = 0;
      let compUndertime = 0;
      let compDelayMinutes = 0;

      // Scheduled start = 08:00 AM (480 minutes)
      const standardStartMinutes = 8 * 60; // 480 mins

      for (const log of logs) {
        const timeInMin = parseTimeToMinutes(log.time_in);
        if (timeInMin === null) continue;

        if (timeInMin <= standardStartMinutes) {
          compOnTime++;
        } else if (timeInMin <= standardStartMinutes + 15) {
          compGrace++;
          compDelayMinutes += timeInMin - standardStartMinutes;
        } else if (timeInMin <= standardStartMinutes + 30) {
          compModerateLate++;
          compDelayMinutes += timeInMin - standardStartMinutes;
        } else {
          compSevereLate++;
          compDelayMinutes += timeInMin - standardStartMinutes;
        }

        // Undertime check: e.g. clocked out before 17:00 (1020 mins)
        const timeOutMin = parseTimeToMinutes(log.time_out);
        if (timeOutMin !== null && timeOutMin < 17 * 60) {
          compUndertime++;
        }
      }

      const totalLogs = compOnTime + compGrace + compModerateLate + compSevereLate;
      const totalLate = compModerateLate + compSevereLate;
      const compliantLogs = compOnTime + compGrace;
      const punctualityRate =
        totalLogs > 0 ? Number(((compliantLogs / totalLogs) * 100).toFixed(1)) : 100;
      const lateAndGraceCount = compGrace + compModerateLate + compSevereLate;
      const avgDelayMinutes =
        lateAndGraceCount > 0 ? Number((compDelayMinutes / lateAndGraceCount).toFixed(1)) : 0;

      grandTotalLogs += totalLogs;
      grandOnTime += compOnTime;
      grandGracePeriod += compGrace;
      grandModerateLate += compModerateLate;
      grandSevereLate += compSevereLate;
      grandTotalLate += totalLate;
      grandUndertime += compUndertime;
      grandDelayMinutes += compDelayMinutes;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees,
        totalLogs,
        onTimeCount: compOnTime,
        gracePeriodCount: compGrace,
        moderateLateCount: compModerateLate,
        severeLateCount: compSevereLate,
        totalLateCount: totalLate,
        undertimeCount: compUndertime,
        punctualityRate,
        avgDelayMinutes,
        punctualitySharePct: 0,
      });
    }

    if (grandTotalLogs === 0 && companySummaries.every((c) => c.status === "OFFLINE")) {
      return NextResponse.json(FALLBACK_PUNCTUALITY_DATA);
    }

    // Calculate share of total on-time / compliant logs
    const grandCompliantLogs = grandOnTime + grandGracePeriod;
    for (const c of companySummaries) {
      const compCompliant = c.onTimeCount + c.gracePeriodCount;
      c.punctualitySharePct =
        grandCompliantLogs > 0 ? Number(((compCompliant / grandCompliantLogs) * 100).toFixed(1)) : 0;
    }

    const overallPunctualityRate =
      grandTotalLogs > 0
        ? Number(((grandCompliantLogs / grandTotalLogs) * 100).toFixed(1))
        : 100;

    const totalDelayedCount = grandGracePeriod + grandModerateLate + grandSevereLate;
    const overallAvgDelayMinutes =
      totalDelayedCount > 0
        ? Number((grandDelayMinutes / totalDelayedCount).toFixed(1))
        : 0;

    // Find top punctual company with logs
    const topCompany = [...companySummaries]
      .filter((c) => c.totalLogs > 0)
      .sort((a, b) => b.punctualityRate - a.punctualityRate)[0];

    const kpis: IntercompanyPunctualityKpis = {
      totalStaff: grandTotalStaff,
      totalPresentLogs: grandTotalLogs,
      onTimeCount: grandOnTime,
      totalLateCount: grandTotalLate,
      gracePeriodCount: grandGracePeriod,
      undertimeCount: grandUndertime,
      overallPunctualityRate,
      avgDelayMinutes: overallAvgDelayMinutes,
      topPunctualCompany: topCompany ? topCompany.companyName : "N/A",
      topPunctualRate: topCompany ? topCompany.punctualityRate : 100,
    };

    const responsePayload: IntercompanyPunctualityResponse = {
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
    console.error("[Intercompany Punctuality Route Error]:", error);
    return NextResponse.json(FALLBACK_PUNCTUALITY_DATA);
  }
}

