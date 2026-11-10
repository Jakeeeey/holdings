import type {
  GrossMarginResponse,
} from "../types";

export interface FetchGrossMarginParams {
  groupId: string | number;
  startDate?: string;
  endDate?: string;
  category?: string;
  branchId?: number;
  status?: string;
  search?: string;
  force?: boolean;
}

export const FALLBACK_GROSS_MARGIN_DATA: GrossMarginResponse = {
  kpis: {
    totalRevenue: 54820300.0,
    totalCogs: 42650120.0,
    grossProfit: 12170180.0,
    grossMarginPercentage: 22.2,
    totalUnitsSold: 345820,
    totalInvoicesCount: 1845,
    averageOrderProfit: 6596.3,
    topMarginCategory: "Spices & Seasonings",
    topMarginCategoryRate: 31.4,
  },
  trends: [
    { date: "2026-10-06", periodLabel: "W41", revenue: 11200000.0, cogs: 8750000.0, grossProfit: 2450000.0, marginPercentage: 21.9 },
    { date: "2026-10-13", periodLabel: "W42", revenue: 13450000.0, cogs: 10420000.0, grossProfit: 3030000.0, marginPercentage: 22.5 },
    { date: "2026-10-20", periodLabel: "W43", revenue: 14120000.0, cogs: 10890000.0, grossProfit: 3230000.0, marginPercentage: 22.9 },
    { date: "2026-10-27", periodLabel: "W44", revenue: 16050300.0, cogs: 12590120.0, grossProfit: 3460180.0, marginPercentage: 21.6 },
  ],
  categories: [
    {
      category: "Edible Oils & Shortening",
      productCount: 18,
      unitsSold: 142500,
      totalRevenue: 24850000.0,
      totalCogs: 19850000.0,
      grossProfit: 5000000.0,
      grossMarginPercentage: 20.1,
      revenueSharePercentage: 45.3,
    },
    {
      category: "Spices & Seasonings",
      productCount: 26,
      unitsSold: 88400,
      totalRevenue: 12450000.0,
      totalCogs: 8540000.0,
      grossProfit: 3910000.0,
      grossMarginPercentage: 31.4,
      revenueSharePercentage: 22.7,
    },
    {
      category: "Sauces & Condiments",
      productCount: 22,
      unitsSold: 65200,
      totalRevenue: 8950000.0,
      totalCogs: 6890000.0,
      grossProfit: 2060000.0,
      grossMarginPercentage: 23.0,
      revenueSharePercentage: 16.3,
    },
    {
      category: "Commercial Gas & Fuel",
      productCount: 6,
      unitsSold: 18400,
      totalRevenue: 5420300.0,
      totalCogs: 4410120.0,
      grossProfit: 1010180.0,
      grossMarginPercentage: 18.6,
      revenueSharePercentage: 9.9,
    },
    {
      category: "Dairy & Beverage Creamers",
      productCount: 12,
      unitsSold: 31320,
      totalRevenue: 3150000.0,
      totalCogs: 2960000.0,
      grossProfit: 190000.0,
      grossMarginPercentage: 6.0,
      revenueSharePercentage: 5.7,
    },
  ],
  warehouses: [
    {
      branchId: 279,
      branchName: "Central Logistics Hub",
      invoicesCount: 920,
      unitsSold: 185400,
      totalRevenue: 28940000.0,
      totalCogs: 22420000.0,
      grossProfit: 6520000.0,
      grossMarginPercentage: 22.5,
    },
    {
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      invoicesCount: 512,
      unitsSold: 94200,
      totalRevenue: 15420300.0,
      totalCogs: 11950120.0,
      grossProfit: 3470180.0,
      grossMarginPercentage: 22.5,
    },
    {
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      invoicesCount: 265,
      unitsSold: 42100,
      totalRevenue: 6850000.0,
      totalCogs: 5420000.0,
      grossProfit: 1430000.0,
      grossMarginPercentage: 20.9,
    },
    {
      branchId: 208,
      branchName: "La Union Depot",
      invoicesCount: 148,
      unitsSold: 24120,
      totalRevenue: 3610000.0,
      totalCogs: 2860000.0,
      grossProfit: 750000.0,
      grossMarginPercentage: 20.8,
    },
  ],
  products: [
    {
      productId: 22009,
      productName: "Mama Pina's Paminta Cracked 15'sx30",
      productCode: "MP-PEP-CRK-15",
      productBrand: "Mama Pina's",
      productCategory: "Spices & Seasonings",
      unitsSold: 42150,
      averageUnitPrice: 24.5,
      averageUnitCost: 16.5,
      totalRevenue: 1032675.0,
      totalCogs: 695475.0,
      grossProfit: 337200.0,
      grossMarginPercentage: 32.7,
      marginHealth: "HIGH",
    },
    {
      productId: 22056,
      productName: "Mama Pina's Palm Oil 17kg Tin",
      productCode: "MP-OIL-17KG",
      productBrand: "Mama Pina's",
      productCategory: "Edible Oils & Shortening",
      unitsSold: 12450,
      averageUnitPrice: 1085.0,
      averageUnitCost: 854.65,
      totalRevenue: 13508250.0,
      totalCogs: 10640392.5,
      grossProfit: 2867857.5,
      grossMarginPercentage: 21.2,
      marginHealth: "HEALTHY",
    },
    {
      productId: 25342,
      productName: "POL SEAGAS 50KG",
      productCode: "GAS-POL-50",
      productBrand: "Seagas",
      productCategory: "Commercial Gas & Fuel",
      unitsSold: 890,
      averageUnitPrice: 6068.0,
      averageUnitCost: 4759.5,
      totalRevenue: 5400520.0,
      totalCogs: 4235955.0,
      grossProfit: 1164565.0,
      grossMarginPercentage: 21.6,
      marginHealth: "HEALTHY",
    },
    {
      productId: 22010,
      productName: "Mama Pina's Soy Sauce Premium 1L Bottle",
      productCode: "MP-SOY-1L",
      productBrand: "Mama Pina's",
      productCategory: "Sauces & Condiments",
      unitsSold: 28400,
      averageUnitPrice: 38.0,
      averageUnitCost: 28.5,
      totalRevenue: 1079200.0,
      totalCogs: 809400.0,
      grossProfit: 269800.0,
      grossMarginPercentage: 25.0,
      marginHealth: "HIGH",
    },
    {
      productId: 22011,
      productName: "Brooke Farms Sweetened Condensed Creamer 1kgx24",
      productCode: "BF-CRM-1KG",
      productBrand: "Brooke Farms",
      productCategory: "Dairy & Beverage Creamers",
      unitsSold: 18200,
      averageUnitPrice: 92.95,
      averageUnitCost: 79.2,
      totalRevenue: 1691690.0,
      totalCogs: 1441440.0,
      grossProfit: 250250.0,
      grossMarginPercentage: 14.8,
      marginHealth: "LOW",
    },
  ],
  filters: {},
  source: "fallback_mock",
  timestamp: new Date().toISOString(),
};

const clientCache = new Map<string, { data: GrossMarginResponse; ts: number }>();
const CLIENT_CACHE_TTL = 20000; // 20s

export async function fetchGrossMargin(
  params: FetchGrossMarginParams
): Promise<GrossMarginResponse> {
  const { groupId, startDate, endDate, category, branchId, status, search, force } = params;
  const cacheKey = `client_margin_${groupId}_${startDate || "all"}_${endDate || "all"}_${category || "all"}_${branchId || "all"}_${status || "all"}_${search || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (Date.now() - cached.ts < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (category) queryParams.set("category", category);
  if (branchId) queryParams.set("branchId", String(branchId));
  if (status) queryParams.set("status", status);
  if (search) queryParams.set("search", search);
  if (force) queryParams.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/gross-margin?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchGrossMargin] Server error ${res.status}. Serving fallback.`);
      return filterFallback(FALLBACK_GROSS_MARGIN_DATA, params);
    }

    const data: GrossMarginResponse = await res.json();
    clientCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error("[fetchGrossMargin] Network error, fallback data served:", err);
    return filterFallback(FALLBACK_GROSS_MARGIN_DATA, params);
  }
}

function filterFallback(
  base: GrossMarginResponse,
  params: FetchGrossMarginParams
): GrossMarginResponse {
  let products = [...base.products];

  if (params.status && params.status !== "ALL") {
    products = products.filter((p) => p.marginHealth === params.status);
  }
  if (params.category && params.category !== "ALL") {
    products = products.filter((p) => p.productCategory?.toLowerCase() === params.category?.toLowerCase());
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(s) ||
        (p.productCode && p.productCode.toLowerCase().includes(s))
    );
  }

  return {
    ...base,
    products,
    filters: {
      startDate: params.startDate,
      endDate: params.endDate,
      category: params.category,
      branchId: params.branchId,
      status: params.status,
      search: params.search,
    },
    timestamp: new Date().toISOString(),
  };
}

