import type {
  FinishedGoodsInventoryResponse,
  FetchFinishedGoodsParams,
} from "../types";

export const FALLBACK_FINISHED_GOODS_DATA: FinishedGoodsInventoryResponse = {
  kpis: {
    totalInventoryValuation: 5482350,
    totalOnHandUnits: 34620,
    totalReservedUnits: 6240,
    totalAvailableUnits: 28380,
    fulfillmentReadinessRate: 91.7,
    averageDaysOfSupply: 21.4,
    totalMonitoredSkus: 10,
    optimalStockSkus: 7,
    lowStockSkus: 2,
    overstockedSkus: 1,
    outOfStockSkus: 0,
    topValuationProduct: "Mama Pina's Palm Oil 1L x 12 BAS",
    topValuationAmount: 1198800,
  },
  items: [
    {
      id: 1,
      productId: 25812,
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productCode: "BASP-OL-1L-BOX",
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      uom: "BOX",
      unitValue: 875,
      onHandQuantity: 1370,
      reservedQuantity: 280,
      availableQuantity: 1090,
      reorderPoint: 400,
      safetyStock: 300,
      daysOfSupply: 24.5,
      totalValuation: 1198750,
      warehouseLocation: "Main Plant WH - Bay A1-A4",
      status: "OPTIMAL",
      batchCount: 4,
      oldestBatchDate: "2026-10-18",
    },
    {
      id: 2,
      productId: 25798,
      productName: "Mama Pina's Bihon 454g x 20",
      productCode: "MP-BHN-454G-CSE",
      category: "NOODLES_AND_BIHON",
      categoryLabel: "Noodles & Bihon",
      uom: "CASE",
      unitValue: 640,
      onHandQuantity: 1650,
      reservedQuantity: 410,
      availableQuantity: 1240,
      reorderPoint: 500,
      safetyStock: 350,
      daysOfSupply: 18.2,
      totalValuation: 1056000,
      warehouseLocation: "Finished Goods Staging Bay B2",
      status: "OPTIMAL",
      batchCount: 5,
      oldestBatchDate: "2026-10-22",
    },
    {
      id: 3,
      productId: 25805,
      productName: "Mama Pina's Canolein Oil 1L x 12",
      productCode: "MPCO-OL-CNL-1L-BOX",
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      uom: "BOX",
      unitValue: 920,
      onHandQuantity: 890,
      reservedQuantity: 190,
      availableQuantity: 700,
      reorderPoint: 300,
      safetyStock: 200,
      daysOfSupply: 26.8,
      totalValuation: 818800,
      warehouseLocation: "Main Plant WH - Bay A5",
      status: "OPTIMAL",
      batchCount: 3,
      oldestBatchDate: "2026-10-25",
    },
    {
      id: 4,
      productId: 25810,
      productName: "Mama Pina's Palm Oil 17G Container",
      productCode: "BTC-OL-17KG",
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      uom: "TIN",
      unitValue: 1280,
      onHandQuantity: 580,
      reservedQuantity: 150,
      availableQuantity: 430,
      reorderPoint: 250,
      safetyStock: 180,
      daysOfSupply: 15.6,
      totalValuation: 742400,
      warehouseLocation: "Bulk Oil Pallet Racks C1",
      status: "OPTIMAL",
      batchCount: 3,
      oldestBatchDate: "2026-10-28",
    },
    {
      id: 5,
      productId: 25803,
      productName: "Mama Pina's Canola 4L x 4",
      productCode: "MPCO-OL-CNL-4L-BOX",
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      uom: "BOX",
      unitValue: 1150,
      onHandQuantity: 420,
      reservedQuantity: 95,
      availableQuantity: 325,
      reorderPoint: 200,
      safetyStock: 150,
      daysOfSupply: 22.0,
      totalValuation: 483000,
      warehouseLocation: "Main Plant WH - Bay A6",
      status: "OPTIMAL",
      batchCount: 2,
      oldestBatchDate: "2026-10-30",
    },
    {
      id: 6,
      productId: 25809,
      productName: "Mama Pina's Coconut Milk 400ml x 24",
      productCode: "MPCM-400ML-BOX",
      category: "COCONUT_PRODUCTS",
      categoryLabel: "Coconut Products",
      uom: "BOX",
      unitValue: 710,
      onHandQuantity: 560,
      reservedQuantity: 140,
      availableQuantity: 420,
      reorderPoint: 250,
      safetyStock: 180,
      daysOfSupply: 19.5,
      totalValuation: 397600,
      warehouseLocation: "Cold Ambient Staging Bay D1",
      status: "OPTIMAL",
      batchCount: 3,
      oldestBatchDate: "2026-10-26",
    },
    {
      id: 7,
      productId: 25758,
      productName: "Refined Margarine Blend Gold 15kg",
      productCode: "FA-MARG-GLD",
      category: "SPECIALTY_FATS",
      categoryLabel: "Specialty Fats & Margarine",
      uom: "CARTON",
      unitValue: 870,
      onHandQuantity: 410,
      reservedQuantity: 120,
      availableQuantity: 290,
      reorderPoint: 200,
      safetyStock: 150,
      daysOfSupply: 20.8,
      totalValuation: 356700,
      warehouseLocation: "Chilled Storage Zone E2",
      status: "OPTIMAL",
      batchCount: 2,
      oldestBatchDate: "2026-10-27",
    },
    {
      id: 8,
      productId: 25762,
      productName: "Baking Shortening Premium 20kg",
      productCode: "FA-SHRT-PRM",
      category: "SPECIALTY_FATS",
      categoryLabel: "Specialty Fats & Margarine",
      uom: "CARTON",
      unitValue: 980,
      onHandQuantity: 190,
      reservedQuantity: 110,
      availableQuantity: 80,
      reorderPoint: 200,
      safetyStock: 120,
      daysOfSupply: 7.2,
      totalValuation: 186200,
      warehouseLocation: "Chilled Storage Zone E3",
      status: "LOW_STOCK",
      batchCount: 1,
      oldestBatchDate: "2026-11-01",
    },
    {
      id: 9,
      productId: 25800,
      productName: "Mama Pina's Bihon 454g x 6",
      productCode: "MPB6-NO-BHN-454g-CSE",
      category: "NOODLES_AND_BIHON",
      categoryLabel: "Noodles & Bihon",
      uom: "CASE",
      unitValue: 240,
      onHandQuantity: 450,
      reservedQuantity: 280,
      availableQuantity: 170,
      reorderPoint: 400,
      safetyStock: 250,
      daysOfSupply: 6.8,
      totalValuation: 108000,
      warehouseLocation: "Finished Goods Staging Bay B3",
      status: "LOW_STOCK",
      batchCount: 2,
      oldestBatchDate: "2026-11-02",
    },
    {
      id: 10,
      productId: 25807,
      productName: "Mama Pina's Canolein Oil 2L x 6",
      productCode: "MPCAN-OL-CNL-2L-BOX",
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      uom: "BOX",
      unitValue: 880,
      onHandQuantity: 150,
      reservedQuantity: 15,
      availableQuantity: 135,
      reorderPoint: 80,
      safetyStock: 50,
      daysOfSupply: 42.0,
      totalValuation: 132000,
      warehouseLocation: "Main Plant WH - Bay A7",
      status: "OVERSTOCKED",
      batchCount: 2,
      oldestBatchDate: "2026-10-15",
    },
  ],
  categories: [
    {
      category: "COOKING_OILS",
      categoryLabel: "Cooking Oils",
      totalSkus: 5,
      totalOnHandUnits: 3410,
      totalAvailableUnits: 2680,
      totalValuation: 3374950,
      averageDaysOfSupply: 26.2,
      optimalCount: 4,
      lowStockCount: 0,
    },
    {
      category: "NOODLES_AND_BIHON",
      categoryLabel: "Noodles & Bihon",
      totalSkus: 2,
      totalOnHandUnits: 2100,
      totalAvailableUnits: 1410,
      totalValuation: 1164000,
      averageDaysOfSupply: 12.5,
      optimalCount: 1,
      lowStockCount: 1,
    },
    {
      category: "SPECIALTY_FATS",
      categoryLabel: "Specialty Fats & Margarine",
      totalSkus: 2,
      totalOnHandUnits: 600,
      totalAvailableUnits: 370,
      totalValuation: 542900,
      averageDaysOfSupply: 14.0,
      optimalCount: 1,
      lowStockCount: 1,
    },
    {
      category: "COCONUT_PRODUCTS",
      categoryLabel: "Coconut Products",
      totalSkus: 1,
      totalOnHandUnits: 560,
      totalAvailableUnits: 420,
      totalValuation: 397600,
      averageDaysOfSupply: 19.5,
      optimalCount: 1,
      lowStockCount: 0,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

const clientCache = new Map<string, { data: FinishedGoodsInventoryResponse; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 20000;

export async function fetchFinishedGoodsInventory(
  params: FetchFinishedGoodsParams
): Promise<FinishedGoodsInventoryResponse> {
  const { groupId, startDate, endDate, category, status, force } = params;

  const q = new URLSearchParams();
  if (startDate) q.set("startDate", startDate);
  if (endDate) q.set("endDate", endDate);
  if (category) q.set("category", category);
  if (status) q.set("status", status);
  if (force) q.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/finished-goods?${q.toString()}`;
  const cacheKey = `${groupId}_${startDate || ""}_${endDate || ""}_${category || ""}_${status || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const entry = clientCache.get(cacheKey)!;
    if (Date.now() - entry.timestamp < CLIENT_CACHE_TTL_MS) {
      return entry.data;
    }
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchFinishedGoodsInventory] API returned status ${res.status}`);
      return FALLBACK_FINISHED_GOODS_DATA;
    }

    const data: FinishedGoodsInventoryResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("[fetchFinishedGoodsInventory] Network error, using fallback:", error);
    return FALLBACK_FINISHED_GOODS_DATA;
  }
}

