import {
  PermitCompany,
  PermitTypeItem,
  PermitRecord,
  PermitCreationMatrixData,
} from "../types/permit-creation.types";

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

export const fetchMatrixData = async (): Promise<PermitCreationMatrixData> => {
  const permitEndpoint = `${API_BASE_URL}/items/permits?limit=-1&sort=-id`;
  const typesEndpoint = `${API_BASE_URL}/items/permit_types?limit=-1&sort=name`;
  const companiesEndpoint = `${API_BASE_URL}/items/company_list?limit=-1&sort=company_name`;

  const [permitsRes, typesRes, companiesRes] = await Promise.allSettled([
    fetch(permitEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
    fetch(typesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
    fetch(companiesEndpoint, { method: "GET", headers: getHeaders(), cache: "no-store" }),
  ]);

  let permits: PermitRecord[] = [];
  let permitTypes: PermitTypeItem[] = [];
  let companies: PermitCompany[] = [];

  if (permitsRes.status === "fulfilled" && permitsRes.value.ok) {
    const json = await permitsRes.value.json();
    permits = json.data || [];
  }

  if (typesRes.status === "fulfilled" && typesRes.value.ok) {
    const json = await typesRes.value.json();
    permitTypes = json.data || [];
  }

  if (companiesRes.status === "fulfilled" && companiesRes.value.ok) {
    const json = await companiesRes.value.json();
    companies = (json.data || []).map((c: Record<string, unknown>) => ({
      company_id: Number(c.company_id || c.id),
      company_name: String(c.company_name || c.name || "Unknown Company"),
      company_code: String(c.company_code || c.code || ""),
      company_logo: (c.company_logo as string) || null,
      company_address: (c.company_address as string) || null,
      company_tin: (c.company_tin as string) || null,
    }));
  }

  return {
    companies,
    permitTypes,
    permits,
  };
};

export const createPermitRecord = async (
  payload: Partial<PermitRecord>
): Promise<{ success: boolean; data?: PermitRecord; message?: string }> => {
  const endpoint = `${API_BASE_URL}/items/permits`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create permit: ${errorBody || response.statusText}`);
  }

  const json = await response.json();
  return { success: true, data: json.data };
};

export const updatePermitRecord = async (
  id: number | string,
  payload: Partial<PermitRecord>
): Promise<{ success: boolean; data?: PermitRecord; message?: string }> => {
  const endpoint = `${API_BASE_URL}/items/permits/${id}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to update permit: ${errorBody || response.statusText}`);
  }

  const json = await response.json();
  return { success: true, data: json.data };
};

export const deletePermitRecord = async (
  id: number | string
): Promise<{ success: boolean; message?: string }> => {
  const endpoint = `${API_BASE_URL}/items/permits/${id}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete permit: ${errorBody || response.statusText}`);
  }

  return { success: true };
};
