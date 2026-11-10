import type {
  InventoryAgingResponse,
} from "../types";

export interface FetchInventoryAgingParams {
  groupId: string | number;
  bracket?: string;
  status?: string;
  branchId?: number;
  search?: string;
  force?: boolean;
}

export const FALLBACK_INVENTORY_AGING_DATA: InventoryAgingResponse = {
  kpis: {
    totalValuation: 24680450.0,
    totalSlobValue: 4892150.0,
    slobRiskRatio: 19.8,
    totalStockUnits: 894500,
    slobUnits: 142300,
    totalSkuCount: 1840,
    criticalSlobSkuCount: 382,
    atRiskSkuCount: 295,
    topAgedProductName: "Mama Pina's Palm Oil 17kg Tin",
    topAgedProductValue: 845200.0,
    averageAgingDays: 78.4,
  },
  brackets: [
    {
      bracket: "0-30",
      label: "0-30 Days (Fresh)",
      skuCount: 680,
      totalUnits: 420000,
      totalValuation: 11250000.0,
      sharePercentage: 45.6,
      color: "#10b981", // emerald
    },
    {
      bracket: "31-60",
      label: "31-60 Days (Normal)",
      skuCount: 483,
      totalUnits: 215400,
      totalValuation: 5688300.0,
      sharePercentage: 23.1,
      color: "#06b6d4", // cyan
    },
    {
      bracket: "61-90",
      label: "61-90 Days (Slow Moving)",
      skuCount: 295,
      totalUnits: 116800,
      totalValuation: 2850000.0,
      sharePercentage: 11.5,
      color: "#f59e0b", // amber
    },
    {
      bracket: "91-120",
      label: "91-120 Days (At Risk)",
      skuCount: 162,
      totalUnits: 65200,
      totalValuation: 1920000.0,
      sharePercentage: 7.8,
      color: "#f97316", // orange
    },
    {
      bracket: "120+",
      label: "120+ Days (SLOB / Obsolete)",
      skuCount: 220,
      totalUnits: 77100,
      totalValuation: 2972150.0,
      sharePercentage: 12.0,
      color: "#ef4444", // rose
    },
  ],
  warehouses: [
    {
      branchId: 279,
      branchName: "Central Logistics Hub",
      skuCount: 1120,
      totalUnits: 512000,
      totalValuation: 14200000.0,
      slobValuation: 2650000.0,
      slobUnits: 76500,
      slobRatio: 18.7,
    },
    {
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      skuCount: 420,
      totalUnits: 218500,
      totalValuation: 6150450.0,
      slobValuation: 1240150.0,
      slobUnits: 38200,
      slobRatio: 20.2,
    },
    {
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      skuCount: 180,
      totalUnits: 98000,
      totalValuation: 2650000.0,
      slobValuation: 622000.0,
      slobUnits: 17400,
      slobRatio: 23.5,
    },
    {
      branchId: 208,
      branchName: "La Union Depot",
      skuCount: 120,
      totalUnits: 66000,
      totalValuation: 1680000.0,
      slobValuation: 380000.0,
      slobUnits: 10200,
      slobRatio: 22.6,
    },
  ],
  items: [
    {
      id: "SLOB:279:22056",
      branchId: 279,
      branchName: "Central Logistics Hub",
      productId: 22056,
      productName: "Mama Pina's Palm Oil 17kg Tin",
      productCode: "MP-OIL-17KG",
      productBrand: "Mama Pina's",
      productCategory: "Edible Oils",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 989,
      costPerUnit: 854.65,
      stockValue: 845248.85,
      lastOutboundDate: "2025-11-20 00:00:00",
      daysSinceLastOutbound: 142,
      isSlob: 1,
      slobDaysThreshold: 60,
      bracket: "120+",
      status: "SLOB",
    },
    {
      id: "SLOB:279:22008",
      branchId: 279,
      branchName: "Central Logistics Hub",
      productId: 22008,
      productName: "Mama Pina's Paminta Cracked 15'sx30",
      productCode: "MP-PEP-CRK-15",
      productBrand: "Mama Pina's",
      productCategory: "Spices & Seasonings",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 1420,
      costPerUnit: 16.5,
      stockValue: 23430.0,
      lastOutboundDate: "2026-01-14 00:00:00",
      daysSinceLastOutbound: 115,
      isSlob: 1,
      slobDaysThreshold: 60,
      bracket: "91-120",
      status: "AT_RISK",
    },
    {
      id: "SLOB:278:22009",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      productId: 22009,
      productName: "Mama Pina's Paminta Whole 50g Pouch",
      productCode: "MP-PEP-WHL-50",
      productBrand: "Mama Pina's",
      productCategory: "Spices & Seasonings",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 3200,
      costPerUnit: 18.2,
      stockValue: 58240.0,
      lastOutboundDate: "2026-02-12 00:00:00",
      daysSinceLastOutbound: 86,
      isSlob: 1,
      slobDaysThreshold: 60,
      bracket: "61-90",
      status: "SLOW_MOVING",
    },
    {
      id: "SLOB:238:22010",
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      productId: 22010,
      productName: "Mama Pina's Soy Sauce Premium 1L Bottle",
      productCode: "MP-SOY-1L",
      productBrand: "Mama Pina's",
      productCategory: "Sauces & Condiments",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 4800,
      costPerUnit: 28.5,
      stockValue: 136800.0,
      lastOutboundDate: "2026-03-25 00:00:00",
      daysSinceLastOutbound: 45,
      isSlob: 0,
      slobDaysThreshold: 60,
      bracket: "31-60",
      status: "NORMAL",
    },
    {
      id: "SLOB:279:22011",
      branchId: 279,
      branchName: "Central Logistics Hub",
      productId: 22011,
      productName: "Mama Pina's Cane Vinegar 1L Jug",
      productCode: "MP-VIN-1L",
      productBrand: "Mama Pina's",
      productCategory: "Sauces & Condiments",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 8200,
      costPerUnit: 24.0,
      stockValue: 196800.0,
      lastOutboundDate: "2026-04-20 00:00:00",
      daysSinceLastOutbound: 19,
      isSlob: 0,
      slobDaysThreshold: 60,
      bracket: "0-30",
      status: "FRESH",
    },
    {
      id: "SLOB:279:22012",
      branchId: 279,
      branchName: "Central Logistics Hub",
      productId: 22012,
      productName: "Mama Pina's Iodized Salt 500g Pack",
      productCode: "MP-SLT-500",
      productBrand: "Mama Pina's",
      productCategory: "Spices & Seasonings",
      supplierId: 33,
      supplierShortcut: "MP",
      currentStock: 650,
      costPerUnit: 12.0,
      stockValue: 7800.0,
      lastOutboundDate: "2025-10-10 00:00:00",
      daysSinceLastOutbound: 180,
      isSlob: 1,
      slobDaysThreshold: 60,
      bracket: "120+",
      status: "SLOB",
    },
  ],
  filters: {},
  source: "fallback_mock",
  timestamp: new Date().toISOString(),
};

const clientCache = new Map<string, { data: InventoryAgingResponse; ts: number }>();
const CLIENT_CACHE_TTL = 20000; // 20s

export async function fetchInventoryAging(
  params: FetchInventoryAgingParams
): Promise<InventoryAgingResponse> {
  const { groupId, bracket, status, branchId, search, force } = params;
  const cacheKey = `client_aging_${groupId}_${bracket || "all"}_${status || "all"}_${branchId || "all"}_${search || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (Date.now() - cached.ts < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  const queryParams = new URLSearchParams();
  if (bracket) queryParams.set("bracket", bracket);
  if (status) queryParams.set("status", status);
  if (branchId) queryParams.set("branchId", String(branchId));
  if (search) queryParams.set("search", search);
  if (force) queryParams.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/inventory-aging?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchInventoryAging] Server error status ${res.status}. Using fallback.`);
      return filterFallback(FALLBACK_INVENTORY_AGING_DATA, params);
    }

    const data: InventoryAgingResponse = await res.json();
    clientCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error("[fetchInventoryAging] Network error, fallback data served:", err);
    return filterFallback(FALLBACK_INVENTORY_AGING_DATA, params);
  }
}

function filterFallback(
  base: InventoryAgingResponse,
  params: FetchInventoryAgingParams
): InventoryAgingResponse {
  let items = [...base.items];

  if (params.status && params.status !== "ALL") {
    items = items.filter((i) => i.status === params.status);
  }
  if (params.bracket && params.bracket !== "ALL") {
    items = items.filter((i) => i.bracket === params.bracket);
  }
  if (params.branchId) {
    items = items.filter((i) => i.branchId === params.branchId);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.productName.toLowerCase().includes(s) ||
        (i.productCode && i.productCode.toLowerCase().includes(s))
    );
  }

  return {
    ...base,
    items,
    filters: {
      bracket: params.bracket,
      status: params.status,
      branchId: params.branchId,
      search: params.search,
    },
    timestamp: new Date().toISOString(),
  };
}

