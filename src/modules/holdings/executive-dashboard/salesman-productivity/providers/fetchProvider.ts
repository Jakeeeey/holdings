import type {
  SalesmanProductivityResponse,
} from "../types";

export interface FetchSalesmanProductivityParams {
  groupId: string | number;
  startDate?: string;
  endDate?: string;
  branchId?: number;
  tier?: string;
  search?: string;
  force?: boolean;
}

export const FALLBACK_SALESMAN_PRODUCTIVITY_DATA: SalesmanProductivityResponse = {
  kpis: {
    totalRevenue: 34850600.0,
    totalInvoicesCount: 1642,
    activeSalesmenCount: 42,
    totalOutletsReached: 986,
    averageDropSize: 21224.5,
    averageQuotaAttainment: 89.4,
    topPerformerName: "Romeo Aromin",
    topPerformerRevenue: 2845200.0,
    eliteRepsCount: 14,
    underperformingRepsCount: 5,
  },
  trends: [
    { date: "2026-10-06", periodLabel: "W41", revenue: 7650000.0, invoicesCount: 380, activeSalesmenCount: 38, averageDropSize: 20131.6 },
    { date: "2026-10-13", periodLabel: "W42", revenue: 8420000.0, invoicesCount: 412, activeSalesmenCount: 40, averageDropSize: 20436.9 },
    { date: "2026-10-20", periodLabel: "W43", revenue: 9180000.0, invoicesCount: 418, activeSalesmenCount: 41, averageDropSize: 21961.7 },
    { date: "2026-10-27", periodLabel: "W44", revenue: 9600600.0, invoicesCount: 432, activeSalesmenCount: 42, averageDropSize: 22223.6 },
  ],
  depots: [
    {
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      salesmanCount: 16,
      invoiceCount: 684,
      totalRevenue: 15420300.0,
      averageDropSize: 22544.3,
      averageQuotaAttainment: 92.1,
    },
    {
      branchId: 279,
      branchName: "Central Logistics Hub",
      salesmanCount: 14,
      invoiceCount: 540,
      totalRevenue: 11850000.0,
      averageDropSize: 21944.4,
      averageQuotaAttainment: 88.5,
    },
    {
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      salesmanCount: 8,
      invoiceCount: 268,
      totalRevenue: 5120300.0,
      averageDropSize: 19105.6,
      averageQuotaAttainment: 86.2,
    },
    {
      branchId: 208,
      branchName: "La Union Depot",
      salesmanCount: 4,
      invoiceCount: 150,
      totalRevenue: 2460000.0,
      averageDropSize: 16400.0,
      averageQuotaAttainment: 84.0,
    },
  ],
  salesmen: [
    {
      salesmanId: 124,
      name: "Romeo Aromin",
      code: "FTD-TDS-(C)-2",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      truckPlate: "DAG-002",
      totalRevenue: 2845200.0,
      invoiceCount: 48,
      uniqueCustomersCount: 36,
      averageDropSize: 59275.0,
      targetAmount: 2500000.0,
      quotaAchievementRate: 113.8,
      tier: "ELITE",
      latestInvoiceDate: "2026-11-09",
    },
    {
      salesmanId: 1051,
      name: "osave osave",
      code: "OSAVE (E)",
      branchId: 279,
      branchName: "Central Logistics Hub",
      truckPlate: "ESales-01",
      totalRevenue: 2850000.0,
      invoiceCount: 12,
      uniqueCustomersCount: 4,
      averageDropSize: 237500.0,
      targetAmount: 2500000.0,
      quotaAchievementRate: 114.0,
      tier: "ELITE",
      latestInvoiceDate: "2026-11-09",
    },
    {
      salesmanId: 1008,
      name: "Johnel Tabafunda",
      code: "FTD-TDS-(B)-1",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      truckPlate: "DAG-008",
      totalRevenue: 1945600.0,
      invoiceCount: 86,
      uniqueCustomersCount: 64,
      averageDropSize: 22623.3,
      targetAmount: 1800000.0,
      quotaAchievementRate: 108.1,
      tier: "ELITE",
      latestInvoiceDate: "2026-11-08",
    },
    {
      salesmanId: 1058,
      name: "Jaime Gimeniano (LPG-D)",
      code: "LTD-TDS-CE-(D)-1",
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      truckPlate: "PANG-014",
      totalRevenue: 1420500.0,
      invoiceCount: 32,
      uniqueCustomersCount: 22,
      averageDropSize: 44390.6,
      targetAmount: 1500000.0,
      quotaAchievementRate: 94.7,
      tier: "ON_TRACK",
      latestInvoiceDate: "2026-11-07",
    },
    {
      salesmanId: 1,
      name: "Andrei Siapno",
      code: "E-SALES",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      truckPlate: "ESales",
      totalRevenue: 1120000.0,
      invoiceCount: 42,
      uniqueCustomersCount: 28,
      averageDropSize: 26666.7,
      targetAmount: 1200000.0,
      quotaAchievementRate: 93.3,
      tier: "ON_TRACK",
      latestInvoiceDate: "2026-11-06",
    },
    {
      salesmanId: 65,
      name: "Frenslee Liclican Jr.",
      code: "BENG-VAN",
      branchId: 174,
      branchName: "La Union Depot",
      truckPlate: "BENG-VAN",
      totalRevenue: 820400.0,
      invoiceCount: 45,
      uniqueCustomersCount: 31,
      averageDropSize: 18231.1,
      targetAmount: 1100000.0,
      quotaAchievementRate: 74.6,
      tier: "MODERATE",
      latestInvoiceDate: "2026-11-05",
    },
    {
      salesmanId: 64,
      name: "P.J. Sales",
      code: "LMTD-KAS-SJD-(C)-1",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      truckPlate: "PANG-SJD",
      totalRevenue: 480200.0,
      invoiceCount: 34,
      uniqueCustomersCount: 20,
      averageDropSize: 14123.5,
      targetAmount: 1000000.0,
      quotaAchievementRate: 48.0,
      tier: "UNDERPERFORMING",
      latestInvoiceDate: "2026-11-04",
    },
  ],
  filters: {},
  source: "fallback_mock",
  timestamp: new Date().toISOString(),
};

const clientCache = new Map<string, { data: SalesmanProductivityResponse; ts: number }>();
const CLIENT_CACHE_TTL = 20000; // 20s

export async function fetchSalesmanProductivity(
  params: FetchSalesmanProductivityParams
): Promise<SalesmanProductivityResponse> {
  const { groupId, startDate, endDate, branchId, tier, search, force } = params;
  const cacheKey = `client_salesman_prod_${groupId}_${startDate || "all"}_${endDate || "all"}_${branchId || "all"}_${tier || "all"}_${search || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (Date.now() - cached.ts < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (branchId) queryParams.set("branchId", String(branchId));
  if (tier) queryParams.set("tier", tier);
  if (search) queryParams.set("search", search);
  if (force) queryParams.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/salesman-productivity?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchSalesmanProductivity] Server status ${res.status}. Using fallback.`);
      return filterFallback(FALLBACK_SALESMAN_PRODUCTIVITY_DATA, params);
    }

    const data: SalesmanProductivityResponse = await res.json();
    clientCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error("[fetchSalesmanProductivity] Network error, fallback data served:", err);
    return filterFallback(FALLBACK_SALESMAN_PRODUCTIVITY_DATA, params);
  }
}

function filterFallback(
  base: SalesmanProductivityResponse,
  params: FetchSalesmanProductivityParams
): SalesmanProductivityResponse {
  let salesmen = [...base.salesmen];

  if (params.tier && params.tier !== "ALL") {
    salesmen = salesmen.filter((s) => s.tier === params.tier);
  }
  if (params.branchId && params.branchId !== 0) {
    salesmen = salesmen.filter((s) => s.branchId === params.branchId);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    salesmen = salesmen.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.truckPlate && s.truckPlate.toLowerCase().includes(q))
    );
  }

  return {
    ...base,
    salesmen,
    filters: {
      startDate: params.startDate,
      endDate: params.endDate,
      branchId: params.branchId,
      tier: params.tier,
      search: params.search,
    },
    timestamp: new Date().toISOString(),
  };
}
