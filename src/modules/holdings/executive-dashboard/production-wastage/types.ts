export type WastageSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type WastageCategory =
  | "MATERIAL_DEFECT"
  | "PROCESS_ABNORMALITY"
  | "EQUIPMENT_FAILURE"
  | "STARTUP_PURGE"
  | "HUMAN_ERROR"
  | "OTHER";

export interface ProductionWastageJobOrder {
  id: number;
  jobOrderId: number;
  jobOrderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  batchNo: string;
  workCenterName: string;
  wastageQty: number;
  goodYieldQty: number;
  totalInputQty: number;
  wastageRate: number; // percentage (e.g. 1.8%)
  uom: string;
  unitCost: number; // in PHP
  totalCostLoss: number; // wastageQty * unitCost
  reasonCode: string;
  reasonLabel: string;
  category: WastageCategory;
  isChargeableToVendor: boolean;
  vendorName?: string;
  remarks?: string;
  severity: WastageSeverity;
  createdAt: string;
}

export interface ProductWastageSummary {
  productId: number;
  productName: string;
  productCode: string;
  totalWastedQty: number;
  totalGoodQty: number;
  totalCostLoss: number;
  wastageRate: number;
  primaryReason: string;
  uom: string;
  severity: WastageSeverity;
}

export interface WastageReasonBreakdown {
  reasonCode: string;
  reasonLabel: string;
  category: WastageCategory;
  totalQuantity: number;
  totalLossAmount: number;
  incidentCount: number;
  percentageOfTotalLoss: number;
}

export interface WorkCenterWastageSummary {
  workCenterId: number | string;
  workCenterName: string;
  totalWastedQty: number;
  totalLossAmount: number;
  wastageRate: number;
  incidentCount: number;
}

export interface ProductionWastageKpis {
  totalWastageUnits: number;
  totalFinancialLoss: number;
  overallWastageRate: number;
  toleranceThreshold: number; // e.g. 2.0%
  withinTolerance: boolean;
  vendorChargeableLoss: number;
  internalScrapLoss: number;
  topWastageProduct: string;
  topWastageProductLoss: number;
  primaryScrapReason: string;
  primaryScrapReasonCount: number;
  totalIncidents: number;
}

export interface ProductionWastageResponse {
  kpis: ProductionWastageKpis;
  jobOrders: ProductionWastageJobOrder[];
  productSummaries: ProductWastageSummary[];
  reasonBreakdown: WastageReasonBreakdown[];
  workCenters: WorkCenterWastageSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchWastageParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  force?: boolean;
}

