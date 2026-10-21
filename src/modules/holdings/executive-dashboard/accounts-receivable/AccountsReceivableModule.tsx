// src/modules/holdings/executive-dashboard/accounts-receivable/AccountsReceivableModule.tsx

"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAccountsReceivable } from './hooks/useAccountsReceivable';
import { ARMetricCards } from './components/ARMetricCards';
import { ARFilterBar } from './components/ARFilterBar';
import { ARInvoiceTable } from './components/ARInvoiceTable';
import {
  deriveMetrics,
  buildAgingBuckets,
  buildSalesmanData,
} from './utils';

const ChartSkeleton = () => <Skeleton className="h-[280px] w-full rounded-xl" />;

const ARAgingChart = dynamic(
  () => import('./components/ARAgingChart').then((m) => m.ARAgingChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ARSalesmanChart = dynamic(
  () => import('./components/ARSalesmanChart').then((m) => m.ARSalesmanChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

interface AccountsReceivableModuleProps {
  groupId?: string | number;
}

export function AccountsReceivableModule({ groupId }: AccountsReceivableModuleProps) {
  const { loading, error, records } = useAccountsReceivable(groupId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [arStatus, setArStatus] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [salesman, setSalesman] = useState('');

  const salesmanOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.salesman).filter(Boolean))).sort(),
    [records]
  );

  const transactionStatusOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.transactionStatus).filter(Boolean))).sort(),
    [records]
  );

  const isFiltered = !!(search || dateFrom || dateTo || status || salesman || arStatus || transactionStatus);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matchesQ =
          r.invoiceNo.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.customerCode.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (dateFrom && r.invoiceDate && r.invoiceDate < dateFrom) return false;
      if (dateTo && r.invoiceDate && r.invoiceDate > dateTo) return false;
      if (status && r.status !== status) return false;
      if (arStatus && r.status !== arStatus) return false;
      if (transactionStatus && r.transactionStatus !== transactionStatus) return false;
      if (salesman && r.salesman !== salesman) return false;
      return true;
    });
  }, [records, search, dateFrom, dateTo, status, arStatus, transactionStatus, salesman]);

  const metrics = useMemo(() => deriveMetrics(filteredRecords), [filteredRecords]);
  const agingData = useMemo(() => buildAgingBuckets(filteredRecords), [filteredRecords]);
  const salesmanData = useMemo(() => buildSalesmanData(filteredRecords), [filteredRecords]);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setArStatus('');
    setTransactionStatus('');
    setSalesman('');
    setPage(1);
  };

  const exportToPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const total = metrics.totalReceivable;
    const formattedTotal = `PHP ${total.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Accounts Receivable Report', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalLabel = `Grand Total: ${formattedTotal}`;
    const totalLabelX = Math.max(pageW / 2, pageW - 14 - doc.getTextWidth(totalLabel));
    doc.text(totalLabel, totalLabelX, 16);

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(14, 20, pageW - 14, 20);

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Exported: ${new Date().toLocaleString('en-PH')}   Total Records: ${filteredRecords.length}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 32,
      headStyles: { fillColor: [24, 24, 27], fontSize: 7, textColor: 255 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [[
        'Invoice No.', 'Customer', 'Salesman', 'Invoice Date', 'Due Date',
        'Net Receivable (PHP)', 'Paid (PHP)', 'Outstanding (PHP)', 'Overdue (Days)', 'Status'
      ]],
      body: filteredRecords.slice(0, 1000).map((r) => [
        r.invoiceNo,
        r.customer,
        r.salesman,
        r.invoiceDate ? r.invoiceDate.split(' ')[0] : '—',
        r.due ? r.due.split(' ')[0] : '—',
        r.netReceivable.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        r.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        r.outstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        r.overdue !== null && r.overdue > 0 ? `${r.overdue}` : '—',
        r.status,
      ]),
      margin: { left: 14, right: 14 },
    });

    doc.save(`ar-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center m-8 border border-red-500/20 bg-red-500/5 rounded-xl">
        <p className="text-red-500 font-medium">Error: {error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background text-foreground min-h-screen space-y-5 w-full box-border overflow-hidden">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-emerald-500/5 px-5 sm:px-7 py-5 sm:py-6">
        <div
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/20 to-sky-500/20 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Financial Monitoring
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Accounts Receivable
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Customer aging, overdue receivables, collection efficiency, and sales representative exposure.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="h-9 px-3 text-xs gap-1.5 self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ARMetricCards metrics={metrics} />

      {/* Visual Charts: Aging & Salesman */}
      <div className="grid gap-4 md:grid-cols-2 w-full">
        <ARAgingChart data={agingData} />
        <ARSalesmanChart data={salesmanData} />
      </div>

      {/* Filter Row */}
      <ARFilterBar
        search={search}
        setSearch={setSearch}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        status={status}
        setStatus={setStatus}
        arStatus={arStatus}
        setArStatus={setArStatus}
        transactionStatus={transactionStatus}
        setTransactionStatus={setTransactionStatus}
        transactionStatusOptions={transactionStatusOptions}
        salesman={salesman}
        setSalesman={setSalesman}
        salesmanOptions={salesmanOptions}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
        setPage={setPage}
      />

      {/* Data Invoices Table */}
      <ARInvoiceTable
        invoices={filteredRecords}
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

export default AccountsReceivableModule;
