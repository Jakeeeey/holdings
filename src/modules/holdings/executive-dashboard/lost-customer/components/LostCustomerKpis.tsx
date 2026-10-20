"use client";

import React from "react";
import {
  Clock,
  Coins,
  ShieldAlert,
  UserX,
  TrendingDown,
  AlertCircle,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LostCustomerKpis as KpiType } from "../types";

interface LostCustomerKpisProps {
  kpis: KpiType;
}

function formatPhp(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function LostCustomerKpis({ kpis }: LostCustomerKpisProps) {
  const total = kpis.totalCustomers || 1;
  const atRiskPct = Math.round((kpis.atRiskCount / total) * 100);
  const dormantPct = Math.round((kpis.dormantCount / total) * 100);
  const lostPct = Math.round((kpis.lostCount / total) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Inactive Accounts */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-red-500/40">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Inactive Accounts
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <UserX className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {kpis.totalCustomers.toLocaleString()}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 font-semibold"
              >
                Zero Recent Sales
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>Accounts requiring sales re-engagement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue at Risk */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-amber-500/40">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Revenue at Risk
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {formatPhp(kpis.totalValueAtRisk)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Past sales volume from dormant accounts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Inactivity Duration */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-500/40">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg. Days Inactive
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {kpis.avgDaysInactive}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">days since order</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Average gap without purchases</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Critical Churn Accounts */}
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-rose-500/40">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Lost / At-Risk Ratio
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {(kpis.lostCount + kpis.atRiskCount).toLocaleString()}
              </span>
              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-0 text-[10px] font-bold">
                {Math.min(100, lostPct + atRiskPct)}% Critical
              </Badge>
            </div>
            {/* Visual segmented bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden flex">
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${lostPct}%` }}
                title={`Lost: ${lostPct}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${atRiskPct}%` }}
                title={`At Risk: ${atRiskPct}%`}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${dormantPct}%` }}
                title={`Dormant: ${dormantPct}%`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
