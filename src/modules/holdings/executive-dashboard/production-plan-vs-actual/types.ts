export interface ProductionPlanVsActualJobOrder {
  jobOrderId: number;
  jobOrderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  uom: string;
  branchId: number | null;
  branchName: string;
  status: string;
  plannedQuantity: number;
  actualGoodQuantity: number;
  rejectedQuantity: number;
  quantityVariance: number;
  quantityVariancePercent: number;
  fulfillmentRate: number; // (actualGoodQuantity / plannedQuantity) * 100
  plannedCompletionDate: string | null;
  actualCompletionDate: string | null;
  completionVarianceDays: number | null;
}

export interface ProductPlanSummary {
  productId: number;
  productName: string;
  productCode: string;
  uom: string;
  jobOrdersCount: number;
  plannedQuantity: number;
  actualGoodQuantity: number;
  rejectedQuantity: number;
  quantityVariance: number;
  fulfillmentRate: number;
}

export interface ProductionPlanVsActualKpis {
  totalJobOrders: number;
  completedJobsCount: number;
  inProductionJobsCount: number;
  totalPlannedQuantity: number;
  totalActualGoodQuantity: number;
  totalRejectedQuantity: number;
  netQuantityVariance: number;
  overallFulfillmentRate: number; // percentage (0-100+)
  scrapRate: number; // percentage (0-100)
  onTimeCompletionRate: number; // percentage
  topProductByVolume: string;
  topProductFulfillmentRate: number;
}

export interface ProductionPlanVsActualResponse {
  kpis: ProductionPlanVsActualKpis;
  jobOrders: ProductionPlanVsActualJobOrder[];
  productSummaries: ProductPlanSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchProductionPlanParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  branchId?: string | number;
  force?: boolean;
}

