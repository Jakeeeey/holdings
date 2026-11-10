export type AgingBracket =
  | "0-30"
  | "31-60"
  | "61-90"
  | "91-120"
  | "120+";

export type AgingStatus =
  | "FRESH"
  | "NORMAL"
  | "SLOW_MOVING"
  | "AT_RISK"
  | "SLOB";

export interface InventoryAgingItem {
  id: string;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  productCode?: string;
  productBrand?: string;
  productCategory?: string;
  supplierId?: number;
  supplierShortcut?: string;
  currentStock: number;
  costPerUnit: number;
  stockValue: number;
  lastOutboundDate: string | null;
  daysSinceLastOutbound: number;
  isSlob: number;
  slobDaysThreshold: number;
  bracket: AgingBracket;
  status: AgingStatus;
}

export interface AgingBracketSummary {
  bracket: AgingBracket;
  label: string;
  skuCount: number;
  totalUnits: number;
  totalValuation: number;
  sharePercentage: number;
  color: string;
}

export interface WarehouseAgingSummary {
  branchId: number;
  branchName: string;
  skuCount: number;
  totalUnits: number;
  totalValuation: number;
  slobValuation: number;
  slobUnits: number;
  slobRatio: number;
}

export interface InventoryAgingKpis {
  totalValuation: number; // ₱ Total value of all tracked inventory
  totalSlobValue: number; // ₱ Total value of stock flagged as SLOB or 120+ days
  slobRiskRatio: number; // % (totalSlobValue / totalValuation) * 100
  totalStockUnits: number; // Total physical count of aged & active items
  slobUnits: number; // Physical units classified as SLOB
  totalSkuCount: number; // Total unique SKUs
  criticalSlobSkuCount: number; // Unique SKUs with isSlob === 1
  atRiskSkuCount: number; // Unique SKUs in 61-90 or 91-120 days bracket
  topAgedProductName: string;
  topAgedProductValue: number;
  averageAgingDays: number;
}

export interface InventoryAgingFilters {
  bracket?: string | null;
  status?: string | null;
  branchId?: number | null;
  search?: string | null;
}

export interface InventoryAgingResponse {
  kpis: InventoryAgingKpis;
  brackets: AgingBracketSummary[];
  warehouses: WarehouseAgingSummary[];
  items: InventoryAgingItem[];
  filters: InventoryAgingFilters;
  source: "live_engine" | "fallback_mock";
  timestamp: string;
}

