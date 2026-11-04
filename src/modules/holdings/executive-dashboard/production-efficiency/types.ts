export interface JobOrderEfficiencyItem {
  jobOrderId: number;
  jobOrderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  workCenterName: string;
  uom: string;
  goodOutputQuantity: number;
  standardHours: number;
  actualHours: number;
  varianceHours: number;
  efficiencyPercent: number; // (standardHours / actualHours) * 100
  productivity: number; // goodOutputQuantity / actualHours
  status: string;
}

export interface WorkCenterEfficiencySummary {
  workCenterId: number;
  workCenterName: string;
  jobCount: number;
  standardHours: number;
  actualHours: number;
  varianceHours: number;
  efficiencyPercent: number;
  averageProductivity: number;
}

export interface ProductionEfficiencyKpis {
  overallEfficiencyPercent: number; // percentage (0-100+)
  totalStandardHours: number;
  totalActualHours: number;
  netVarianceHours: number; // positive = faster than standard, negative = slower
  averageThroughput: number; // units/hr
  activeWorkCentersCount: number;
  topPerformingWorkCenter: string;
  topPerformingEfficiency: number;
  evaluatedJobOrdersCount: number;
}

export interface ProductionEfficiencyResponse {
  kpis: ProductionEfficiencyKpis;
  jobOrders: JobOrderEfficiencyItem[];
  workCenters: WorkCenterEfficiencySummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchProductionEfficiencyParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  workCenterId?: string | number;
  force?: boolean;
}

