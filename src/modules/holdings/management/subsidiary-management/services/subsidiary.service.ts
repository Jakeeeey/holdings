import { SubsidiaryInput, SubsidiaryResponse } from "../types/subsidiary.schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// Directus static token from env if applicable
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

// Assume the backend provides a directus-style or springboot-style endpoint for company_list
// Adjust this path as per the backend architecture. For now, assuming a standard REST pattern.
const ENDPOINT = `${API_BASE_URL}/items/company_list`;

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  return headers;
};

export const fetchAllSubsidiaries = async (): Promise<SubsidiaryInput[]> => {
  const response = await fetch(ENDPOINT, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subsidiaries: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
};

export const fetchSubsidiaryById = async (id: number): Promise<SubsidiaryInput> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subsidiary ${id}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

export const createSubsidiary = async (payload: SubsidiaryInput): Promise<SubsidiaryResponse> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create subsidiary: ${response.statusText}`);
  }

  const data = await response.json();
  return { success: true, data: data.data };
};

export const updateSubsidiary = async (id: number, payload: Partial<SubsidiaryInput>): Promise<SubsidiaryResponse> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update subsidiary: ${response.statusText}`);
  }

  const data = await response.json();
  return { success: true, data: data.data };
};

export const deleteSubsidiary = async (id: number): Promise<SubsidiaryResponse> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete subsidiary: ${response.statusText}`);
  }

  return { success: true };
};
