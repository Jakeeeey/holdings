export type InventoryStockStatus =
  | "OPTIMAL"
  | "LOW_STOCK"
  | "CRITICAL"
  | "OVERSTOCK";

export interface InventoryProductItem {
  id: string | number;
  productId: number;
  productCode: string;
  productName: string;
  productBrand: string;
  productCategory: string;
  unitName: string;
  unitCount?: number;
  branchId: number;
  branchName: string;
  runningInventory: number;
  unitCost: number;
  totalValuation: number;
  stockStatus: InventoryStockStatus;
  lastMovementDate?: string | null;
}

export interface InventoryCategorySummary {
  category: string;
  productCount: number;
  totalUnits: number;
  totalValuation: number;
  sharePercentage: number;
}

export interface WarehouseLocationSummary {
  branchId: number;
  branchName: string;
  productCount: number;
  totalUnits: number;
  totalValuation: number;
}

export interface InventoryKpis {
  totalValuation: number; // ₱ sum of all stock on hand
  totalStockUnits: number; // Total physical count of items
  inStockSkuCount: number; // Total active SKUs with positive stock
  lowStockCount: number; // Items below safety buffer
  criticalStockCount: number; // Stockouts or critical alert items
  stockHealthRate: number; // Percentage of inventory in optimal state (0 - 100%)
  topCategoryName: string;
  topCategoryValuation: number;
  averageUnitCost: number;
}

export interface InventoryFilters {
  category?: string;
  branchId?: number;
  status?: string;
  search?: string;
}

export interface InventoryResponse {
  kpis: InventoryKpis;
  items: InventoryProductItem[];
  categories: InventoryCategorySummary[];
  locations: WarehouseLocationSummary[];
  filters: InventoryFilters;
  source: "live_engine" | "fallback_mock";
  timestamp: string;
}

