export type MarginHealth = "HIGH" | "HEALTHY" | "LOW" | "NEGATIVE";

export interface ProductMarginItem {
  productId: number;
  productName: string;
  productCode?: string;
  productBrand?: string;
  productCategory?: string;
  unitsSold: number;
  averageUnitPrice: number;
  averageUnitCost: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  marginHealth: MarginHealth;
}

export interface CategoryMarginSummary {
  category: string;
  productCount: number;
  unitsSold: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  revenueSharePercentage: number;
}

export interface WarehouseMarginSummary {
  branchId: number;
  branchName: string;
  invoicesCount: number;
  unitsSold: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
}

export interface TrendMarginPoint {
  date: string;
  periodLabel: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface GrossMarginKpis {
  totalRevenue: number; // ₱ Total Sales Invoiced
  totalCogs: number; // ₱ Total Cost of Goods Sold
  grossProfit: number; // ₱ Revenue - COGS
  grossMarginPercentage: number; // % (Gross Profit / Revenue) * 100
  totalUnitsSold: number; // Physical count of goods dispatched
  totalInvoicesCount: number; // Number of sales invoices in period
  averageOrderProfit: number; // Gross profit per sales invoice
  topMarginCategory: string;
  topMarginCategoryRate: number;
}

export interface GrossMarginFilters {
  startDate?: string | null;
  endDate?: string | null;
  category?: string | null;
  branchId?: number | null;
  status?: string | null;
  search?: string | null;
}

export interface GrossMarginResponse {
  kpis: GrossMarginKpis;
  products: ProductMarginItem[];
  categories: CategoryMarginSummary[];
  warehouses: WarehouseMarginSummary[];
  trends: TrendMarginPoint[];
  filters: GrossMarginFilters;
  source: "live_engine" | "fallback_mock";
  timestamp: string;
}

