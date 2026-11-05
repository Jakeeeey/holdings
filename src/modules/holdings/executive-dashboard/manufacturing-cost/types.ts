export type CostVarianceStatus =
  | "FAVORABLE"
  | "ON_TARGET"
  | "ELEVATED"
  | "UNFAVORABLE";

export type CostCategory =
  | "DIRECT_MATERIALS"
  | "PACKAGING"
  | "DIRECT_LABOR"
  | "MANUFACTURING_OVERHEAD";

export interface ProductCostItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  uom: string;
  standardCostPerUnit: number; // in PHP
  actualCostPerUnit: number; // in PHP
  costVarianceAmount: number; // actual - standard (PHP)
  costVariancePercentage: number; // ((actual - standard) / standard) * 100
  rawMaterialCost: number; // in PHP
  packagingCost: number; // in PHP
  directLaborCost: number; // in PHP
  overheadCost: number; // in PHP
  sellingPrice: number; // in PHP
  grossMarginPercentage: number; // ((sellingPrice - actualCost) / sellingPrice) * 100
  totalBatchProducedUnits: number;
  status: CostVarianceStatus;
  trend: "DECREASING" | "STABLE" | "INCREASING";
  lastCalculatedDate: string;
}

export interface CostComponentBreakdown {
  component: CostCategory;
  label: string;
  totalCostShare: number; // in PHP
  percentage: number; // % of total unit cost
  averagePerUnit: number; // in PHP
}

export interface CategoryCostSummary {
  category: string;
  productCount: number;
  averageUnitCost: number;
  averageStandardCost: number;
  averageMargin: number;
  variancePercentage: number;
}

export interface ManufacturingCostKpis {
  averageCostPerUnit: number; // weighted average PHP
  budgetStandardUnitCost: number; // weighted average PHP
  overallCostVariance: number; // percentage
  isVarianceFavorable: boolean;
  averageGrossMargin: number; // percentage
  materialCostSharePercentage: number; // % of cost that is raw material + packaging
  topCostEfficiencySku: string;
  topCostEfficiencyMargin: number;
  highestVarianceSku: string;
  highestVarianceAmount: number;
  evaluatedSkusCount: number;
}

export interface ManufacturingCostResponse {
  kpis: ManufacturingCostKpis;
  products: ProductCostItem[];
  components: CostComponentBreakdown[];
  categories: CategoryCostSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchManufacturingCostParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  force?: boolean;
}

