export type QualityDisposition =
  | "APPROVED"
  | "REJECTED"
  | "CONDITIONAL_RELEASE"
  | "UNDER_QUARANTINE";

export type DefectCategory =
  | "PACKAGING_SEAL"
  | "PHYSICAL_SENSORY"
  | "CHEMICAL_ACIDITY"
  | "MOISTURE_EXCURSION"
  | "LABEL_COMPLIANCE"
  | "FOREIGN_PARTICLE";

export interface BatchQualityInspection {
  id: number;
  jobOrderId: number;
  jobOrderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  lotNumber: string;
  coaReferenceNo: string;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  rejectRate: number; // ((rejected / inspected) * 100)
  uom: string;
  disposition: QualityDisposition;
  defectCategory: DefectCategory;
  defectDescription: string;
  inspectorName: string;
  inspectedAt: string;
  labParameters: {
    moisturePercentage?: number;
    acidityPh?: number;
    packagingSealPassed: boolean;
    labelCompliancePassed: boolean;
    microbiologicalStatus: "PASSED" | "PENDING" | "FAILED";
  };
}

export interface ProductQualitySummary {
  productId: number;
  productName: string;
  productCode: string;
  totalInspectedUnits: number;
  totalPassedUnits: number;
  totalRejectedUnits: number;
  rejectRate: number; // percentage
  passRate: number; // percentage (100 - rejectRate)
  primaryDefect: string;
  status: "EXCELLENT" | "ACCEPTABLE" | "HIGH_RISK" | "CRITICAL";
}

export interface DefectCategoryBreakdown {
  category: DefectCategory;
  label: string;
  incidentCount: number;
  rejectedUnits: number;
  percentageOfTotalRejects: number;
}

export interface QualityRejectRateKpis {
  overallPassRate: number; // percentage e.g. 98.4%
  overallRejectRate: number; // percentage e.g. 1.6%
  toleranceTarget: number; // max reject target e.g. 2.0%
  isWithinTolerance: boolean;
  totalInspectedUnits: number;
  totalRejectedUnits: number;
  totalBatchesInspected: number;
  batchesQuarantined: number;
  topRejectSku: string;
  topRejectSkuRate: number;
  primaryDefectReason: string;
}

export interface QualityRejectRateResponse {
  kpis: QualityRejectRateKpis;
  products: ProductQualitySummary[];
  inspections: BatchQualityInspection[];
  defectCategories: DefectCategoryBreakdown[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchQualityParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  disposition?: string;
  force?: boolean;
}

