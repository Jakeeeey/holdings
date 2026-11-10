export type PurchaseInventoryStatus =
  | "REQUESTED"
  | "APPROVED"
  | "FOR_RECEIVING"
  | "FOR_DELIVERY"
  | "FOR_PICKUP"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "REJECTED"
  | "CANCELLED"
  | "UNKNOWN";

export type PurchasePaymentStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_PAYMENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "ON_HOLD"
  | "CANCELLED"
  | "UNKNOWN";

export interface PurchaseOrderRecord {
  id: number;
  poNo: string;
  date: string;
  dateEncoded?: string;
  dateReceived?: string | null;
  supplierId: number;
  supplierName: string;
  supplierType?: string;
  grossAmount: number;
  totalAmount: number;
  receivedAmount: number; // Total amount actually received
  discountAmount: number;
  vatAmount: number;
  inventoryStatusId: number;
  inventoryStatusText: string;
  inventoryStatusKey: PurchaseInventoryStatus;
  paymentStatusId: number;
  paymentStatusText: string;
  paymentStatusKey: PurchasePaymentStatus;
  branchId?: number | null;
  branchName?: string;
  isPosted: boolean;
  itemCount?: number;
}

export interface SupplierSpendSummary {
  supplierId: number;
  supplierName: string;
  supplierType?: string;
  orderCount: number;
  totalSpend: number;
  receivedSpend: number; // Total amount received for this supplier
  receivedCount: number;
  pendingCount: number;
  fulfillmentRate: number; // 0 - 100%
  averageOrderValue: number;
}

export interface MonthlySpendTrend {
  month: string; // e.g. "Jun 2026"
  spend: number;
  orderCount: number;
  receivedSpend: number;
}

export interface PurchaseOrderKpis {
  totalSpend: number; // Total ordered PO amount
  totalAmountReceived: number; // Total amount delivered & received into warehouse
  pendingAmount: number; // In-transit / pending delivery balance
  totalOrders: number;
  fulfillmentRate: number; // 0 - 100%
  receivedOrders: number;
  partiallyReceivedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  activeSuppliersCount: number;
  topSupplierName: string;
  topSupplierSpend: number;
  averageOrderValue: number;
}

export interface PurchaseOrderFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: number;
  status?: string;
  search?: string;
}

export interface PurchaseOrderResponse {
  kpis: PurchaseOrderKpis;
  orders: PurchaseOrderRecord[];
  topSuppliers: SupplierSpendSummary[];
  monthlyTrends: MonthlySpendTrend[];
  filters: PurchaseOrderFilters;
  source: "directus_live" | "fallback_mock";
  timestamp: string;
}
