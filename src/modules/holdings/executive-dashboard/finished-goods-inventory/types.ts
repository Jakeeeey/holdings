export type FinishedGoodsStockStatus =
  | "OPTIMAL"
  | "LOW_STOCK"
  | "OVERSTOCKED"
  | "OUT_OF_STOCK";

export type FinishedGoodsCategory =
  | "COOKING_OILS"
  | "NOODLES_AND_BIHON"
  | "SPECIALTY_FATS"
  | "COCONUT_PRODUCTS"
  | "OTHER";

export interface FinishedGoodsItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  category: FinishedGoodsCategory;
  categoryLabel: string;
  uom: string;
  unitValue: number; // in PHP
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // onHand - reserved
  reorderPoint: number;
  safetyStock: number;
  daysOfSupply: number;
  totalValuation: number; // onHand * unitValue in PHP
  warehouseLocation: string;
  status: FinishedGoodsStockStatus;
  batchCount: number;
  oldestBatchDate?: string;
}

export interface FinishedGoodsCategorySummary {
  category: FinishedGoodsCategory;
  categoryLabel: string;
  totalSkus: number;
  totalOnHandUnits: number;
  totalAvailableUnits: number;
  totalValuation: number; // in PHP
  averageDaysOfSupply: number;
  optimalCount: number;
  lowStockCount: number;
}

export interface FinishedGoodsInventoryKpis {
  totalInventoryValuation: number; // in PHP
  totalOnHandUnits: number;
  totalReservedUnits: number;
  totalAvailableUnits: number;
  fulfillmentReadinessRate: number; // % (available / onHand * 100 or optimal skus %)
  averageDaysOfSupply: number;
  totalMonitoredSkus: number;
  optimalStockSkus: number;
  lowStockSkus: number;
  overstockedSkus: number;
  outOfStockSkus: number;
  topValuationProduct: string;
  topValuationAmount: number;
}

export interface FinishedGoodsInventoryResponse {
  kpis: FinishedGoodsInventoryKpis;
  items: FinishedGoodsItem[];
  categories: FinishedGoodsCategorySummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchFinishedGoodsParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  force?: boolean;
}

