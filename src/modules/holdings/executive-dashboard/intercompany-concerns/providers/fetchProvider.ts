import type {
  IntercompanyConcernsResponse,
  FetchConcernsParams,
} from "../types";

export const FALLBACK_CONCERNS_DATA: IntercompanyConcernsResponse = {
  kpis: {
    totalConcerns: 42,
    pendingCount: 6,
    inReviewCount: 4,
    resolvedCount: 26,
    closedCount: 6,
    anonymousCount: 16,
    anonymousPercentage: 38.1,
    resolutionRate: 76.2,
    topConcernCategory: "Attendance & Schedule",
    topConcernCompany: "Omni Logistics Co.",
    topConcernCount: 15,
  },
  companySummaries: [
    {
      companyId: 1,
      companyName: "Omni Logistics Co.",
      companyCode: "OLC",
      status: "ACTIVE",
      totalConcerns: 15,
      pendingCount: 2,
      inReviewCount: 1,
      resolvedCount: 9,
      closedCount: 3,
      anonymousCount: 6,
      resolutionRate: 80.0,
      sharePercentage: 35.7,
    },
    {
      companyId: 2,
      companyName: "Prime Distribution Inc.",
      companyCode: "PDI",
      status: "ACTIVE",
      totalConcerns: 12,
      pendingCount: 2,
      inReviewCount: 1,
      resolvedCount: 7,
      closedCount: 2,
      anonymousCount: 4,
      resolutionRate: 75.0,
      sharePercentage: 28.6,
    },
    {
      companyId: 3,
      companyName: "Apex Retail Group",
      companyCode: "ARG",
      status: "ACTIVE",
      totalConcerns: 8,
      pendingCount: 1,
      inReviewCount: 1,
      resolvedCount: 5,
      closedCount: 1,
      anonymousCount: 3,
      resolutionRate: 75.0,
      sharePercentage: 19.0,
    },
    {
      companyId: 4,
      companyName: "Vertex Holdings Corp.",
      companyCode: "VHC",
      status: "ACTIVE",
      totalConcerns: 4,
      pendingCount: 1,
      inReviewCount: 0,
      resolvedCount: 3,
      closedCount: 0,
      anonymousCount: 2,
      resolutionRate: 75.0,
      sharePercentage: 9.5,
    },
    {
      companyId: 5,
      companyName: "Summit Cold Chain",
      companyCode: "SCC",
      status: "ACTIVE",
      totalConcerns: 3,
      pendingCount: 0,
      inReviewCount: 1,
      resolvedCount: 2,
      closedCount: 0,
      anonymousCount: 1,
      resolutionRate: 66.7,
      sharePercentage: 7.1,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-04",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchIntercompanyConcerns({
  groupId,
  startDate,
  endDate,
  force = false,
}: FetchConcernsParams): Promise<IntercompanyConcernsResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/hr/${groupId}/concerns?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchIntercompanyConcerns] Server responded with status ${res.status}`);
      return FALLBACK_CONCERNS_DATA;
    }

    const data: IntercompanyConcernsResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchIntercompanyConcerns] Error fetching data, using fallback:", err);
    return FALLBACK_CONCERNS_DATA;
  }
}

