import type { IntercompanyEmployeeMasterlistResponse } from "../types";

export interface FetchMasterlistParams {
  groupId: string | number;
  force?: boolean;
}

export async function fetchIntercompanyEmployeeMasterlist(
  params: FetchMasterlistParams
): Promise<IntercompanyEmployeeMasterlistResponse> {
  const query = new URLSearchParams();
  if (params.force) {
    query.set("force", "true");
  }

  const queryString = query.toString();
  const url = `/api/holdings/executive-dashboard/hr/${params.groupId}/employee-masterlist${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch employee masterlist (HTTP ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

