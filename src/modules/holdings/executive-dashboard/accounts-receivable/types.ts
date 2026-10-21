// src/modules/holdings/executive-dashboard/accounts-receivable/types.ts

export interface RawInvoiceRow {
  invoiceId?: number;
  invoice_id?: number;
  invoiceNo?: string;
  invoice_no?: string;
  orderId?: string;
  order_id?: string;
  customerName?: string;
  customer_name?: string;
  customerCode?: string;
  customer_code?: string;
  invoiceDate?: string;
  invoice_date?: string;
  calculatedDueDate?: string;
  due_date?: string;
  netReceivable?: number;
  totalPaid?: number;
  paid_amount?: number;
  outstandingBalance?: number;
  daysOverdue?: number;
  branch?: string;
  salesman?: string;
  salesman_name?: string;
  division?: string;
  division_name?: string;
  isPosted?: boolean | number;
  grossAmount?: number;
  gross_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  paymentStatus?: string | null;
  payment_status?: string | null;
  transactionStatus?: string | null;
  transaction_status?: string | null;
  cluster?: string;
  arStatus?: 'Due' | 'Overdue' | '—';
  [key: string]: unknown;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  orderId: string;
  customer: string;
  customerCode: string;
  invoiceDate: string;
  due: string;
  netReceivable: number;
  totalPaid: number;
  outstanding: number;
  overdue: number | null;
  branch: string;
  salesman: string;
  division: string;
  status: 'Paid' | 'Overdue' | 'Due';
  grossAmount: number;
  discountAmount: number;
  isPosted: boolean;
  paymentStatus: string;
  transactionStatus: string;
  cluster: string;
}

export interface AgingBucket {
  range: string;
  amount: number;
  count?: number;
  percentage?: number;
}

export interface SalesmanARData {
  name: string;
  value: number;
  invoiceCount?: number;
}

export interface CustomerARData {
  name: string;
  code: string;
  outstanding: number;
  invoiceCount: number;
  overdueCount: number;
}

export interface ARMetricsSummary {
  totalReceivable: number;
  totalPaid: number;
  totalOutstanding: number;
  collectionRate: number;
  totalOverdue: number;
  overdueCount: number;
  totalInvoices: number;
  activeCustomers: number;
  avgOverdueDays: number;
}

export interface ARFilterOptions {
  customers: string[];
  salesmen: string[];
  divisions: string[];
  statuses: string[];
}

export interface ARTableFilters {
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  salesman?: string;
  division?: string;
  status?: string;
  search?: string;
}

export interface ARFullPayload {
  rows: Invoice[];
  agingData: AgingBucket[];
  salesmanData: SalesmanARData[];
  customerData: CustomerARData[];
  metrics: ARMetricsSummary;
  filterOptions: ARFilterOptions;
}
