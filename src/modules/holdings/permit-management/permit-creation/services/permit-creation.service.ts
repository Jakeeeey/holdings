import {
  PermitCompany,
  PermitTypeItem,
  PermitRecord,
  PermitCreationMatrixData,
  SyncOperationReport,
  CompanySyncResult,
} from "../types/permit-creation.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const normalizeUrl = (url?: string | null): string => {
  if (!url) return "";
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const getMasterHeaders = (): HeadersInit => {
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

/**
 * Fetch all companies from Master Directus (using .env.local).
 * Includes their individual directus URLs, directus tokens, and configuration status.
 */
export const fetchCompanyList = async (): Promise<PermitCompany[]> => {
  const companiesEndpoint = `${normalizeUrl(API_BASE_URL)}/items/company_list?limit=-1&sort=company_name`;
  const res = await fetch(companiesEndpoint, {
    method: "GET",
    headers: getMasterHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch companies from Master Directus: ${res.statusText}`);
  }

  const json = await res.json();
  const rawList = json.data || [];

  return rawList.map((c: Record<string, unknown>) => {
    const rawDirectus = (c.directus as string) || null;
    const rawToken = (c.directus_token as string) || null;
    const isConfigured = Boolean(rawDirectus && rawDirectus.trim() && rawToken && rawToken.trim());

    return {
      company_id: Number(c.company_id || c.id),
      company_name: String(c.company_name || c.name || "Unknown Company"),
      company_code: String(c.company_code || c.code || ""),
      company_logo: (c.company_logo as string) || null,
      company_address: (c.company_address as string) || null,
      company_tin: (c.company_tin as string) || null,
      directus: rawDirectus ? normalizeUrl(rawDirectus) : null,
      directus_token: rawToken,
      is_directus_configured: isConfigured,
      connection_status: isConfigured ? "online" : "unconfigured",
    };
  });
};

/**
 * Fetch Matrix data (Companies, Permit Types, Permits)
 * Direct Multi-Tenant Aggregator:
 * 1. Company List & Permit Type templates fetched from Master.
 * 2. Permits are fetched DIRECTLY from each Company's Directus instance (Single Source of Truth).
 * 3. Falls back gracefully if an instance is offline or unconfigured.
 */
export const fetchMatrixData = async (): Promise<PermitCreationMatrixData> => {
  const masterBase = normalizeUrl(API_BASE_URL);
  const typesEndpoint = `${masterBase}/items/permit_types?limit=-1&sort=name`;
  const companiesEndpoint = `${masterBase}/items/company_list?limit=-1&sort=company_name`;

  const [typesRes, companiesRes] = await Promise.allSettled([
    fetch(typesEndpoint, { method: "GET", headers: getMasterHeaders(), cache: "no-store" }),
    fetch(companiesEndpoint, { method: "GET", headers: getMasterHeaders(), cache: "no-store" }),
  ]);

  let permitTypes: PermitTypeItem[] = [];
  let rawCompanies: PermitCompany[] = [];

  if (typesRes.status === "fulfilled" && typesRes.value.ok) {
    const json = await typesRes.value.json();
    permitTypes = json.data || [];
  }

  if (companiesRes.status === "fulfilled" && companiesRes.value.ok) {
    const json = await companiesRes.value.json();
    rawCompanies = (json.data || []).map((c: Record<string, unknown>) => {
      const rawDirectus = (c.directus as string) || null;
      const rawToken = (c.directus_token as string) || null;
      const isConfigured = Boolean(rawDirectus && rawDirectus.trim() && rawToken && rawToken.trim());

      return {
        company_id: Number(c.company_id || c.id),
        company_name: String(c.company_name || c.name || "Unknown Company"),
        company_code: String(c.company_code || c.code || ""),
        company_logo: (c.company_logo as string) || null,
        company_address: (c.company_address as string) || null,
        company_tin: (c.company_tin as string) || null,
        directus: rawDirectus ? normalizeUrl(rawDirectus) : null,
        directus_token: rawToken,
        is_directus_configured: isConfigured,
        connection_status: isConfigured ? ("online" as const) : ("unconfigured" as const),
      };
    });
  }

  const normalizeTypeName = (str?: string | null): string => {
    if (!str) return "";
    return str.toLowerCase().replace(/['"`\s\-_.]/g, "").trim();
  };

  // Pre-index master permit types by normalized name to map company local types to master matrix columns
  const masterTypeByName = new Map<string, PermitTypeItem>();
  for (const t of permitTypes) {
    const rawName = t.name || t.permit_type_name || "";
    const nameKey = normalizeTypeName(rawName);
    if (nameKey) masterTypeByName.set(nameKey, t);
  }

  const allAggregatedPermits: PermitRecord[] = [];
  const companyErrorMap = new Map<number, string>();

  // Parallel fetch permits directly from each company's individual Directus
  await Promise.allSettled(
    rawCompanies.map(async (company) => {
      if (!company.is_directus_configured || !company.directus || !company.directus_token) {
        return;
      }

      try {
        const compBase = normalizeUrl(company.directus);
        const compHeaders = getCompanyHeaders(company.directus_token);

        // Fetch company's local permit types so we can map by name to Master's matrix columns
        const compTypesRes = await fetch(`${compBase}/items/permit_types?limit=-1`, {
          headers: compHeaders,
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        });

        const compTypeMap = new Map<number | string, string>();
        if (compTypesRes.ok) {
          const compTypesData = await compTypesRes.json();
          for (const ct of compTypesData.data || []) {
            const rawCompName = ct.name || ct.permit_type_name || "";
            const ctName = normalizeTypeName(rawCompName);
            compTypeMap.set(ct.id, ctName);
            compTypeMap.set(String(ct.id), ctName);
          }
        }

        // Fetch live permits directly from company Directus instance for this specific company only
        const compPermitsRes = await fetch(
          `${compBase}/items/permits?filter[company_id][_eq]=${company.company_id}&limit=-1&sort=-id`,
          {
            headers: compHeaders,
            signal: AbortSignal.timeout(5000),
            cache: "no-store",
          }
        );

        if (compPermitsRes.ok) {
          const compPermitsData = await compPermitsRes.json();
          const list = compPermitsData.data || [];

          for (const item of list) {
            // Strictly guard: ensure the permit actually belongs to this company
            if (item.company_id && Number(item.company_id) !== company.company_id) {
              continue;
            }

            // Find corresponding master permit_type_id
            const localTypeName = compTypeMap.get(item.permit_type_id) || "";
            const matchedMasterType = localTypeName ? masterTypeByName.get(localTypeName) : null;
            const mappedTypeId = matchedMasterType ? matchedMasterType.id : item.permit_type_id;

            allAggregatedPermits.push({
              id: item.id,
              company_id: company.company_id,
              permit_type_id: mappedTypeId,
              permit_number: String(item.permit_number || ""),
              issue_date: item.issue_date || item.issued_date || null,
              expiry_date: item.expiry_date || item.expiration_date || null,
              issued_date: item.issue_date || item.issued_date || null,
              expiration_date: item.expiry_date || item.expiration_date || null,
              file_url: item.file_url || "",
              issuing_agency: item.issuing_agency || null,
              status: item.status || "Active",
              sync_status: "synced",
              notes: item.notes || item.remarks || null,
              created_at: item.created_at || null,
              updated_at: item.updated_at || null,
            });
          }
        } else {
          const errorText = compPermitsRes.status === 403
            ? "HTTP 403: Forbidden (Role permissions required for permits collection)"
            : `HTTP ${compPermitsRes.status}: ${compPermitsRes.statusText || "Instance error"}`;
          companyErrorMap.set(company.company_id, errorText);
        }
      } catch (err) {
        const isTimeout = err instanceof Error && err.name === "TimeoutError";
        companyErrorMap.set(
          company.company_id,
          isTimeout ? "Connection Timeout (Instance offline/unreachable)" : "Network/Host unreachable"
        );
      }
    })
  );

  // If a company is offline/unconfigured or returned 0 aggregated permits, check Master Directus backup
  if (allAggregatedPermits.length === 0) {
    try {
      const backupPermitsRes = await fetch(`${masterBase}/items/permits?limit=-1&sort=-id`, {
        headers: getMasterHeaders(),
        cache: "no-store",
      });
      if (backupPermitsRes.ok) {
        const backupJson = await backupPermitsRes.json();
        const backupList = backupJson.data || [];
        for (const item of backupList) {
          allAggregatedPermits.push({
            ...item,
            sync_status: "unsynced",
          });
        }
      }
    } catch (backupErr) {
      console.warn("Master permits backup fetch fallback failed:", backupErr);
    }
  }

  // Update companies with live connection_status and detailed connection_error
  const enrichedCompanies = rawCompanies.map((c) => {
    if (!c.is_directus_configured) {
      return { ...c, connection_status: "unconfigured" as const, connection_error: "Directus URL or token missing" };
    }
    const err = companyErrorMap.get(c.company_id);
    if (err) {
      return { ...c, connection_status: "offline" as const, connection_error: err };
    }
    return { ...c, connection_status: "online" as const, connection_error: null };
  });

  return {
    companies: enrichedCompanies,
    permitTypes,
    permits: allAggregatedPermits,
  };
};

/**
 * Push a single permit type to a specific company Directus.
 */
export const syncPermitTypeToCompany = async (
  company: PermitCompany,
  permitTypeName: string,
  isActive: number | boolean = 1
): Promise<CompanySyncResult> => {
  if (!company.is_directus_configured || !company.directus || !company.directus_token) {
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "skipped",
      message: "No Directus URL or token configured.",
    };
  }

  const compBase = normalizeUrl(company.directus);
  const headers = getCompanyHeaders(company.directus_token);
  const activeValue = isActive ? 1 : 0;

  try {
    // 1. Check if type already exists by name
    const checkUrl = `${compBase}/items/permit_types?filter[name][_eq]=${encodeURIComponent(permitTypeName)}&limit=1`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!checkRes.ok) {
      const errText = await checkRes.text();
      return {
        company_id: company.company_id,
        company_name: company.company_name,
        status: "failed",
        message: `HTTP ${checkRes.status}: ${errText.slice(0, 100)}`,
      };
    }

    const checkData = await checkRes.json();
    const existing = checkData.data?.[0];

    if (existing?.id) {
      // Update active state if different
      await fetch(`${compBase}/items/permit_types/${existing.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_active: activeValue }),
        signal: AbortSignal.timeout(6000),
      });

      return {
        company_id: company.company_id,
        company_name: company.company_name,
        status: "success",
        message: "Updated existing permit type in company instance.",
      };
    }

    // 2. Insert new permit type in company instance
    const createRes = await fetch(`${compBase}/items/permit_types`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: permitTypeName,
        is_active: activeValue,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return {
        company_id: company.company_id,
        company_name: company.company_name,
        status: "failed",
        message: `HTTP ${createRes.status}: ${errText.slice(0, 100)}`,
      };
    }

    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "success",
      message: "Successfully created in company instance.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network/Connection error";
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "failed",
      message: errorMsg,
    };
  }
};

/**
 * Broadcast / Synchronize a Permit Type to ALL configured company Directus instances.
 */
export const broadcastPermitTypeToAllCompanies = async (
  permitTypeName: string,
  isActive: number | boolean = 1
): Promise<SyncOperationReport> => {
  const companies = await fetchCompanyList();
  const configuredCompanies = companies.filter((c) => c.is_directus_configured);

  const results: CompanySyncResult[] = await Promise.all(
    configuredCompanies.map((c) => syncPermitTypeToCompany(c, permitTypeName, isActive))
  );

  const syncedCount = results.filter((r) => r.status === "success").length;

  return {
    success: syncedCount > 0 || configuredCompanies.length === 0,
    message: `Permit type "${permitTypeName}" synchronized to ${syncedCount} of ${configuredCompanies.length} configured companies.`,
    syncedCount,
    totalConfigured: configuredCompanies.length,
    results,
  };
};

/**
 * Fast ping to verify if a company Directus instance is online.
 */
export const pingCompanyDirectus = async (
  directusUrl: string,
  token: string,
  timeoutMs: number = 2000
): Promise<{ ok: boolean; status?: number; error?: string }> => {
  try {
    const base = normalizeUrl(directusUrl);
    const headers = getCompanyHeaders(token);
    const res = await fetch(`${base}/server/ping`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, error: isTimeout ? "Timeout" : "Unreachable" };
  }
};

/**
 * Synchronize all permit types to a SINGLE company Directus instance.
 * Checks reachability first (Fail-Fast) to avoid stalling on offline companies.
 */
export const syncSingleCompanyPermitTypes = async (
  company: PermitCompany
): Promise<CompanySyncResult> => {
  if (!company.is_directus_configured || !company.directus || !company.directus_token) {
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "skipped",
      message: "No Directus credentials configured.",
    };
  }

  // 1. Fail-fast ping (2s timeout)
  const ping = await pingCompanyDirectus(company.directus, company.directus_token, 2000);
  if (!ping.ok) {
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "failed",
      message: `Offline (${ping.error || "unreachable"})`,
    };
  }

  // 2. Fetch Master Permit Types
  const masterBase = normalizeUrl(API_BASE_URL);
  const typesRes = await fetch(`${masterBase}/items/permit_types?limit=-1`, {
    headers: getMasterHeaders(),
    cache: "no-store",
  });

  if (!typesRes.ok) {
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: "failed",
      message: "Failed to load master permit types.",
    };
  }

  const typesJson = await typesRes.json();
  const permitTypes: PermitTypeItem[] = typesJson.data || [];

  // 3. Batch check existing types in company instance
  const compBase = normalizeUrl(company.directus);
  const compHeaders = getCompanyHeaders(company.directus_token);

  const existingTypesMap = new Map<string, number | string>();
  try {
    const compTypesRes = await fetch(`${compBase}/items/permit_types?limit=-1`, {
      headers: compHeaders,
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (compTypesRes.ok) {
      const compTypesData = await compTypesRes.json();
      for (const ct of compTypesData.data || []) {
        const key = (ct.name || ct.permit_type_name || "").trim().toLowerCase();
        if (key) existingTypesMap.set(key, ct.id);
      }
    }
  } catch (checkErr) {
    console.warn(`Could not pre-fetch permit types for ${company.company_name}:`, checkErr);
  }

  // 4. Upsert each type in parallel
  const upsertPromises = permitTypes.map(async (t) => {
    const typeName = (t.name || t.permit_type_name || "").trim();
    if (!typeName) return;
    const existingId = existingTypesMap.get(typeName.toLowerCase());
    const activeVal = t.is_active ? 1 : 0;

    try {
      if (existingId) {
        await fetch(`${compBase}/items/permit_types/${existingId}`, {
          method: "PATCH",
          headers: compHeaders,
          body: JSON.stringify({ is_active: activeVal }),
          signal: AbortSignal.timeout(3000),
        });
      } else {
        await fetch(`${compBase}/items/permit_types`, {
          method: "POST",
          headers: compHeaders,
          body: JSON.stringify({ name: typeName, is_active: activeVal }),
          signal: AbortSignal.timeout(3000),
        });
      }
    } catch {
      // Ignore individual type failure, keep going
    }
  });

  await Promise.allSettled(upsertPromises);

  return {
    company_id: company.company_id,
    company_name: company.company_name,
    status: "success",
    message: `Synchronized ${permitTypes.length} permit requirements.`,
  };
};

/**
 * Synchronize ALL Permit Types from Master to ALL configured Company Directus instances.
 * Runs companies in parallel with fast timeouts.
 */
export const syncAllPermitTypesToCompanies = async (): Promise<SyncOperationReport> => {
  const companies = await fetchCompanyList();
  const configuredCompanies = companies.filter((c) => c.is_directus_configured);

  const results: CompanySyncResult[] = await Promise.all(
    configuredCompanies.map((comp) => syncSingleCompanyPermitTypes(comp))
  );

  const syncedCount = results.filter((r) => r.status === "success").length;

  return {
    success: syncedCount > 0 || configuredCompanies.length === 0,
    message: `Synchronized across ${syncedCount} of ${configuredCompanies.length} companies.`,
    syncedCount,
    totalConfigured: configuredCompanies.length,
    results,
  };
};

/**
 * Create a Permit Record directly in the target Company's Directus instance.
 * Single Source of Truth: Does NOT write to Master Directus.
 */
export const createPermitRecord = async (
  payload: Partial<PermitRecord>
): Promise<{
  success: boolean;
  data?: PermitRecord;
  message?: string;
  companySync?: CompanySyncResult;
}> => {
  const masterBase = normalizeUrl(API_BASE_URL);
  const companyId = payload.company_id ? Number(payload.company_id) : null;

  if (!companyId) {
    throw new Error("Cannot create permit: missing company_id.");
  }

  const companies = await fetchCompanyList();
  const targetCompany = companies.find((c) => c.company_id === companyId);

  if (!targetCompany || !targetCompany.is_directus_configured || !targetCompany.directus || !targetCompany.directus_token) {
    throw new Error(
      `Company "${targetCompany?.company_name || companyId}" does not have a configured Directus URL or token.`
    );
  }

  const compBase = normalizeUrl(targetCompany.directus);
  const compHeaders = getCompanyHeaders(targetCompany.directus_token);

  // Resolve permit type name from Master to find or create matching type in Company Directus
  let localTypeId: number | string = payload.permit_type_id || "";
  try {
    const masterTypeRes = await fetch(`${masterBase}/items/permit_types/${payload.permit_type_id}`, {
      headers: getMasterHeaders(),
    });

    if (masterTypeRes.ok) {
      const masterTypeJson = await masterTypeRes.json();
      const typeName = masterTypeJson.data?.name;
      if (typeName) {
        // Find in company
        const compTypeRes = await fetch(
          `${compBase}/items/permit_types?filter[name][_eq]=${encodeURIComponent(typeName)}&limit=1`,
          { headers: compHeaders, signal: AbortSignal.timeout(6000) }
        );
        if (compTypeRes.ok) {
          const compTypeJson = await compTypeRes.json();
          if (compTypeJson.data?.[0]?.id) {
            localTypeId = compTypeJson.data[0].id;
          } else {
            // Auto-create type in company
            const createTypeRes = await fetch(`${compBase}/items/permit_types`, {
              method: "POST",
              headers: compHeaders,
              body: JSON.stringify({ name: typeName, is_active: 1 }),
              signal: AbortSignal.timeout(6000),
            });
            if (createTypeRes.ok) {
              const createdTypeJson = await createTypeRes.json();
              localTypeId = createdTypeJson.data?.id || localTypeId;
            }
          }
        }
      }
    }
  } catch (typeErr) {
    console.warn("Could not auto-map permit type to company:", typeErr);
  }

  // Save directly to target Company Directus
  const companyPayload = {
    company_id: companyId,
    permit_type_id: Number(localTypeId) || localTypeId,
    permit_number: payload.permit_number,
    issuing_agency: payload.issuing_agency || "Government Agency",
    issue_date: payload.issue_date || payload.issued_date,
    expiry_date: payload.expiry_date || payload.expiration_date,
    file_url: payload.file_url || "",
    status: payload.status || "Active",
    notes: payload.notes || payload.remarks || null,
  };

  const compPermitRes = await fetch(`${compBase}/items/permits`, {
    method: "POST",
    headers: compHeaders,
    body: JSON.stringify(companyPayload),
    signal: AbortSignal.timeout(10000),
  });

  if (!compPermitRes.ok) {
    const errText = await compPermitRes.text();
    throw new Error(`Failed to save in ${targetCompany.company_name} Directus: ${errText.slice(0, 150)}`);
  }

  const compCreatedJson = await compPermitRes.json();
  const createdRecord: PermitRecord = {
    ...compCreatedJson.data,
    company_id: companyId,
    permit_type_id: payload.permit_type_id || localTypeId,
    sync_status: "synced",
  };

  return {
    success: true,
    data: createdRecord,
    companySync: {
      company_id: companyId,
      company_name: targetCompany.company_name,
      status: "success",
      message: "Permit stored directly in Company Directus.",
    },
  };
};

/**
 * Update a Permit Record directly in its Company Directus instance.
 */
export const updatePermitRecord = async (
  id: number | string,
  payload: Partial<PermitRecord>
): Promise<{ success: boolean; data?: PermitRecord; message?: string }> => {
  const targetCompanyId = payload.company_id ? Number(payload.company_id) : null;

  if (!targetCompanyId) {
    throw new Error("Cannot update permit: missing company_id.");
  }

  const companies = await fetchCompanyList();
  const comp = companies.find((c) => c.company_id === targetCompanyId);

  if (!comp || !comp.is_directus_configured || !comp.directus || !comp.directus_token) {
    throw new Error(
      `Company "${comp?.company_name || targetCompanyId}" does not have a configured Directus URL or token.`
    );
  }

  const compBase = normalizeUrl(comp.directus);
  const compHeaders = getCompanyHeaders(comp.directus_token);

  const compPayload: Record<string, unknown> = {};
  if (payload.permit_number !== undefined) compPayload.permit_number = payload.permit_number.trim();
  if (payload.issuing_agency !== undefined) compPayload.issuing_agency = payload.issuing_agency;
  if (payload.issue_date !== undefined || payload.issued_date !== undefined) {
    compPayload.issue_date = payload.issue_date || payload.issued_date;
  }
  if (payload.expiry_date !== undefined || payload.expiration_date !== undefined) {
    compPayload.expiry_date = payload.expiry_date || payload.expiration_date;
  }
  if (payload.file_url !== undefined) compPayload.file_url = payload.file_url;
  if (payload.status !== undefined) compPayload.status = payload.status;
  if (payload.notes !== undefined || payload.remarks !== undefined) {
    compPayload.notes = payload.notes || payload.remarks;
  }

  const patchRes = await fetch(`${compBase}/items/permits/${id}`, {
    method: "PATCH",
    headers: compHeaders,
    body: JSON.stringify(compPayload),
    signal: AbortSignal.timeout(8000),
  });

  if (!patchRes.ok) {
    const errorBody = await patchRes.text();
    throw new Error(`Failed to update permit in ${comp.company_name} Directus: ${errorBody.slice(0, 150)}`);
  }

  const json = await patchRes.json();
  return { success: true, data: json.data };
};

/**
 * Delete a Permit Record directly from its Company Directus instance.
 */
export const deletePermitRecord = async (
  id: number | string,
  companyId?: number | string | null
): Promise<{ success: boolean; message?: string }> => {
  const targetCompanyId = companyId ? Number(companyId) : null;

  if (!targetCompanyId) {
    throw new Error("Cannot delete permit: missing company_id.");
  }

  const companies = await fetchCompanyList();
  const comp = companies.find((c) => c.company_id === targetCompanyId);

  if (!comp || !comp.is_directus_configured || !comp.directus || !comp.directus_token) {
    throw new Error(
      `Company "${comp?.company_name || targetCompanyId}" does not have a configured Directus URL or token.`
    );
  }

  const compBase = normalizeUrl(comp.directus);
  const compHeaders = getCompanyHeaders(comp.directus_token);

  const response = await fetch(`${compBase}/items/permits/${id}`, {
    method: "DELETE",
    headers: compHeaders,
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete permit in ${comp.company_name} Directus: ${errorBody.slice(0, 150)}`);
  }

  return {
    success: true,
    message: "Permit deleted successfully.",
  };
};

/**
 * Synchronize a single permit record to its target Company Directus instance.
 */
export const syncSinglePermitToCompany = async (
  permitId: number | string
): Promise<{ success: boolean; message: string }> => {
  const masterBase = normalizeUrl(API_BASE_URL);

  // 1. Fetch permit from Master Directus
  const permitRes = await fetch(`${masterBase}/items/permits/${permitId}`, {
    headers: getMasterHeaders(),
    cache: "no-store",
  });

  if (!permitRes.ok) {
    throw new Error(`Permit record #${permitId} not found in Master Directus.`);
  }

  const permitJson = await permitRes.json();
  const permit: PermitRecord = permitJson.data;

  if (!permit || !permit.company_id) {
    throw new Error("Invalid permit record or missing company_id.");
  }

  // 2. Fetch company credentials
  const companies = await fetchCompanyList();
  const company = companies.find((c) => c.company_id === Number(permit.company_id));

  if (!company || !company.is_directus_configured || !company.directus || !company.directus_token) {
    throw new Error(
      `Company "${company?.company_name || permit.company_id}" does not have a configured Directus URL or token.`
    );
  }

  const compBase = normalizeUrl(company.directus);
  const compHeaders = getCompanyHeaders(company.directus_token);

  // 3. Resolve permit_type in Company Directus
  let localTypeId: number | string = permit.permit_type_id;
  const masterTypeRes = await fetch(`${masterBase}/items/permit_types/${permit.permit_type_id}`, {
    headers: getMasterHeaders(),
  });

  if (masterTypeRes.ok) {
    const masterTypeJson = await masterTypeRes.json();
    const typeName = masterTypeJson.data?.name;

    if (typeName) {
      // Find in company
      const compTypeRes = await fetch(
        `${compBase}/items/permit_types?filter[name][_eq]=${encodeURIComponent(typeName)}&limit=1`,
        { headers: compHeaders, signal: AbortSignal.timeout(6000) }
      );

      if (compTypeRes.ok) {
        const compTypeJson = await compTypeRes.json();
        if (compTypeJson.data?.[0]?.id) {
          localTypeId = compTypeJson.data[0].id;
        } else {
          // Auto-create in company
          const createTypeRes = await fetch(`${compBase}/items/permit_types`, {
            method: "POST",
            headers: compHeaders,
            body: JSON.stringify({ name: typeName, is_active: 1 }),
            signal: AbortSignal.timeout(6000),
          });
          if (createTypeRes.ok) {
            const createdTypeJson = await createTypeRes.json();
            localTypeId = createdTypeJson.data?.id || localTypeId;
          }
        }
      }
    }
  }

  // 4. Check if permit already exists in company by permit_number
  const checkPermitUrl = `${compBase}/items/permits?filter[permit_number][_eq]=${encodeURIComponent(
    permit.permit_number
  )}&limit=1`;
  const checkPermitRes = await fetch(checkPermitUrl, {
    headers: compHeaders,
    signal: AbortSignal.timeout(6000),
  });

  const payload = {
    company_id: Number(permit.company_id),
    permit_type_id: Number(localTypeId) || localTypeId,
    permit_number: permit.permit_number,
    issuing_agency: permit.issuing_agency || "Government Agency",
    issue_date: permit.issue_date || permit.issued_date,
    expiry_date: permit.expiry_date || permit.expiration_date,
    file_url: permit.file_url || "",
    status: permit.status || "Active",
    notes: permit.notes || permit.remarks || null,
  };

  if (checkPermitRes.ok) {
    const checkData = await checkPermitRes.json();
    const existing = checkData.data?.[0];

    if (existing?.id) {
      // Update existing permit in company
      const patchRes = await fetch(`${compBase}/items/permits/${existing.id}`, {
        method: "PATCH",
        headers: compHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      if (!patchRes.ok) {
        const err = await patchRes.text();
        throw new Error(`Failed to update in Company Directus: ${err.slice(0, 100)}`);
      }

      return {
        success: true,
        message: `Permit #${permit.permit_number} updated in ${company.company_name} Directus.`,
      };
    }
  }

  // Create new permit in company
  const createRes = await fetch(`${compBase}/items/permits`, {
    method: "POST",
    headers: compHeaders,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(6000),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to save in Company Directus: ${err.slice(0, 100)}`);
  }

  return {
    success: true,
    message: `Permit #${permit.permit_number} successfully pushed to ${company.company_name} Directus.`,
  };
};

/**
 * Synchronize all unsynced permits for a specific company.
 */
export const syncCompanyPermits = async (
  companyId: number
): Promise<{ success: boolean; syncedCount: number; failedCount: number; message: string }> => {
  const masterBase = normalizeUrl(API_BASE_URL);

  // Fetch all permits for this company from Master
  const res = await fetch(
    `${masterBase}/items/permits?filter[company_id][_eq]=${companyId}&limit=-1`,
    { headers: getMasterHeaders(), cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to load company permits from Master Directus.");
  }

  const json = await res.json();
  const permits: PermitRecord[] = json.data || [];

  if (permits.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      message: "No permits found to synchronize for this company.",
    };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const p of permits) {
    if (!p.id) continue;
    try {
      await syncSinglePermitToCompany(p.id);
      syncedCount++;
    } catch (err) {
      console.warn(`Sync failed for permit #${p.permit_number}:`, err);
      failedCount++;
    }
  }

  return {
    success: syncedCount > 0,
    syncedCount,
    failedCount,
    message: `Synchronized ${syncedCount} of ${permits.length} permits.${
      failedCount > 0 ? ` (${failedCount} failed)` : ""
    }`,
  };
};

/**
 * Synchronize ALL unsynced permits across ALL configured companies.
 */
export const syncAllUnsyncedPermits = async (): Promise<{
  success: boolean;
  totalSynced: number;
  totalFailed: number;
  message: string;
}> => {
  const companies = await fetchCompanyList();
  const configured = companies.filter((c) => c.is_directus_configured);

  let totalSynced = 0;
  let totalFailed = 0;

  for (const comp of configured) {
    try {
      const result = await syncCompanyPermits(comp.company_id);
      totalSynced += result.syncedCount;
      totalFailed += result.failedCount;
    } catch (err) {
      console.warn(`Batch sync failed for company ${comp.company_name}:`, err);
      totalFailed++;
    }
  }

  return {
    success: totalSynced > 0 || totalFailed === 0,
    totalSynced,
    totalFailed,
    message: `Global Permit Sync: ${totalSynced} permits synced successfully across ${configured.length} companies.${
      totalFailed > 0 ? ` (${totalFailed} failed)` : ""
    }`,
  };
};
