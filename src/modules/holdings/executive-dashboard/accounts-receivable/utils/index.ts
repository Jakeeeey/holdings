// src/modules/holdings/executive-dashboard/accounts-receivable/utils/index.ts

import type { RawInvoiceRow, Invoice, ARMetricsSummary, AgingBucket, SalesmanARData, CustomerARData } from '../types';

export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPhpShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}k`;
  }
  return `₱${amount.toFixed(0)}`;
}

export function calculateDaysOverdue(dueDateStr?: string | null): number | null {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function transformRawInvoices(rows: RawInvoiceRow[]): Invoice[] {
  return rows.map((r, index) => {
    const id = String(r.invoiceId ?? r.invoice_id ?? r.id ?? index);
    const invoiceNo = String(r.invoiceNo ?? r.invoice_no ?? `INV-${id}`);
    const orderId = String(r.orderId ?? r.order_id ?? '—');
    const customer = String(r.customerName ?? r.customer_name ?? r.customer ?? 'Unknown Customer');
    const customerCode = String(r.customerCode ?? r.customer_code ?? '—');
    const invoiceDate = r.invoiceDate ?? r.invoice_date ?? '';
    const due = r.calculatedDueDate ?? r.due_date ?? '';

    const gross = Number(r.grossAmount ?? r.gross_amount ?? 0);
    const discount = Number(r.discountAmount ?? r.discount_amount ?? 0);
    const netReceivable = Number(r.netReceivable ?? Math.max(0, gross - discount));
    const paid = Number(r.totalPaid ?? r.paid_amount ?? 0);
    const outstanding = Number(r.outstandingBalance ?? Math.max(0, netReceivable - paid));

    const overdueDays = r.daysOverdue !== undefined && r.daysOverdue !== null
      ? Number(r.daysOverdue)
      : calculateDaysOverdue(due);

    let status: 'Paid' | 'Overdue' | 'Due' = 'Due';
    if (outstanding <= 0.01) {
      status = 'Paid';
    } else if (overdueDays !== null && overdueDays > 0) {
      status = 'Overdue';
    }

    return {
      id,
      invoiceNo,
      orderId,
      customer,
      customerCode,
      invoiceDate,
      due,
      netReceivable,
      totalPaid: paid,
      outstanding,
      overdue: overdueDays,
      branch: String(r.branch ?? r.branchName ?? '—'),
      salesman: String(r.salesman ?? r.salesman_name ?? 'Unassigned'),
      division: String(r.division ?? r.division_name ?? 'General'),
      status,
      grossAmount: gross,
      discountAmount: discount,
      isPosted: Boolean(r.isPosted),
      paymentStatus: String(r.paymentStatus ?? r.payment_status ?? status),
      transactionStatus: String(r.transactionStatus ?? r.transaction_status ?? 'Active'),
      cluster: String(r.cluster ?? 'General'),
    };
  });
}

export function deriveMetrics(invoices: Invoice[]): ARMetricsSummary {
  let totalReceivable = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  let overdueDaysSum = 0;
  const customers = new Set<string>();

  for (const inv of invoices) {
    totalReceivable += inv.netReceivable;
    totalPaid += inv.totalPaid;
    totalOutstanding += inv.outstanding;

    if (inv.customer) customers.add(inv.customer);

    if (inv.outstanding > 0 && inv.overdue !== null && inv.overdue > 0) {
      totalOverdue += inv.outstanding;
      overdueCount++;
      overdueDaysSum += inv.overdue;
    }
  }

  const collectionRate = totalReceivable > 0 ? (totalPaid / totalReceivable) * 100 : 0;
  const avgOverdueDays = overdueCount > 0 ? Math.round(overdueDaysSum / overdueCount) : 0;

  return {
    totalReceivable,
    totalPaid,
    totalOutstanding,
    collectionRate,
    totalOverdue,
    overdueCount,
    totalInvoices: invoices.length,
    activeCustomers: customers.size,
    avgOverdueDays,
  };
}

export function buildAgingBuckets(invoices: Invoice[]): AgingBucket[] {
  const buckets: Record<string, { amount: number; count: number }> = {
    '0-30 Days':  { amount: 0, count: 0 },
    '31-60 Days': { amount: 0, count: 0 },
    '61-90 Days': { amount: 0, count: 0 },
    '90+ Days':   { amount: 0, count: 0 },
  };

  let totalOutstanding = 0;

  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    totalOutstanding += inv.outstanding;

    const days = inv.overdue ?? -1;
    if (days <= 30) {
      buckets['0-30 Days'].amount += inv.outstanding;
      buckets['0-30 Days'].count++;
    } else if (days <= 60) {
      buckets['31-60 Days'].amount += inv.outstanding;
      buckets['31-60 Days'].count++;
    } else if (days <= 90) {
      buckets['61-90 Days'].amount += inv.outstanding;
      buckets['61-90 Days'].count++;
    } else {
      buckets['90+ Days'].amount += inv.outstanding;
      buckets['90+ Days'].count++;
    }
  }

  return Object.entries(buckets).map(([range, val]) => ({
    range,
    amount: val.amount,
    count: val.count,
    percentage: totalOutstanding > 0 ? (val.amount / totalOutstanding) * 100 : 0,
  }));
}

export function buildSalesmanData(invoices: Invoice[]): SalesmanARData[] {
  const map = new Map<string, { value: number; count: number }>();

  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    const key = inv.salesman || 'Unassigned';
    const entry = map.get(key) ?? { value: 0, count: 0 };
    entry.value += inv.outstanding;
    entry.count += 1;
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .map(([name, stat]) => ({
      name,
      value: stat.value,
      invoiceCount: stat.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function buildCustomerData(invoices: Invoice[]): CustomerARData[] {
  const map = new Map<string, { name: string; code: string; outstanding: number; invoiceCount: number; overdueCount: number }>();

  for (const inv of invoices) {
    const key = inv.customerCode || inv.customer;
    const entry = map.get(key) ?? {
      name: inv.customer,
      code: inv.customerCode,
      outstanding: 0,
      invoiceCount: 0,
      overdueCount: 0,
    };

    entry.outstanding += inv.outstanding;
    entry.invoiceCount += 1;
    if (inv.outstanding > 0 && inv.overdue !== null && inv.overdue > 0) {
      entry.overdueCount += 1;
    }
    map.set(key, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => b.outstanding - a.outstanding);
}

export function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | 'ellipsis')[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  let l: number | undefined;
  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('ellipsis');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}
