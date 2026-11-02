import type {
  IntercompanyPunctualityResponse,
  FetchPunctualityParams,
} from "../types";

export const FALLBACK_PUNCTUALITY_DATA: IntercompanyPunctualityResponse = {
  kpis: {
    totalStaff: 1240,
    totalPresentLogs: 4850,
    onTimeCount: 4462,
    totalLateCount: 388,
    gracePeriodCount: 210,
    undertimeCount: 42,
    overallPunctualityRate: 96.3,
    avgDelayMinutes: 14.2,
    topPunctualCompany: "Omni Logistics Co.",
    topPunctualRate: 98.6,
  },
  companySummaries: [
    {
      companyId: 1,
      companyName: "Omni Logistics Co.",
      companyCode: "OLC",
      status: "ACTIVE",
      totalEmployees: 420,
      totalLogs: 1680,
      onTimeCount: 1580,
      gracePeriodCount: 76,
      moderateLateCount: 18,
      severeLateCount: 6,
      totalLateCount: 24,
      undertimeCount: 12,
      punctualityRate: 98.6,
      avgDelayMinutes: 11.4,
      punctualitySharePct: 35.4,
    },
    {
      companyId: 2,
      companyName: "Prime Distribution Inc.",
      companyCode: "PDI",
      status: "ACTIVE",
      totalEmployees: 310,
      totalLogs: 1240,
      onTimeCount: 1152,
      gracePeriodCount: 52,
      moderateLateCount: 26,
      severeLateCount: 10,
      totalLateCount: 36,
      undertimeCount: 14,
      punctualityRate: 97.1,
      avgDelayMinutes: 13.8,
      punctualitySharePct: 25.8,
    },
    {
      companyId: 3,
      companyName: "Apex Retail Group",
      companyCode: "ARG",
      status: "ACTIVE",
      totalEmployees: 260,
      totalLogs: 980,
      onTimeCount: 882,
      gracePeriodCount: 48,
      moderateLateCount: 34,
      severeLateCount: 16,
      totalLateCount: 50,
      undertimeCount: 8,
      punctualityRate: 94.9,
      avgDelayMinutes: 16.5,
      punctualitySharePct: 19.8,
    },
    {
      companyId: 4,
      companyName: "Vertex Holdings Corp.",
      companyCode: "VHC",
      status: "ACTIVE",
      totalEmployees: 150,
      totalLogs: 600,
      onTimeCount: 546,
      gracePeriodCount: 22,
      moderateLateCount: 22,
      severeLateCount: 10,
      totalLateCount: 32,
      undertimeCount: 5,
      punctualityRate: 94.7,
      avgDelayMinutes: 17.1,
      punctualitySharePct: 12.3,
    },
    {
      companyId: 5,
      companyName: "Summit Cold Chain",
      companyCode: "SCC",
      status: "ACTIVE",
      totalEmployees: 100,
      totalLogs: 350,
      onTimeCount: 302,
      gracePeriodCount: 12,
      moderateLateCount: 24,
      severeLateCount: 12,
      totalLateCount: 36,
      undertimeCount: 3,
      punctualityRate: 89.7,
      avgDelayMinutes: 22.4,
      punctualitySharePct: 6.7,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-02",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchIntercompanyPunctuality({
  groupId,
  startDate,
  endDate,
  force = false,
}: FetchPunctualityParams): Promise<IntercompanyPunctualityResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/hr/${groupId}/punctuality?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchIntercompanyPunctuality] Server responded with status ${res.status}`);
      return FALLBACK_PUNCTUALITY_DATA;
    }

    const data: IntercompanyPunctualityResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchIntercompanyPunctuality] Error fetching data, using fallback:", err);
    return FALLBACK_PUNCTUALITY_DATA;
  }
}
