import type {
  IntercompanyVacanciesResponse,
  FetchVacanciesParams,
} from "../types";

export const FALLBACK_VACANCIES_DATA: IntercompanyVacanciesResponse = {
  kpis: {
    totalOpenVacancies: 38,
    totalRequisitions: 18,
    replacementRoles: 16,
    newPositionRoles: 22,
    avgAgingDays: 34.5,
    criticalRolesCount: 9,
    topVacanciesCompany: "Omni Logistics Co.",
    topVacanciesCount: 14,
  },
  companySummaries: [
    {
      companyId: 1,
      companyName: "Omni Logistics Co.",
      companyCode: "OLC",
      status: "ACTIVE",
      openVacancies: 14,
      totalNeeded: 18,
      hiredCount: 4,
      activeRequisitions: 6,
      criticalCount: 4,
      avgAgingDays: 38.2,
      sharePercentage: 36.8,
    },
    {
      companyId: 2,
      companyName: "Prime Distribution Inc.",
      companyCode: "PDI",
      status: "ACTIVE",
      openVacancies: 10,
      totalNeeded: 12,
      hiredCount: 2,
      activeRequisitions: 5,
      criticalCount: 2,
      avgAgingDays: 32.0,
      sharePercentage: 26.3,
    },
    {
      companyId: 3,
      companyName: "Apex Retail Group",
      companyCode: "ARG",
      status: "ACTIVE",
      openVacancies: 8,
      totalNeeded: 10,
      hiredCount: 2,
      activeRequisitions: 4,
      criticalCount: 2,
      avgAgingDays: 35.4,
      sharePercentage: 21.1,
    },
    {
      companyId: 4,
      companyName: "Vertex Holdings Corp.",
      companyCode: "VHC",
      status: "ACTIVE",
      openVacancies: 4,
      totalNeeded: 5,
      hiredCount: 1,
      activeRequisitions: 2,
      criticalCount: 1,
      avgAgingDays: 28.0,
      sharePercentage: 10.5,
    },
    {
      companyId: 5,
      companyName: "Summit Cold Chain",
      companyCode: "SCC",
      status: "ACTIVE",
      openVacancies: 2,
      totalNeeded: 3,
      hiredCount: 1,
      activeRequisitions: 1,
      criticalCount: 0,
      avgAgingDays: 22.0,
      sharePercentage: 5.3,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-04",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchIntercompanyVacancies({
  groupId,
  startDate,
  endDate,
  force = false,
}: FetchVacanciesParams): Promise<IntercompanyVacanciesResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/hr/${groupId}/vacancies?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchIntercompanyVacancies] Server responded with status ${res.status}`);
      return FALLBACK_VACANCIES_DATA;
    }

    const data: IntercompanyVacanciesResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchIntercompanyVacancies] Error fetching data, using fallback:", err);
    return FALLBACK_VACANCIES_DATA;
  }
}

