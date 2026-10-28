// src/modules/holdings/executive-dashboard/accounts-receivable/components/ARMetricCards.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PhilippinePeso, Receipt, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { formatPeso } from '../utils';
import type { ARMetricsSummary } from '../types';

interface ARMetricCardsProps {
  metrics: ARMetricsSummary;
}

export function ARMetricCards({ metrics }: ARMetricCardsProps) {
  const {
    totalReceivable,
    totalPaid,
    totalOutstanding,
    collectionRate,
    totalOverdue,
    overdueCount,
    totalInvoices,
  } = metrics;

  return (
    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
      {/* Total Receivable */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Total Receivable
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
              {formatPeso(totalReceivable)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across <strong className="text-foreground">{totalInvoices}</strong> invoices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Collected */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Total Collected
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatPeso(totalPaid)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <strong className="text-emerald-600 dark:text-emerald-400">{collectionRate.toFixed(1)}%</strong> collection efficiency
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Balance */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Outstanding Balance
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PhilippinePeso className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {formatPeso(totalOutstanding)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Uncollected active balance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Exposure */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Past Due Exposure
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {overdueCount > 0 ? <TrendingDown className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatPeso(totalOverdue)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <strong className="text-rose-600 dark:text-rose-400">{overdueCount}</strong> overdue invoice{overdueCount === 1 ? '' : 's'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
