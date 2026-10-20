"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TaggingDistributionItem,
  InactivityRangeDistribution,
  LostCustomerRecord,
} from "../types";

interface LostCustomerChartsProps {
  taggingDistribution: TaggingDistributionItem[];
  inactivityDistribution: InactivityRangeDistribution[];
  topAtRiskCustomers: LostCustomerRecord[];
  onSelectCustomer?: (customer: LostCustomerRecord) => void;
}

const PIE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#10b981", // emerald
];

function formatPhp(amount: number): string {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}k`;
  }
  return `₱${amount.toLocaleString()}`;
}

export function LostCustomerCharts({
  taggingDistribution,
  inactivityDistribution,
  topAtRiskCustomers,
  onSelectCustomer,
}: LostCustomerChartsProps) {
  const pieData = taggingDistribution.map((t) => ({
    name: t.tag,
    value: t.count,
    totalSales: t.totalSales,
  }));

  return (
    <div className="space-y-4">
      {/* Row 1: Charts (Donut + Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Churn Tagging Distribution */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Account Churn Classification
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Categorization of inactive accounts by customer tagging
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-foreground">{d.name}</p>
                            <p className="text-muted-foreground">
                              Accounts: <strong className="text-foreground">{d.value}</strong>
                            </p>
                            <p className="text-muted-foreground">
                              Sales at Risk:{" "}
                              <strong className="text-amber-500">{formatPhp(d.totalSales)}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-border/40">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inactivity Duration Ranges */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Inactivity Duration Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Number of accounts by elapsed days since last transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inactivityDistribution}
                  margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as InactivityRangeDistribution;
                        return (
                          <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-foreground">{d.range}</p>
                            <p className="text-muted-foreground">
                              Accounts: <strong className="text-foreground">{d.count}</strong>
                            </p>
                            <p className="text-muted-foreground">
                              Sales Volume:{" "}
                              <strong className="text-amber-500">{formatPhp(d.totalSales)}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {inactivityDistribution.map((_, index) => (
                      <Cell
                        key={`bar-cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top At-Risk Accounts */}
      {topAtRiskCustomers.length > 0 && (
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Highest Value Accounts at Risk
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Top inactive accounts ranked by historical sales volume
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Top 5 Priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topAtRiskCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer && onSelectCustomer(cust)}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-xs text-foreground truncate" title={cust.customerName}>
                        {cust.customerName}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {cust.customerCode}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-600 bg-red-500/10 shrink-0">
                      {cust.tagging}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground text-[11px]">
                      {cust.minDaysNoSales} days inactive
                    </span>
                    <span className="font-bold text-amber-500">
                      {formatPhp(cust.totalHistoricalSales)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
