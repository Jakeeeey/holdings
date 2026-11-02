import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyAttendanceSummary,
  IntercompanyAttendanceKpis,
  IntercompanyAttendanceResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-attendance-report/types";
import { FALLBACK_ATTENDANCE_DATA } from "@/modules/holdings/executive-dashboard/intercompany-attendance-report/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedAttendance {
  data: IntercompanyAttendanceResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedAttendance>();
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
          g.category === "intercompany-attendance-report" ||
          g.category === "attendance-report" ||
          g.category === "attendance" ||
          g.category === "intercompany_attendance_report"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Intercompany Attendance Route] fetchDashboardGroups error:", e);
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

    const cacheKey = `att_${groupId}_${startDate}_${endDate}`;
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
      console.warn("[Intercompany Attendance] No valid companies found, returning fallback data");
      return NextResponse.json(FALLBACK_ATTENDANCE_DATA);
    }

    const userFields = "user_id,is_employee,is_deleted,isDeleted";
    const logFields = "log_id,user_id,log_date,time_in,time_out,status,approve_status";
    const leaveFilter = `filter[status][_neq]=rejected&filter[leave_start][_lte]=${endDate}&filter[leave_end][_gte]=${startDate}`;

    // 2. Query each company's employees, attendance logs, and leave requests concurrently
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

        const [usersRes, logsRes, leavesRes] = await Promise.all([
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
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/leave_request?limit=-1&fields=leave_id,user_id,status,leave_start,leave_end&${leaveFilter}`,
            compHeaders,
            4000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          logs: logsRes.data,
          leaves: leavesRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const companySummaries: CompanyAttendanceSummary[] = [];

    let grandTotalWorkforce = 0;
    let grandPresent = 0;
    let grandOnTime = 0;
    let grandLate = 0;
    let grandAbsent = 0;
    let grandLeave = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const { companyId, companyName, companyCode, users, logs, leaves, isOnline } = res.value;

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalEmployees: 0,
          presentCount: 0,
          onTimeCount: 0,
          lateCount: 0,
          absentCount: 0,
          leaveCount: 0,
          attendanceRate: 0,
          punctualityRate: 0,
          attendanceSharePct: 0,
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
      grandTotalWorkforce += totalEmployees;

      // Group logs and leaves by user
      const userLogsMap = new Map<number, AnyRec[]>();
      for (const log of logs) {
        const uid = Number(log.user_id);
        if (!userLogsMap.has(uid)) userLogsMap.set(uid, []);
        userLogsMap.get(uid)!.push(log);
      }

      const userLeavesSet = new Set<number>();
      for (const l of leaves) {
        const uid = Number(l.user_id);
        userLeavesSet.add(uid);
      }

      let compPresent = 0;
      let compOnTime = 0;
      let compLate = 0;
      let compLeave = 0;
      let compAbsent = 0;

      // Standard shift: 8:00 AM (480 mins) + 15 min grace (495 mins)
      const graceCutoff = 8 * 60 + 15;

      for (const emp of activeEmployees) {
        const uid = Number(emp.user_id);
        const userLogs = userLogsMap.get(uid);

        if (userLogs && userLogs.length > 0) {
          compPresent++;
          const firstLog = userLogs[0];
          const timeInMin = parseTimeToMinutes(firstLog.time_in);
          if (timeInMin !== null && timeInMin <= graceCutoff) {
            compOnTime++;
          } else {
            compLate++;
          }
        } else if (userLeavesSet.has(uid)) {
          compLeave++;
        } else {
          compAbsent++;
        }
      }

      const compAttendanceRate =
        totalEmployees > 0
          ? Number((((compPresent + compLeave) / totalEmployees) * 100).toFixed(1))
          : 100;

      const compPunctualityRate =
        compPresent > 0 ? Number(((compOnTime / compPresent) * 100).toFixed(1)) : 100;

      grandPresent += compPresent;
      grandOnTime += compOnTime;
      grandLate += compLate;
      grandLeave += compLeave;
      grandAbsent += compAbsent;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees,
        presentCount: compPresent,
        onTimeCount: compOnTime,
        lateCount: compLate,
        absentCount: compAbsent,
        leaveCount: compLeave,
        attendanceRate: compAttendanceRate,
        punctualityRate: compPunctualityRate,
        attendanceSharePct: 0,
      });
    }

    if (grandTotalWorkforce === 0 && companySummaries.every((c) => c.status === "OFFLINE")) {
      return NextResponse.json(FALLBACK_ATTENDANCE_DATA);
    }

    // Calculate share of total present workforce
    for (const c of companySummaries) {
      c.attendanceSharePct =
        grandPresent > 0 ? Number(((c.presentCount / grandPresent) * 100).toFixed(1)) : 0;
    }

    const overallAttendanceRate =
      grandTotalWorkforce > 0
        ? Number((((grandPresent + grandLeave) / grandTotalWorkforce) * 100).toFixed(1))
        : 100;

    const overallPunctualityRate =
      grandPresent > 0 ? Number(((grandOnTime / grandPresent) * 100).toFixed(1)) : 100;

    const topCompany = [...companySummaries]
      .filter((c) => c.totalEmployees > 0)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)[0];

    const kpis: IntercompanyAttendanceKpis = {
      totalWorkforce: grandTotalWorkforce,
      totalPresent: grandPresent,
      totalOnTime: grandOnTime,
      totalLate: grandLate,
      totalAbsent: grandAbsent,
      totalOnLeave: grandLeave,
      overallAttendanceRate,
      overallPunctualityRate,
      topAttendanceCompany: topCompany ? topCompany.companyName : "N/A",
      topAttendanceRate: topCompany ? topCompany.attendanceRate : 100,
    };

    const responsePayload: IntercompanyAttendanceResponse = {
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
    console.error("[Intercompany Attendance Route Error]:", error);
    return NextResponse.json(FALLBACK_ATTENDANCE_DATA);
  }
}
