import type {
  ManufacturingCostResponse,
  FetchManufacturingCostParams,
} from "../types";

export const FALLBACK_MANUFACTURING_COST_DATA: ManufacturingCostResponse = {
  kpis: {
    averageCostPerUnit: 686.0,
    budgetStandardUnitCost: 688.5,
    overallCostVariance: -0.36,
    isVarianceFavorable: true,
    averageGrossMargin: 24.8,
    materialCostSharePercentage: 83.2,
    topCostEfficiencySku: "Crispy Canton Noodles 250g x 30",
    topCostEfficiencyMargin: 32.5,
    highestVarianceSku: "Refined Margarine Blend Gold 15kg",
    highestVarianceAmount: 14.0,
    evaluatedSkusCount: 10,
  },
  products: [
    {
      id: 1,
      productId: 25812,
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productCode: "BASP-OL-1L-BOX",
      category: "Cooking Oils",
      uom: "BOX",
      standardCostPerUnit: 680.0,
      actualCostPerUnit: 672.0,
      costVarianceAmount: -8.0,
      costVariancePercentage: -1.18,
      rawMaterialCost: 485.0,
      packagingCost: 112.0,
      directLaborCost: 43.0,
      overheadCost: 32.0,
      sellingPrice: 875.0,
      grossMarginPercentage: 23.2,
      totalBatchProducedUnits: 12400,
      status: "FAVORABLE",
      trend: "DECREASING",
      lastCalculatedDate: "2026-11-04",
    },
    {
      id: 2,
      productId: 25798,
      productName: "Mama Pina's Bihon 454g x 20",
      productCode: "MP-BHN-454G-CSE",
      category: "Noodles & Bihon",
      uom: "CASE",
      standardCostPerUnit: 440.0,
      actualCostPerUnit: 448.0,
      costVarianceAmount: 8.0,
      costVariancePercentage: 1.82,
      rawMaterialCost: 265.0,
      packagingCost: 88.0,
      directLaborCost: 55.0,
      overheadCost: 40.0,
      sellingPrice: 640.0,
      grossMarginPercentage: 30.0,
      totalBatchProducedUnits: 8400,
      status: "ELEVATED",
      trend: "INCREASING",
      lastCalculatedDate: "2026-11-04",
    },
    {
      id: 3,
      productId: 25805,
      productName: "Mama Pina's Canolein Oil 1L x 12",
      productCode: "MPCO-OL-CNL-1L-BOX",
      category: "Cooking Oils",
      uom: "BOX",
      standardCostPerUnit: 715.0,
      actualCostPerUnit: 708.0,
      costVarianceAmount: -7.0,
      costVariancePercentage: -0.98,
      rawMaterialCost: 510.0,
      packagingCost: 115.0,
      directLaborCost: 48.0,
      overheadCost: 35.0,
      sellingPrice: 920.0,
      grossMarginPercentage: 23.0,
      totalBatchProducedUnits: 6500,
      status: "FAVORABLE",
      trend: "DECREASING",
      lastCalculatedDate: "2026-11-03",
    },
    {
      id: 4,
      productId: 25810,
      productName: "Mama Pina's Palm Oil 17G Container",
      productCode: "BTC-OL-17KG",
      category: "Cooking Oils",
      uom: "TIN",
      standardCostPerUnit: 1020.0,
      actualCostPerUnit: 1035.0,
      costVarianceAmount: 15.0,
      costVariancePercentage: 1.47,
      rawMaterialCost: 820.0,
      packagingCost: 110.0,
      directLaborCost: 60.0,
      overheadCost: 45.0,
      sellingPrice: 1280.0,
      grossMarginPercentage: 19.1,
      totalBatchProducedUnits: 4200,
      status: "ON_TARGET",
      trend: "STABLE",
      lastCalculatedDate: "2026-11-04",
    },
    {
      id: 5,
      productId: 25803,
      productName: "Mama Pina's Canola 4L x 4",
      productCode: "MPCO-OL-CNL-4L-BOX",
      category: "Cooking Oils",
      uom: "BOX",
      standardCostPerUnit: 910.0,
      actualCostPerUnit: 898.0,
      costVarianceAmount: -12.0,
      costVariancePercentage: -1.32,
      rawMaterialCost: 690.0,
      packagingCost: 120.0,
      directLaborCost: 50.0,
      overheadCost: 38.0,
      sellingPrice: 1150.0,
      grossMarginPercentage: 21.9,
      totalBatchProducedUnits: 3800,
      status: "FAVORABLE",
      trend: "DECREASING",
      lastCalculatedDate: "2026-11-03",
    },
    {
      id: 6,
      productId: 25809,
      productName: "Mama Pina's Coconut Milk 400ml x 24",
      productCode: "MPCM-400ML-BOX",
      category: "Coconut Products",
      uom: "BOX",
      standardCostPerUnit: 540.0,
      actualCostPerUnit: 532.0,
      costVarianceAmount: -8.0,
      costVariancePercentage: -1.48,
      rawMaterialCost: 360.0,
      packagingCost: 95.0,
      directLaborCost: 45.0,
      overheadCost: 32.0,
      sellingPrice: 710.0,
      grossMarginPercentage: 25.1,
      totalBatchProducedUnits: 5200,
      status: "FAVORABLE",
      trend: "DECREASING",
      lastCalculatedDate: "2026-11-02",
    },
    {
      id: 7,
      productId: 25758,
      productName: "Refined Margarine Blend Gold 15kg",
      productCode: "FA-MARG-GLD",
      category: "Specialty Fats",
      uom: "CARTON",
      standardCostPerUnit: 660.0,
      actualCostPerUnit: 674.0,
      costVarianceAmount: 14.0,
      costVariancePercentage: 2.12,
      rawMaterialCost: 470.0,
      packagingCost: 75.0,
      directLaborCost: 72.0,
      overheadCost: 57.0,
      sellingPrice: 870.0,
      grossMarginPercentage: 22.5,
      totalBatchProducedUnits: 5200,
      status: "ELEVATED",
      trend: "INCREASING",
      lastCalculatedDate: "2026-11-03",
    },
    {
      id: 8,
      productId: 25762,
      productName: "Baking Shortening Premium 20kg",
      productCode: "FA-SHRT-PRM",
      category: "Specialty Fats",
      uom: "CARTON",
      standardCostPerUnit: 750.0,
      actualCostPerUnit: 745.0,
      costVarianceAmount: -5.0,
      costVariancePercentage: -0.67,
      rawMaterialCost: 540.0,
      packagingCost: 85.0,
      directLaborCost: 68.0,
      overheadCost: 52.0,
      sellingPrice: 980.0,
      grossMarginPercentage: 24.0,
      totalBatchProducedUnits: 4800,
      status: "ON_TARGET",
      trend: "STABLE",
      lastCalculatedDate: "2026-11-04",
    },
    {
      id: 9,
      productId: 25752,
      productName: "Soya Bean Oil 20L Jerrycan",
      productCode: "OI-SOY-20L",
      category: "Cooking Oils",
      uom: "CAN",
      standardCostPerUnit: 1180.0,
      actualCostPerUnit: 1195.0,
      costVarianceAmount: 15.0,
      costVariancePercentage: 1.27,
      rawMaterialCost: 940.0,
      packagingCost: 135.0,
      directLaborCost: 65.0,
      overheadCost: 55.0,
      sellingPrice: 1450.0,
      grossMarginPercentage: 17.6,
      totalBatchProducedUnits: 9250,
      status: "ON_TARGET",
      trend: "STABLE",
      lastCalculatedDate: "2026-11-01",
    },
    {
      id: 10,
      productId: 25760,
      productName: "Crispy Canton Noodles 250g x 30",
      productCode: "FD-CAN-250G",
      category: "Noodles & Bihon",
      uom: "CASE",
      standardCostPerUnit: 410.0,
      actualCostPerUnit: 405.0,
      costVarianceAmount: -5.0,
      costVariancePercentage: -1.22,
      rawMaterialCost: 235.0,
      packagingCost: 85.0,
      directLaborCost: 50.0,
      overheadCost: 35.0,
      sellingPrice: 600.0,
      grossMarginPercentage: 32.5,
      totalBatchProducedUnits: 8400,
      status: "FAVORABLE",
      trend: "DECREASING",
      lastCalculatedDate: "2026-11-04",
    },
  ],
  components: [
    {
      component: "DIRECT_MATERIALS",
      label: "Direct Raw Materials",
      totalCostShare: 5355000,
      percentage: 67.5,
      averagePerUnit: 463.0,
    },
    {
      component: "PACKAGING",
      label: "Packaging Materials",
      totalCostShare: 1245000,
      percentage: 15.7,
      averagePerUnit: 107.5,
    },
    {
      component: "DIRECT_LABOR",
      label: "Direct Line Labor",
      totalCostShare: 685000,
      percentage: 8.6,
      averagePerUnit: 59.0,
    },
    {
      component: "MANUFACTURING_OVERHEAD",
      label: "Factory Utilities & Overhead",
      totalCostShare: 650000,
      percentage: 8.2,
      averagePerUnit: 56.5,
    },
  ],
  categories: [
    {
      category: "Cooking Oils",
      productCount: 5,
      averageUnitCost: 901.6,
      averageStandardCost: 901.0,
      averageMargin: 21.8,
      variancePercentage: 0.07,
    },
    {
      category: "Noodles & Bihon",
      productCount: 2,
      averageUnitCost: 426.5,
      averageStandardCost: 425.0,
      averageMargin: 31.3,
      variancePercentage: 0.35,
    },
    {
      category: "Specialty Fats",
      productCount: 2,
      averageUnitCost: 709.5,
      averageStandardCost: 705.0,
      averageMargin: 23.3,
      variancePercentage: 0.64,
    },
    {
      category: "Coconut Products",
      productCount: 1,
      averageUnitCost: 532.0,
      averageStandardCost: 540.0,
      averageMargin: 25.1,
      variancePercentage: -1.48,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

const clientCache = new Map<string, { data: ManufacturingCostResponse; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 20000;

export async function fetchManufacturingCost(
  params: FetchManufacturingCostParams
): Promise<ManufacturingCostResponse> {
  const { groupId, startDate, endDate, category, status, force } = params;

  const q = new URLSearchParams();
  if (startDate) q.set("startDate", startDate);
  if (endDate) q.set("endDate", endDate);
  if (category) q.set("category", category);
  if (status) q.set("status", status);
  if (force) q.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/cost-per-unit?${q.toString()}`;
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
      console.warn(`[fetchManufacturingCost] API returned status ${res.status}`);
      return FALLBACK_MANUFACTURING_COST_DATA;
    }

    const data: ManufacturingCostResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("[fetchManufacturingCost] Network error, using fallback:", error);
    return FALLBACK_MANUFACTURING_COST_DATA;
  }
}

