import type {
  ProductionEfficiencyResponse,
  FetchProductionEfficiencyParams,
} from "../types";

export const FALLBACK_PRODUCTION_EFFICIENCY_DATA: ProductionEfficiencyResponse = {
  kpis: {
    overallEfficiencyPercent: 98.4,
    totalStandardHours: 1420.5,
    totalActualHours: 1443.0,
    netVarianceHours: -22.5,
    averageThroughput: 24.8,
    activeWorkCentersCount: 5,
    topPerformingWorkCenter: "Batch Coding & Date Printing Station",
    topPerformingEfficiency: 104.2,
    evaluatedJobOrdersCount: 16,
  },
  jobOrders: [
    {
      jobOrderId: 101,
      jobOrderNo: "JO-2026-0891",
      productId: 25756,
      productName: "Palm Olein iv60",
      productCode: "OI-PLM-IV60",
      workCenterName: "Bottle Closure & Sealing Station",
      uom: "PCS",
      goodOutputQuantity: 7780,
      standardHours: 320.0,
      actualHours: 312.5,
      varianceHours: 7.5,
      efficiencyPercent: 102.4,
      productivity: 24.9,
      status: "COMPLETED",
    },
    {
      jobOrderId: 102,
      jobOrderNo: "JO-2026-0892",
      productId: 25752,
      productName: "Soya Bean Oil",
      productCode: "OI-SOY",
      workCenterName: "Batch Coding & Date Printing Station",
      uom: "PCS",
      goodOutputQuantity: 6350,
      standardHours: 260.0,
      actualHours: 248.0,
      varianceHours: 12.0,
      efficiencyPercent: 104.8,
      productivity: 25.6,
      status: "COMPLETED",
    },
    {
      jobOrderId: 103,
      jobOrderNo: "JO-2026-0893",
      productId: 25753,
      productName: "Coconut Oil",
      productCode: "OI-CCT",
      workCenterName: "Thermal Processing & Dehydration Line",
      uom: "L",
      goodOutputQuantity: 4620,
      standardHours: 215.0,
      actualHours: 228.0,
      varianceHours: -13.0,
      efficiencyPercent: 94.3,
      productivity: 20.3,
      status: "IN_PROGRESS",
    },
    {
      jobOrderId: 104,
      jobOrderNo: "JO-2026-0894",
      productId: 25755,
      productName: "Egg Yolk",
      productCode: "NO-YOLK",
      workCenterName: "Canton Dough Preparation & Batching Station",
      uom: "PCS",
      goodOutputQuantity: 4410,
      standardHours: 180.5,
      actualHours: 182.0,
      varianceHours: -1.5,
      efficiencyPercent: 99.2,
      productivity: 24.2,
      status: "COMPLETED",
    },
    {
      jobOrderId: 105,
      jobOrderNo: "JO-2026-0895",
      productId: 25757,
      productName: "Canton Dough Preparation",
      productCode: "CD-PREP",
      workCenterName: "Canton Dough Preparation & Batching Station",
      uom: "KG",
      goodOutputQuantity: 5640,
      standardHours: 245.0,
      actualHours: 258.5,
      varianceHours: -13.5,
      efficiencyPercent: 94.8,
      productivity: 21.8,
      status: "COMPLETED",
    },
    {
      jobOrderId: 106,
      jobOrderNo: "JO-2026-0896",
      productId: 25758,
      productName: "Thermal Dehydrated Mix",
      productCode: "TDM-01",
      workCenterName: "Thermal Power & Steam Plant Area",
      uom: "KG",
      goodOutputQuantity: 4120,
      standardHours: 200.0,
      actualHours: 214.0,
      varianceHours: -14.0,
      efficiencyPercent: 93.5,
      productivity: 19.3,
      status: "IN_PROGRESS",
    },
  ],
  workCenters: [
    {
      workCenterId: 316,
      workCenterName: "Batch Coding & Date Printing Station",
      jobCount: 4,
      standardHours: 350.0,
      actualHours: 336.0,
      varianceHours: 14.0,
      efficiencyPercent: 104.2,
      averageProductivity: 26.1,
    },
    {
      workCenterId: 318,
      workCenterName: "Bottle Closure & Sealing Station",
      jobCount: 3,
      standardHours: 320.0,
      actualHours: 312.5,
      varianceHours: 7.5,
      efficiencyPercent: 102.4,
      averageProductivity: 24.9,
    },
    {
      workCenterId: 320,
      workCenterName: "Canton Dough Preparation & Batching Station",
      jobCount: 4,
      standardHours: 425.5,
      actualHours: 440.5,
      varianceHours: -15.0,
      efficiencyPercent: 96.6,
      averageProductivity: 23.0,
    },
    {
      workCenterId: 317,
      workCenterName: "Thermal Processing & Dehydration Line",
      jobCount: 3,
      standardHours: 215.0,
      actualHours: 228.0,
      varianceHours: -13.0,
      efficiencyPercent: 94.3,
      averageProductivity: 20.3,
    },
    {
      workCenterId: 319,
      workCenterName: "Thermal Power & Steam Plant Area",
      jobCount: 2,
      standardHours: 200.0,
      actualHours: 214.0,
      varianceHours: -14.0,
      efficiencyPercent: 93.5,
      averageProductivity: 19.3,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchProductionEfficiency({
  groupId,
  startDate,
  endDate,
  workCenterId,
  force = false,
}: FetchProductionEfficiencyParams): Promise<ProductionEfficiencyResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (workCenterId && workCenterId !== "all") params.set("workCenterId", String(workCenterId));
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/efficiency?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchProductionEfficiency] Server responded with status ${res.status}`);
      return FALLBACK_PRODUCTION_EFFICIENCY_DATA;
    }

    const data: ProductionEfficiencyResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchProductionEfficiency] Error fetching data, using fallback:", err);
    return FALLBACK_PRODUCTION_EFFICIENCY_DATA;
  }
}

