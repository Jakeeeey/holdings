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

const getCompanyHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const normalizeTypeName = (str?: string | null): string => {
  if (!str) return "";
  return str.toLowerCase().replace(/['"`\s\-_.]/g, "").trim();
};

export const fetchDashboardData = async (): Promise<PermitDashboardData> => {
  // Only query active compliance requirement permit types matching Permit Creation
  const typesEndpoint = `${API_BASE_URL}/items/permit_types?filter[is_active][_neq]=0&limit=-1&sort=name`;
  const companiesEndpoint = `${API_BASE_URL}/items/company_list?limit=-1&sort=company_name`;

  const [typesRes, companiesRes] = await Promise.allSettled([
    fetch(typesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
    fetch(companiesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
  ]);

  let rawTypes: Array<Record<string, unknown>> = [];
  let rawCompanies: Array<Record<string, unknown>> = [];

  if (typesRes.status === "fulfilled" && typesRes.value.ok) {
    const json = await typesRes.value.json();
    rawTypes = json.data || [];
  }

  if (companiesRes.status === "fulfilled" && companiesRes.value.ok) {
    const json = await companiesRes.value.json();
    rawCompanies = json.data || [];
  }

  // Pre-index master permit types by normalized name for robust cross-tenant mapping
  const masterTypeByName = new Map<string, string>();
  for (const t of rawTypes) {
    const tName = String(t.name || t.permit_type_name || "");
    const normalized = normalizeTypeName(tName);
    const tId = String(t.id);
    if (normalized) masterTypeByName.set(normalized, tId);
  }

  // Parallel fetch permits directly from each company's Directus
  const rawPermits: Array<Record<string, unknown>> = [];
  const companyErrorMap = new Map<number, string>();
  const companyStatusMap = new Map<number, "online" | "offline" | "unconfigured">();

  await Promise.allSettled(
    rawCompanies.map(async (c) => {
      const rawDirectus = (c.directus as string) || null;
      const rawToken = (c.directus_token as string) || null;
      const isConfigured = Boolean(rawDirectus && rawDirectus.trim() && rawToken && rawToken.trim());
      const companyId = Number(c.company_id || c.id);

      if (!isConfigured || !rawDirectus || !rawToken) {
        companyStatusMap.set(companyId, "unconfigured");
        companyErrorMap.set(companyId, "Directus URL or token missing");
        return;
      }

      try {
        const compBase = rawDirectus.trim().endsWith("/") ? rawDirectus.trim().slice(0, -1) : rawDirectus.trim();
        const compHeaders = getCompanyHeaders(rawToken);

        // Fetch local types for mapping
        const compTypesRes = await fetch(`${compBase}/items/permit_types?limit=-1`, {
          headers: compHeaders,
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        });

        const compTypeMap = new Map<number | string, string>();
        if (compTypesRes.ok) {
          const compTypesData = await compTypesRes.json();
          for (const ct of compTypesData.data || []) {
            const ctName = String(ct.name || ct.permit_type_name || "");
            const normalized = normalizeTypeName(ctName);
            compTypeMap.set(ct.id, normalized);
            compTypeMap.set(String(ct.id), normalized);
          }
        }

        const compPermitsRes = await fetch(
          `${compBase}/items/permits?filter[company_id][_eq]=${companyId}&limit=-1&sort=-id`,
          {
            headers: compHeaders,
            signal: AbortSignal.timeout(5000),
            cache: "no-store",
          }
        );

        if (compPermitsRes.ok) {
          companyStatusMap.set(companyId, "online");
          const compPermitsData = await compPermitsRes.json();
          for (const item of compPermitsData.data || []) {
            if (item.company_id && Number(item.company_id) !== companyId) {
              continue;
            }

            const localTypeName = compTypeMap.get(item.permit_type_id) || "";
            const matchedMasterTypeId = localTypeName ? masterTypeByName.get(localTypeName) : null;

            rawPermits.push({
              ...item,
              company_id: companyId,
              permit_type_id: matchedMasterTypeId || item.permit_type_id,
            });
          }
        } else {
          companyStatusMap.set(companyId, "offline");
          const errorText = compPermitsRes.status === 403
            ? "HTTP 403: Forbidden (Role permissions required for permits collection)"
            : `HTTP ${compPermitsRes.status}: ${compPermitsRes.statusText || "Instance error"}`;
          companyErrorMap.set(companyId, errorText);
        }
      } catch (err) {
        companyStatusMap.set(companyId, "offline");
        const isTimeout = err instanceof Error && err.name === "TimeoutError";
        companyErrorMap.set(
          companyId,
          isTimeout ? "Connection Timeout (Instance offline/unreachable)" : "Network/Host unreachable"
        );
      }
    })
  );

  // Fallback to Master permits if all company instances were offline or empty
  if (rawPermits.length === 0) {
    try {
      const backupPermitsRes = await fetch(`${API_BASE_URL}/items/permits?limit=-1&sort=-id`, {
        headers: getHeaders(),
        cache: "no-store",
      });
      if (backupPermitsRes.ok) {
        const backupJson = await backupPermitsRes.json();
        rawPermits.push(...(backupJson.data || []));
      }
    } catch (fallbackErr) {
      console.warn("Dashboard Master permits fallback fetch failed:", fallbackErr);
    }
  }

  // Maps for fast lookup
  const companyMap = new Map<number, { name: string; code: string; directus?: string | null }>();
  for (const c of rawCompanies) {
    const id = Number(c.company_id || c.id);
    companyMap.set(id, {
      name: String(c.company_name || c.name || "Unknown Company"),
      code: String(c.company_code || c.code || ""),
      directus: (c.directus as string) || null,
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

    // Sort by expiration date descending, tie-breaking by id descending
    // This strictly matches Permit Creation and HRM Permit logic
    const sortedCompPermits = [...rawCompPermits].sort((a, b) => {
      const dateA = a.expiry_date || a.expiration_date || "";
      const dateB = b.expiry_date || b.expiration_date || "";
      if (dateA && dateB && dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
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

    const rawDirectus = (c.directus as string) || null;
    const rawToken = (c.directus_token as string) || null;
    const isConfigured = Boolean(rawDirectus && rawDirectus.trim() && rawToken && rawToken.trim());
    const connectionStatus = companyStatusMap.get(compId) || (isConfigured ? "offline" : "unconfigured");
    const connectionError = companyErrorMap.get(compId) || null;

    return {
      company_id: compId,
      company_name: compName,
      company_code: compCode,
      company_logo: (c.company_logo as string) || null,
      company_address: (c.company_address as string) || null,
      company_tin: (c.company_tin as string) || null,
      directus: rawDirectus,
      is_directus_configured: isConfigured,
      connection_status: connectionStatus,
      connection_error: connectionError,
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

  // Overall combined archive list (direct archived + superseded) with strict ID-based deduplication
  const archivedMap = new Map<string, DashboardPermitItem>();
  for (const ap of archivedPermitsList) {
    archivedMap.set(`${ap.company_id}_${ap.id}`, ap);
  }
  for (const comp of companiesHealth) {
    for (const ap of comp.archived_permits) {
      const key = `${ap.company_id}_${ap.id}`;
      if (!archivedMap.has(key)) {
        archivedMap.set(key, ap);
      }
    }
  }

  const fullArchivedList = Array.from(archivedMap.values()).sort((a, b) => {
    const dateA = new Date(a.expiration_date || 0).getTime();
    const dateB = new Date(b.expiration_date || 0).getTime();
    return dateB - dateA;
  });

  const onlineCompaniesCount = companiesHealth.filter(
    (c) => c.connection_status === "online"
  ).length;
  const offlineCompaniesCount = companiesHealth.filter(
    (c) => c.connection_status === "offline"
  ).length;

  const totalMonitoredCount = activeMonitoredPermits.length;
  const overallComplianceRate =
    totalMonitoredCount > 0
      ? Math.round(((totalActive + totalExpiring) / totalMonitoredCount) * 100)
      : onlineCompaniesCount > 0 ? 100 : 0;

  const summary: PermitDashboardSummary = {
    total_companies: rawCompanies.length,
    online_companies_count: onlineCompaniesCount,
    offline_companies_count: offlineCompaniesCount,
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
