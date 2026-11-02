import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  CompanyMasterlistSummary,
  IntercompanyEmployeeMasterlistKpis,
  IntercompanyEmployeeMasterlistResponse,
} from "@/modules/holdings/executive-dashboard/intercompany-employee-masterlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedMasterlist {
  data: IntercompanyEmployeeMasterlistResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedMasterlist>();
const CACHE_TTL_MS = 30000; // 30 seconds

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
      groups.find((g) => g.category === "intercompany-employee-masterlist") ||
      null
    );
  } catch (e) {
    console.error("[Intercompany HR Route] fetchDashboardGroups error:", e);
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

    const cacheKey = `hr_employee_masterlist_${groupId}`;
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

    const userFields =
      "user_id,user_fname,user_lname,user_department,is_employee,is_deleted,isDeleted,employment_status_id,user_dateOfHire,gender";

    // 2. Query each company concurrently
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

        const [usersRes, departmentsRes, statusesRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            5000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=department_id,department_name`,
            compHeaders,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employment_status?limit=-1&fields=id,name`,
            compHeaders,
            3000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          departments: departmentsRes.data,
          statuses: statusesRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const now = new Date();
    const currentYear = now.getFullYear();

    const companySummaries: CompanyMasterlistSummary[] = [];

    let grandActiveEmployees = 0;
    let grandRegular = 0;
    let grandProbationary = 0;
    let grandOtherStatus = 0;
    let grandNewHires = 0;
    let grandTenureMonthsSum = 0;
    let grandMale = 0;
    let grandFemale = 0;
    let activeCompaniesCount = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const {
        companyId,
        companyName,
        companyCode,
        users,
        departments,
        statuses,
        isOnline,
      } = res.value;

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalEmployees: 0,
          activeCount: 0,
          separatedCount: 0,
          regularCount: 0,
          probationaryCount: 0,
          otherStatusCount: 0,
          newHiresThisYear: 0,
          departmentCount: 0,
          avgTenureYears: 0,
          maleCount: 0,
          femaleCount: 0,
          headcountSharePct: 0,
        });
        continue;
      }

      activeCompaniesCount++;

      const statusMap = new Map<number, string>();
      const inactiveStatusIds = new Set<number>([7, 8]);
      statuses.forEach((s) => {
        const id = Number(s.id);
        const name = String(s.name || "").trim();
        if (id && name) {
          statusMap.set(id, name);
          const lower = name.toLowerCase();
          if (
            lower.includes("resign") ||
            lower.includes("terminat") ||
            lower.includes("inactive") ||
            lower.includes("separat") ||
            lower.includes("awol") ||
            lower.includes("end of contract")
          ) {
            inactiveStatusIds.add(id);
          }
        }
      });

      let compActive = 0;
      let compSeparated = 0;
      let compRegular = 0;
      let compProbationary = 0;
      let compOtherStatus = 0;
      let compNewHires = 0;
      let compTenureMonths = 0;
      let compMale = 0;
      let compFemale = 0;

      users.forEach((u) => {
        const isEmployee = parseBit(u.is_employee);
        if (!isEmployee) return;

        const isDeleted = parseBit(u.is_deleted) || parseBit(u.isDeleted);
        if (isDeleted) return;

        const userId = Number(u.user_id);
        if (!userId) return;

        const firstName = String(u.user_fname || "").trim();
        const lastName = String(u.user_lname || "").trim();
        const nameCombined = `${firstName} ${lastName}`.toLowerCase();
        if (
          nameCombined.includes("dummy") ||
          nameCombined.includes("throwaway") ||
          nameCombined.includes("qa test") ||
          nameCombined.includes("test account")
        ) {
          return;
        }

        const empStatusId = u.employment_status_id ? Number(u.employment_status_id) : null;
        const isInactive = empStatusId ? inactiveStatusIds.has(empStatusId) : false;

        if (isInactive) {
          compSeparated++;
          return;
        }

        compActive++;

        const empStatus = (empStatusId ? statusMap.get(empStatusId) : null) || "Regular";
        const empStatusLower = empStatus.toLowerCase();

        if (empStatusLower.includes("probation")) {
          compProbationary++;
        } else if (
          empStatusLower.includes("regular") ||
          empStatusLower.includes("permanent")
        ) {
          compRegular++;
        } else {
          compOtherStatus++;
        }

        const gender = String(u.gender || "").trim().toLowerCase();
        if (gender === "male" || gender === "m") {
          compMale++;
        } else if (gender === "female" || gender === "f") {
          compFemale++;
        }

        if (u.user_dateOfHire) {
          const hireDate = new Date(String(u.user_dateOfHire));
          if (!isNaN(hireDate.getTime())) {
            const hireYear = hireDate.getFullYear();
            if (hireYear === currentYear) {
              compNewHires++;
            }
            const diffMonths =
              (now.getFullYear() - hireYear) * 12 + (now.getMonth() - hireDate.getMonth());
            if (diffMonths >= 0) {
              compTenureMonths += diffMonths;
            }
          }
        }
      });

      const avgTenureYears =
        compActive > 0 ? Number(((compTenureMonths / compActive) / 12).toFixed(1)) : 0;

      grandActiveEmployees += compActive;
      grandRegular += compRegular;
      grandProbationary += compProbationary;
      grandOtherStatus += compOtherStatus;
      grandNewHires += compNewHires;
      grandTenureMonthsSum += compTenureMonths;
      grandMale += compMale;
      grandFemale += compFemale;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: compActive,
        activeCount: compActive,
        separatedCount: compSeparated,
        regularCount: compRegular,
        probationaryCount: compProbationary,
        otherStatusCount: compOtherStatus,
        newHiresThisYear: compNewHires,
        departmentCount: departments.length,
        avgTenureYears,
        maleCount: compMale,
        femaleCount: compFemale,
        headcountSharePct: 0,
      });
    }

    // Sort company summaries descending by headcount
    companySummaries.sort((a, b) => b.totalEmployees - a.totalEmployees);

    // Calculate share percentages
    companySummaries.forEach((c) => {
      c.headcountSharePct =
        grandActiveEmployees > 0
          ? Number(((c.totalEmployees / grandActiveEmployees) * 100).toFixed(1))
          : 0;
    });

    const grandAvgTenure =
      grandActiveEmployees > 0
        ? Number(((grandTenureMonthsSum / grandActiveEmployees) / 12).toFixed(1))
        : 0;

    const largestCompany = companySummaries[0] || null;

    const kpis: IntercompanyEmployeeMasterlistKpis = {
      totalEmployees: grandActiveEmployees,
      regularCount: grandRegular,
      probationaryCount: grandProbationary,
      otherStatusCount: grandOtherStatus,
      newHiresThisYear: grandNewHires,
      avgTenureYears: grandAvgTenure,
      maleCount: grandMale,
      femaleCount: grandFemale,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      largestCompanyName: largestCompany?.companyName || "N/A",
      largestCompanyCount: largestCompany?.totalEmployees || 0,
    };

    const responseData: IntercompanyEmployeeMasterlistResponse = {
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
    console.error("[Intercompany HR Route Error]:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

