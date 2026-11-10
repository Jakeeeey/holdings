import type { InventoryResponse } from "../types";

export interface FetchInventoryParams {
  groupId: string | number;
  category?: string;
  branchId?: number;
  status?: string;
  search?: string;
  force?: boolean;
}

export const FALLBACK_INVENTORY_DATA: InventoryResponse = {
  kpis: {
    totalValuation: 48920150.8,
    totalStockUnits: 1675092,
    inStockSkuCount: 2342,
    lowStockCount: 48,
    criticalStockCount: 12,
    stockHealthRate: 92.5,
    topCategoryName: "Oils & Shortening",
    topCategoryValuation: 21450800.0,
    averageUnitCost: 29.2,
  },
  categories: [
    {
      category: "Oils & Shortening",
      productCount: 480,
      totalUnits: 685400,
      totalValuation: 21450800.0,
      sharePercentage: 43.8,
    },
    {
      category: "Spices & Seasonings",
      productCount: 720,
      totalUnits: 512300,
      totalValuation: 14210450.0,
      sharePercentage: 29.0,
    },
    {
      category: "Sauces & Condiments",
      productCount: 540,
      totalUnits: 295100,
      totalValuation: 7850200.0,
      sharePercentage: 16.0,
    },
    {
      category: "Canned Goods & Preserves",
      productCount: 360,
      totalUnits: 124500,
      totalValuation: 3840000.0,
      sharePercentage: 7.9,
    },
    {
      category: "Packaging & Consumables",
      productCount: 242,
      totalUnits: 57792,
      totalValuation: 1568700.8,
      sharePercentage: 3.3,
    },
  ],
  locations: [
    {
      branchId: 279,
      branchName: "Central Logistics Hub",
      productCount: 1150,
      totalUnits: 980400,
      totalValuation: 28940000.0,
    },
    {
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      productCount: 620,
      totalUnits: 412500,
      totalValuation: 12150000.0,
    },
    {
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      productCount: 340,
      totalUnits: 182100,
      totalValuation: 5120000.0,
    },
    {
      branchId: 208,
      branchName: "La Union Transit Depot",
      productCount: 232,
      totalUnits: 100092,
      totalValuation: 2710150.8,
    },
  ],
  items: [
    {
      id: "279-22056-33",
      productId: 22056,
      productCode: "MPO-1L",
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productBrand: "Mama Pinas",
      productCategory: "Oils & Shortening",
      unitName: "Box",
      branchId: 279,
      branchName: "Central Logistics Hub",
      runningInventory: 14200,
      unitCost: 854.65,
      totalValuation: 12136030.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-11-07",
    },
    {
      id: "278-22056-33",
      productId: 22056,
      productCode: "MPO-1L",
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productBrand: "Mama Pinas",
      productCategory: "Oils & Shortening",
      unitName: "Box",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      runningInventory: 6800,
      unitCost: 854.65,
      totalValuation: 5811620.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-11-06",
    },
    {
      id: "279-22008-33",
      productId: 22008,
      productCode: "MPPC30",
      productName: "Mama Pina's Paminta Cracked 15'sx30",
      productBrand: "Mama Pinas",
      productCategory: "Spices & Seasonings",
      unitName: "Pieces",
      branchId: 279,
      branchName: "Central Logistics Hub",
      runningInventory: 48500,
      unitCost: 1.1,
      totalValuation: 53350.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-11-05",
    },
    {
      id: "279-22007-18",
      productId: 22007,
      productCode: "BTM-250G",
      productName: "BIGTIME BURGER MAYO 250G X 24",
      productBrand: "Bigtime",
      productCategory: "Sauces & Condiments",
      unitName: "Box",
      branchId: 279,
      branchName: "Central Logistics Hub",
      runningInventory: 3200,
      unitCost: 456.0,
      totalValuation: 1459200.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-11-04",
    },
    {
      id: "278-22009-33",
      productId: 22009,
      productCode: "MP-TIE",
      productName: "Mama Pina's Paminta Whole 15'sx30",
      productBrand: "Mama Pinas",
      productCategory: "Spices & Seasonings",
      unitName: "Tie",
      branchId: 278,
      branchName: "Dagupan Regional Warehouse",
      runningInventory: 420,
      unitCost: 38.5,
      totalValuation: 16170.0,
      stockStatus: "LOW_STOCK",
      lastMovementDate: "2026-11-03",
    },
    {
      id: "238-22009-33",
      productId: 22009,
      productCode: "MP-TIE",
      productName: "Mama Pina's Paminta Whole 15'sx30",
      productBrand: "Mama Pinas",
      productCategory: "Spices & Seasonings",
      unitName: "Tie",
      branchId: 238,
      branchName: "Pangasinan Fleet Hub",
      runningInventory: 85,
      unitCost: 38.5,
      totalValuation: 3272.5,
      stockStatus: "CRITICAL",
      lastMovementDate: "2026-11-02",
    },
    {
      id: "279-22015-33",
      productId: 22015,
      productCode: "MPO-500ML",
      productName: "Mama Pina's Palm Oil 500ml x 24",
      productBrand: "Mama Pinas",
      productCategory: "Oils & Shortening",
      unitName: "Box",
      branchId: 279,
      branchName: "Central Logistics Hub",
      runningInventory: 4120,
      unitCost: 742.0,
      totalValuation: 3057040.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-11-01",
    },
    {
      id: "208-22020-561",
      productId: 22020,
      productCode: "URC-SUGAR",
      productName: "Refined White Sugar 50KG Bag",
      productBrand: "Universal Robina",
      productCategory: "Canned Goods & Preserves",
      unitName: "Bag",
      branchId: 208,
      branchName: "La Union Transit Depot",
      runningInventory: 890,
      unitCost: 2650.0,
      totalValuation: 2358500.0,
      stockStatus: "OPTIMAL",
      lastMovementDate: "2026-10-29",
    },
  ],
  filters: {},
  source: "fallback_mock",
  timestamp: new Date().toISOString(),
};

interface CacheEntry {
  data: InventoryResponse;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20000; // 20s

export async function fetchInventory(
  params: FetchInventoryParams
): Promise<InventoryResponse> {
  const { groupId, category, branchId, status, search, force = false } = params;

  const cacheKey = `inv_${groupId}_${category || "all"}_${branchId || "all"}_${status || "all"}_${search || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (branchId) query.set("branchId", String(branchId));
  if (status) query.set("status", status);
  if (search) query.set("search", search);
  if (force) query.set("force", "true");

  const qs = query.toString();
  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/inventory${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchInventory] API responded with ${res.status}, returning fallback`);
      return FALLBACK_INVENTORY_DATA;
    }

    const data: InventoryResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.warn("[fetchInventory] Failed to fetch inventory from API, returning fallback:", error);
    return FALLBACK_INVENTORY_DATA;
  }
}

