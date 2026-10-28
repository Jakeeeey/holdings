export type APCategory = "Trade" | "Non-Trade";

export interface RawAPRow {
  disbursementId?: number;
  docNo?: string;
  supplierName?: string;
  transactionTypeName?: string | null;
  apCategory?: APCategory;
  transactionDate?: string;
  dueDate?: string;
  referenceNo?: string | null;
  divisionName?: string | null;
  totalPayable?: number;
  totalPaid?: number;
  outstandingBalance?: number;
}

export type APStatus =
  | 'Paid'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Overdue'
  | 'Unpaid | Overdue'
  | 'Partially Paid | Overdue';

export interface APRecord {
  id: string;
  refNo: string;
  supplier: string;
  invoiceNo: string;
  division: string;
  invoiceDate: string;
  dueDate: string;
  amountPayable: number;
  amountPaid: number;
  outstandingBalance: number;
  aging: number | null; // null = no due date, negative = future, 0 = today, positive = past due
  status: APStatus;
  apCategory: APCategory;
  transactionTypeName?: string | null;
}

export interface AgingBucket {
  range: string;
  amount: number;
}

export interface SupplierEntry {
  name: string;
  value: number;
  color: string;
}

export interface StatusEntry {
  name: string;
  value: number;
  color: string;
}

export interface APMetrics {
  totalPayable: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  totalRecords: number;
}

export interface APCategoryBreakdown {
  category: APCategory;
  totalRecords: number;
  totalPayable: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  paidPct: number;
}
