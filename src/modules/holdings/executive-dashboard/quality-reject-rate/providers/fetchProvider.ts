import type {
  QualityRejectRateResponse,
  FetchQualityParams,
} from "../types";

export const FALLBACK_QUALITY_REJECT_DATA: QualityRejectRateResponse = {
  kpis: {
    overallPassRate: 98.42,
    overallRejectRate: 1.58,
    toleranceTarget: 2.0,
    isWithinTolerance: true,
    totalInspectedUnits: 62800,
    totalRejectedUnits: 995,
    totalBatchesInspected: 10,
    batchesQuarantined: 1,
    topRejectSku: "Mama Pina's Bihon 454g x 20",
    topRejectSkuRate: 2.14,
    primaryDefectReason: "Pouch Heat Seal Micro-Punctures",
  },
  products: [
    {
      productId: 25798,
      productName: "Mama Pina's Bihon 454g x 20",
      productCode: "MP-BHN-454G-CSE",
      totalInspectedUnits: 8400,
      totalPassedUnits: 8220,
      totalRejectedUnits: 180,
      rejectRate: 2.14,
      passRate: 97.86,
      primaryDefect: "Moisture Content & Edge Strand Brittleness",
      status: "ACCEPTABLE",
    },
    {
      productId: 25812,
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productCode: "BASP-OL-1L-BOX",
      totalInspectedUnits: 12400,
      totalPassedUnits: 12245,
      totalRejectedUnits: 155,
      rejectRate: 1.25,
      passRate: 98.75,
      primaryDefect: "Bottle Cap Torque & Induction Seal Leak",
      status: "EXCELLENT",
    },
    {
      productId: 25752,
      productName: "Soya Bean Oil 20L Jerrycan",
      productCode: "OI-SOY-20L",
      totalInspectedUnits: 9250,
      totalPassedUnits: 9090,
      totalRejectedUnits: 160,
      rejectRate: 1.73,
      passRate: 98.27,
      primaryDefect: "Color Lovibond Red Unit Variation",
      status: "ACCEPTABLE",
    },
    {
      productId: 25805,
      productName: "Mama Pina's Canolein Oil 1L x 12",
      productCode: "MPCO-OL-CNL-1L-BOX",
      totalInspectedUnits: 6500,
      totalPassedUnits: 6415,
      totalRejectedUnits: 85,
      rejectRate: 1.31,
      passRate: 98.69,
      primaryDefect: "Label Alignment Off-Center (> 3mm)",
      status: "EXCELLENT",
    },
    {
      productId: 25809,
      productName: "Mama Pina's Coconut Milk 400ml x 24",
      productCode: "MPCM-400ML-BOX",
      totalInspectedUnits: 5200,
      totalPassedUnits: 5125,
      totalRejectedUnits: 75,
      rejectRate: 1.44,
      passRate: 98.56,
      primaryDefect: "Can Seam Visual Inspection & Net Fill",
      status: "EXCELLENT",
    },
    {
      productId: 25758,
      productName: "Refined Margarine Blend Gold 15kg",
      productCode: "FA-MARG-GLD",
      totalInspectedUnits: 5200,
      totalPassedUnits: 5095,
      totalRejectedUnits: 105,
      rejectRate: 2.02,
      passRate: 97.98,
      primaryDefect: "Emulsion Texture Plasticity Softness",
      status: "ACCEPTABLE",
    },
    {
      productId: 25760,
      productName: "Crispy Canton Noodles 250g x 30",
      productCode: "FD-CAN-250G",
      totalInspectedUnits: 8400,
      totalPassedUnits: 8275,
      totalRejectedUnits: 125,
      rejectRate: 1.49,
      passRate: 98.51,
      primaryDefect: "Over-Fry Color Gradient & Broken Bundles",
      status: "EXCELLENT",
    },
    {
      productId: 25762,
      productName: "Baking Shortening Premium 20kg",
      productCode: "FA-SHRT-PRM",
      totalInspectedUnits: 4800,
      totalPassedUnits: 4720,
      totalRejectedUnits: 80,
      rejectRate: 1.67,
      passRate: 98.33,
      primaryDefect: "Air Entrainment & Top Surface Unevenness",
      status: "EXCELLENT",
    },
    {
      productId: 25803,
      productName: "Mama Pina's Canola 4L x 4",
      productCode: "MPCO-OL-CNL-4L-BOX",
      totalInspectedUnits: 2650,
      totalPassedUnits: 2620,
      totalRejectedUnits: 30,
      rejectRate: 1.13,
      passRate: 98.87,
      primaryDefect: "Handle Integrity & Scratch Marks",
      status: "EXCELLENT",
    },
  ],
  inspections: [
    {
      id: 201,
      jobOrderId: 101,
      jobOrderNo: "JO-2026-0891",
      productId: 25812,
      productName: "Mama Pina's Palm Oil 1L x 12 BAS",
      productCode: "BASP-OL-1L-BOX",
      lotNumber: "LOT-PO-2603A",
      coaReferenceNo: "COA-2026-1102-01",
      inspectedQuantity: 12400,
      passedQuantity: 12245,
      rejectedQuantity: 155,
      rejectRate: 1.25,
      uom: "BOX",
      disposition: "APPROVED",
      defectCategory: "PACKAGING_SEAL",
      defectDescription: "Induction cap seal foil weak bonding on outer flange during startup",
      inspectorName: "QA Specialist Maria Santos",
      inspectedAt: "2026-11-04T14:30:00Z",
      labParameters: {
        moisturePercentage: 0.04,
        acidityPh: 6.8,
        packagingSealPassed: true,
        labelCompliancePassed: true,
        microbiologicalStatus: "PASSED",
      },
    },
    {
      id: 202,
      jobOrderId: 102,
      jobOrderNo: "JO-2026-0892",
      productId: 25798,
      productName: "Mama Pina's Bihon 454g x 20",
      productCode: "MP-BHN-454G-CSE",
      lotNumber: "LOT-BH-2604B",
      coaReferenceNo: "COA-2026-1103-04",
      inspectedQuantity: 8400,
      passedQuantity: 8220,
      rejectedQuantity: 180,
      rejectRate: 2.14,
      uom: "CASE",
      disposition: "CONDITIONAL_RELEASE",
      defectCategory: "MOISTURE_EXCURSION",
      defectDescription: "Moisture content reading 12.8% (specification limit max 12.5%) in cooling bay",
      inspectorName: "QA Analyst Kevin Bautista",
      inspectedAt: "2026-11-04T16:45:00Z",
      labParameters: {
        moisturePercentage: 12.8,
        acidityPh: 6.2,
        packagingSealPassed: true,
        labelCompliancePassed: true,
        microbiologicalStatus: "PASSED",
      },
    },
    {
      id: 203,
      jobOrderId: 103,
      jobOrderNo: "JO-2026-0893",
      productId: 25752,
      productName: "Soya Bean Oil 20L Jerrycan",
      productCode: "OI-SOY-20L",
      lotNumber: "LOT-SO-2604A",
      coaReferenceNo: "COA-2026-1102-08",
      inspectedQuantity: 9250,
      passedQuantity: 9090,
      rejectedQuantity: 160,
      rejectRate: 1.73,
      uom: "CAN",
      disposition: "APPROVED",
      defectCategory: "PHYSICAL_SENSORY",
      defectDescription: "Lovibond Red tint reached 2.8R vs target max 2.5R before heat vacuum strip",
      inspectorName: "Lab Chemist Arlene Dizon",
      inspectedAt: "2026-11-03T11:20:00Z",
      labParameters: {
        moisturePercentage: 0.05,
        acidityPh: 6.9,
        packagingSealPassed: true,
        labelCompliancePassed: true,
        microbiologicalStatus: "PASSED",
      },
    },
    {
      id: 204,
      jobOrderId: 104,
      jobOrderNo: "JO-2026-0894",
      productId: 25758,
      productName: "Refined Margarine Blend Gold 15kg",
      productCode: "FA-MARG-GLD",
      lotNumber: "LOT-MB-2607",
      coaReferenceNo: "COA-2026-1104-02",
      inspectedQuantity: 5200,
      passedQuantity: 5095,
      rejectedQuantity: 105,
      rejectRate: 2.02,
      uom: "CARTON",
      disposition: "UNDER_QUARANTINE",
      defectCategory: "CHEMICAL_ACIDITY",
      defectDescription: "Peroxide value verification awaiting 48-hr incubator culture verification",
      inspectorName: "Microbiologist Dennis Reyes",
      inspectedAt: "2026-11-05T08:15:00Z",
      labParameters: {
        moisturePercentage: 15.6,
        acidityPh: 5.4,
        packagingSealPassed: true,
        labelCompliancePassed: true,
        microbiologicalStatus: "PENDING",
      },
    },
    {
      id: 205,
      jobOrderId: 105,
      jobOrderNo: "JO-2026-0895",
      productId: 25760,
      productName: "Crispy Canton Noodles 250g x 30",
      productCode: "FD-CAN-250G",
      lotNumber: "LOT-CN-2605",
      coaReferenceNo: "COA-2026-1104-09",
      inspectedQuantity: 8400,
      passedQuantity: 8275,
      rejectedQuantity: 125,
      rejectRate: 1.49,
      uom: "CASE",
      disposition: "APPROVED",
      defectCategory: "LABEL_COMPLIANCE",
      defectDescription: "Batch coding ink smudge on secondary corrugated shipper flap",
      inspectorName: "QA Specialist Maria Santos",
      inspectedAt: "2026-11-04T18:00:00Z",
      labParameters: {
        moisturePercentage: 9.8,
        acidityPh: 6.4,
        packagingSealPassed: true,
        labelCompliancePassed: false,
        microbiologicalStatus: "PASSED",
      },
    },
  ],
  defectCategories: [
    {
      category: "PACKAGING_SEAL",
      label: "Packaging & Seal Defects",
      incidentCount: 4,
      rejectedUnits: 345,
      percentageOfTotalRejects: 34.7,
    },
    {
      category: "PHYSICAL_SENSORY",
      label: "Sensory & Color Deviations",
      incidentCount: 3,
      rejectedUnits: 240,
      percentageOfTotalRejects: 24.1,
    },
    {
      category: "MOISTURE_EXCURSION",
      label: "Moisture Content Out of Spec",
      incidentCount: 2,
      rejectedUnits: 180,
      percentageOfTotalRejects: 18.1,
    },
    {
      category: "CHEMICAL_ACIDITY",
      label: "Chemical / Acidity Parameters",
      incidentCount: 2,
      rejectedUnits: 125,
      percentageOfTotalRejects: 12.6,
    },
    {
      category: "LABEL_COMPLIANCE",
      label: "Label & Coding Compliance",
      incidentCount: 2,
      rejectedUnits: 105,
      percentageOfTotalRejects: 10.5,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-07",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

const clientCache = new Map<string, { data: QualityRejectRateResponse; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 20000;

export async function fetchQualityRejectRate(
  params: FetchQualityParams
): Promise<QualityRejectRateResponse> {
  const { groupId, startDate, endDate, category, disposition, force } = params;

  const q = new URLSearchParams();
  if (startDate) q.set("startDate", startDate);
  if (endDate) q.set("endDate", endDate);
  if (category) q.set("category", category);
  if (disposition) q.set("disposition", disposition);
  if (force) q.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/quality?${q.toString()}`;
  const cacheKey = `${groupId}_${startDate || ""}_${endDate || ""}_${category || ""}_${disposition || ""}`;

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
      console.warn(`[fetchQualityRejectRate] API returned status ${res.status}`);
      return FALLBACK_QUALITY_REJECT_DATA;
    }

    const data: QualityRejectRateResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("[fetchQualityRejectRate] Network error, using fallback:", error);
    return FALLBACK_QUALITY_REJECT_DATA;
  }
}

