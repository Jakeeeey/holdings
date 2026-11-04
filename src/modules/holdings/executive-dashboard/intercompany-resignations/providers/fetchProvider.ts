import type {
  IntercompanyResignationResponse,
  FetchResignationsParams,
} from "../types";

export const FALLBACK_RESIGNATION_DATA: IntercompanyResignationResponse = {
  kpis: {
    totalResignations: 24,
    pendingCount: 4,
    approvedCount: 18,
    turnoverRate: 1.9,
    complianceRate: 91.7,
    avgNoticeDays: 32.5,
    topResignationReason: "Career Growth & Opportunity",
    highestTurnoverCompany: "Apex Retail Group",
    highestTurnoverRate: 3.1,
  },
  companySummaries: [
    {
      companyId: 1,
      companyName: "Omni Logistics Co.",
      companyCode: "OLC",
      status: "ACTIVE",
      totalResignations: 6,
      pendingCount: 1,
      approvedCount: 5,
      rejectedCount: 0,
      completedCount: 5,
      avgNoticeDays: 34.2,
      complianceRate: 100.0,
      totalEmployees: 420,
      turnoverRate: 1.4,
      sharePercentage: 25.0,
    },
    {
      companyId: 2,
      companyName: "Prime Distribution Inc.",
      companyCode: "PDI",
      status: "ACTIVE",
      totalResignations: 5,
      pendingCount: 1,
      approvedCount: 4,
      rejectedCount: 0,
      completedCount: 4,
      avgNoticeDays: 31.0,
      complianceRate: 80.0,
      totalEmployees: 310,
      turnoverRate: 1.6,
      sharePercentage: 20.8,
    },
    {
      companyId: 3,
      companyName: "Apex Retail Group",
      companyCode: "ARG",
      status: "ACTIVE",
      totalResignations: 8,
      pendingCount: 1,
      approvedCount: 6,
      rejectedCount: 1,
      completedCount: 6,
      avgNoticeDays: 30.5,
      complianceRate: 87.5,
      totalEmployees: 260,
      turnoverRate: 3.1,
      sharePercentage: 33.3,
    },
    {
      companyId: 4,
      companyName: "Vertex Holdings Corp.",
      companyCode: "VHC",
      status: "ACTIVE",
      totalResignations: 3,
      pendingCount: 1,
      approvedCount: 2,
      rejectedCount: 0,
      completedCount: 2,
      avgNoticeDays: 35.0,
      complianceRate: 100.0,
      totalEmployees: 150,
      turnoverRate: 2.0,
      sharePercentage: 12.5,
    },
    {
      companyId: 5,
      companyName: "Summit Cold Chain",
      companyCode: "SCC",
      status: "ACTIVE",
      totalResignations: 2,
      pendingCount: 0,
      approvedCount: 1,
      rejectedCount: 1,
      completedCount: 1,
      avgNoticeDays: 33.0,
      complianceRate: 100.0,
      totalEmployees: 100,
      turnoverRate: 2.0,
      sharePercentage: 8.3,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-04",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchIntercompanyResignations({
  groupId,
  startDate,
  endDate,
  force = false,
}: FetchResignationsParams): Promise<IntercompanyResignationResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/hr/${groupId}/resignations?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchIntercompanyResignations] Server responded with status ${res.status}`);
      return FALLBACK_RESIGNATION_DATA;
    }

    const data: IntercompanyResignationResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchIntercompanyResignations] Error fetching data, using fallback:", err);
    return FALLBACK_RESIGNATION_DATA;
  }
}

