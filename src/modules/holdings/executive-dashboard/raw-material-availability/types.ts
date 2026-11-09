export type MaterialCategory = "RAW_MATERIAL" | "PACKAGING" | "CHEMICAL" | "OTHER";

export type MaterialStockStatus = "SUFFICIENT" | "LOW_STOCK" | "CRITICAL_SHORTAGE";

export interface RawMaterialItem {
  materialId: number;
  materialName: string;
  materialCode: string;
  category: MaterialCategory;
  uom: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // onHand - reserved
  minimumSafetyStock: number;
  reorderPoint: number;
  daysOfSupply: number;
  coveragePercentage: number; // (availableQuantity / minimumSafetyStock) * 100
  status: MaterialStockStatus;
  primarySupplier?: string;
  leadTimeDays?: number;
}

export interface MaterialCategorySummary {
  category: MaterialCategory;
  categoryLabel: string;
  totalItems: number;
  sufficientItems: number;
  shortageItems: number;
  lowStockItems: number;
  averageCoveragePercentage: number;
}

export interface RawMaterialAvailabilityKpis {
  readinessIndex: number; // percentage (0-100) of materials sufficient
  totalMonitoredItems: number;
  sufficientCount: number;
  lowStockCount: number;
  criticalShortageCount: number;
  averageDaysOfSupply: number;
  topBottleneckItem: string;
  topBottleneckCoverage: number;
  topBottleneckUom: string;
}

export interface RawMaterialAvailabilityResponse {
  kpis: RawMaterialAvailabilityKpis;
  materials: RawMaterialItem[];
  categories: MaterialCategorySummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchRawMaterialParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  force?: boolean;
}

