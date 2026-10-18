import {
  HealthLevel,
  DashboardPermitItem,
  CompanyHealthRecord,
  PermitDashboardSummary,
  PermitDashboardData,
} from "../types/permit-dashboard.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  return headers;
};

export const fetchDashboardData = async (): Promise<PermitDashboardData> => {
  const permitEndpoint = `${API_BASE_URL}/items/permits?limit=-1&sort=-id`;
  const typesEndpoint = `${API_BASE_URL}/items/permit_types?limit=-1&sort=name`;
  const companiesEndpoint = `${API_BASE_URL}/items/company_list?limit=-1&sort=company_name`;

  const [permitsRes, typesRes, companiesRes] = await Promise.allSettled([
    fetch(permitEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
    fetch(typesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
    fetch(companiesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
  ]);

  let rawPermits: Array<Record<string, unknown>> = [];
  let rawTypes: Array<Record<string, unknown>> = [];
  let rawCompanies: Array<Record<string, unknown>> = [];

  if (permitsRes.status === "fulfilled" && permitsRes.value.ok) {
    const json = await permitsRes.value.json();
    rawPermits = json.data || [];
  }

  if (typesRes.status === "fulfilled" && typesRes.value.ok) {
    const json = await typesRes.value.json();
    rawTypes = json.data || [];
  }

  if (companiesRes.status === "fulfilled" && companiesRes.value.ok) {
    const json = await companiesRes.value.json();
    rawCompanies = json.data || [];
  }

  // Maps for fast lookup
  const companyMap = new Map<number, { name: string; code: string }>();
  for (const c of rawCompanies) {
    const id = Number(c.company_id || c.id);
    companyMap.set(id, {
      name: String(c.company_name || c.name || "Unknown Company"),
      code: String(c.company_code || c.code || ""),
    });
  }

  const typeMap = new Map<string, string>();
  for (const t of rawTypes) {
    const id = String(t.id);
    const name = String(t.name || t.permit_type_name || `Permit Type ${t.id}`);
    typeMap.set(id, name);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return null;
    const clean = dateStr.substring(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
  };

  // Process all permits (Active vs Archived)
  const allParsedPermits: DashboardPermitItem[] = [];
  const archivedPermitsList: DashboardPermitItem[] = [];

  for (const p of rawPermits) {
    const companyId = Number(p.company_id);
    const companyInfo = companyMap.get(companyId) || {
      name: "Unknown Company",
      code: "",
    };
    const permitTypeId = String(p.permit_type_id);
    const permitTypeName = typeMap.get(permitTypeId) || "General Permit";
    const expirationDateStr = String(p.expiry_date || p.expiration_date || "");
    const rawStatus = (p.status as string) || "Active";

    let daysRemaining = 999;
    let healthLevel: HealthLevel = "healthy";
    let statusLabel: "Expired" | "Expiring Soon" | "Active" = "Active";

    if (expirationDateStr) {
      const expDate = parseSafeDate(expirationDateStr);
      if (expDate) {
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          healthLevel = "critical";
          statusLabel = "Expired";
        } else if (daysRemaining <= 90) {
          // Standardized to 90 days (3 months) warning matching Permit Creation
          healthLevel = "warning";
          statusLabel = "Expiring Soon";
        } else {
          healthLevel = "healthy";
          statusLabel = "Active";
        }
      }
    }

    const item: DashboardPermitItem = {
      id: (p.id as number | string) || Math.random(),
      company_id: companyId,
      company_name: companyInfo.name,
      company_code: companyInfo.code,
      permit_type_id: permitTypeId,
      permit_type_name: permitTypeName,
      permit_number: String(p.permit_number || "No Permit Number"),
      issue_date: (p.issue_date as string) || (p.issued_date as string) || null,
      expiry_date: expirationDateStr,
      issued_date: (p.issue_date as string) || (p.issued_date as string) || null,
      expiration_date: expirationDateStr,
      file_url: (p.file_url as string) || "",
      issuing_agency: (p.issuing_agency as string) || null,
      days_remaining: daysRemaining,
      status_label: statusLabel,
      health_level: healthLevel,
      status: rawStatus,
      notes: (p.notes as string) || (p.remarks as string) || null,
      remarks: (p.notes as string) || (p.remarks as string) || null,
    };

    if (rawStatus === "Archived") {
      archivedPermitsList.push(item);
    } else {
      allParsedPermits.push(item);
    }
  }

  // Group active permits by company
  const companyActivePermitsMap = new Map<number, DashboardPermitItem[]>();
  for (const dp of allParsedPermits) {
    if (!companyActivePermitsMap.has(dp.company_id)) {
      companyActivePermitsMap.set(dp.company_id, []);
    }
    companyActivePermitsMap.get(dp.company_id)?.push(dp);
  }

  // Group archived permits by company
  const companyArchivedPermitsMap = new Map<number, DashboardPermitItem[]>();
  for (const ap of archivedPermitsList) {
    if (!companyArchivedPermitsMap.has(ap.company_id)) {
      companyArchivedPermitsMap.set(ap.company_id, []);
    }
    companyArchivedPermitsMap.get(ap.company_id)?.push(ap);
  }

  let totalActive = 0;
  let totalExpiring = 0;
  let totalExpired = 0;
  const activeMonitoredPermits: DashboardPermitItem[] = [];

  const companiesHealth: CompanyHealthRecord[] = rawCompanies.map((c) => {
    const compId = Number(c.company_id || c.id);
    const compName = String(c.company_name || c.name || "Unknown Company");
    const compCode = String(c.company_code || c.code || "");
    const rawCompPermits = companyActivePermitsMap.get(compId) || [];
    const directArchived = companyArchivedPermitsMap.get(compId) || [];

    // Sort by id descending (newest created record first) to match Permit Creation precedence
    const sortedCompPermits = [...rawCompPermits].sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    });

    // Separate latest active per permit type vs historical/superseded permits
    const typeLatestMap = new Map<string, DashboardPermitItem>();
    const supersededPermits: DashboardPermitItem[] = [];

    for (const p of sortedCompPermits) {
      const typeKey = String(p.permit_type_id);
      if (!typeLatestMap.has(typeKey)) {
        typeLatestMap.set(typeKey, p);
      } else {
        supersededPermits.push(p);
      }
    }

    const currentActivePermits = Array.from(typeLatestMap.values());
    const compAllArchived = [...directArchived, ...supersededPermits].sort((a, b) => {
      const dateA = new Date(a.expiration_date || 0).getTime();
      const dateB = new Date(b.expiration_date || 0).getTime();
      return dateB - dateA;
    });

    const activeCount = currentActivePermits.filter((p) => p.health_level === "healthy").length;
    const expiringCount = currentActivePermits.filter((p) => p.health_level === "warning").length;
    const expiredCount = currentActivePermits.filter((p) => p.health_level === "critical").length;
    const totalCurrent = currentActivePermits.length;

    totalActive += activeCount;
    totalExpiring += expiringCount;
    totalExpired += expiredCount;

    for (const p of currentActivePermits) {
      activeMonitoredPermits.push(p);
    }

    let companyHealth: HealthLevel = "healthy";
    if (totalCurrent === 0) {
      companyHealth = "unmonitored";
    } else if (expiredCount > 0) {
      companyHealth = "critical";
    } else if (expiringCount > 0) {
      companyHealth = "warning";
    }

    // Compliance calculation based on active vs expired permits (0% if no permits registered)
    const compliance =
      totalCurrent > 0 ? Math.round(((activeCount + expiringCount) / totalCurrent) * 100) : 0;

    return {
      company_id: compId,
      company_name: compName,
      company_code: compCode,
      company_logo: (c.company_logo as string) || null,
      company_address: (c.company_address as string) || null,
      company_tin: (c.company_tin as string) || null,
      total_permits: totalCurrent,
      active_count: activeCount,
      expiring_count: expiringCount,
      expired_count: expiredCount,
      compliance_percentage: compliance,
      health_level: companyHealth,
      permits: currentActivePermits,
      archived_permits: compAllArchived,
    };
  });

  // Sort companies: critical first, then warning, then healthy, then unmonitored last
  const healthWeight: Record<HealthLevel, number> = {
    critical: 0,
    warning: 1,
    healthy: 2,
    unmonitored: 3,
  };
  companiesHealth.sort((a, b) => healthWeight[a.health_level] - healthWeight[b.health_level]);

  // Urgent expiries: Expired and within 90 days (3 months), sorted by urgency
  const urgentExpiries = activeMonitoredPermits
    .filter((p) => p.health_level === "critical" || p.health_level === "warning")
    .sort((a, b) => a.days_remaining - b.days_remaining);

  // Overall combined archive list (direct archived + superseded)
  const fullArchivedList = [
    ...archivedPermitsList,
    ...companiesHealth.flatMap((c) => c.archived_permits.filter((ap) => ap.status !== "Archived")),
  ].sort((a, b) => {
    const dateA = new Date(a.expiration_date || 0).getTime();
    const dateB = new Date(b.expiration_date || 0).getTime();
    return dateB - dateA;
  });

  const totalMonitoredCount = activeMonitoredPermits.length;
  const overallComplianceRate =
    totalMonitoredCount > 0
      ? Math.round(((totalActive + totalExpiring) / totalMonitoredCount) * 100)
      : 100;

  const summary: PermitDashboardSummary = {
    total_companies: rawCompanies.length,
    total_permits: totalMonitoredCount,
    active_count: totalActive,
    expiring_count: totalExpiring,
    expired_count: totalExpired,
    archived_count: fullArchivedList.length,
    overall_compliance_rate: overallComplianceRate,
    critical_permits_count: totalExpired + totalExpiring,
  };

  return {
    summary,
    companies_health: companiesHealth,
    urgent_expiries: urgentExpiries,
    archived_permits: fullArchivedList,
  };
};
