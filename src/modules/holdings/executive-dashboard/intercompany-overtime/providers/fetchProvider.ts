import type { IntercompanyOvertimeResponse } from "../types";

export interface FetchOvertimeParams {
  groupId: string | number;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}

export async function fetchIntercompanyOvertime(
  params: FetchOvertimeParams
): Promise<IntercompanyOvertimeResponse> {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.force) query.set("force", "true");

  const queryString = query.toString();
  const url = `/api/holdings/executive-dashboard/hr/${params.groupId}/overtime${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch overtime data (HTTP ${res.status})`;
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

