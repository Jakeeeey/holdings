"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Percent,
  TrendingUp,
  DollarSign,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Coins,
  Receipt,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchGrossMargin } from "@/modules/holdings/executive-dashboard/gross-margin/providers/fetchProvider";
import type {
  GrossMarginKpis,
  ProductMarginItem,
  CategoryMarginSummary,
  TrendMarginPoint,
  MarginHealth,
} from "@/modules/holdings/executive-dashboard/gross-margin/types";

export interface GrossMarginPreviewCardProps {
  group: {
    id: number;
    group_name?: string;
    category?: string;
    [key: string]: unknown;
  };
  startDate?: string;
  endDate?: string;
}

const MARGIN_HEALTH_BADGES: Record<MarginHealth, string> = {
  HIGH: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  HEALTHY: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  LOW: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  NEGATIVE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export function GrossMarginPreviewCard({ group, startDate, endDate }: GrossMarginPreviewCardProps) {
  const [kpis, setKpis] = useState<GrossMarginKpis | null>(null);
  const [products, setProducts] = useState<ProductMarginItem[]>([]);
  const [categories, setCategories] = useState<CategoryMarginSummary[]>([]);
  const [trends, setTrends] = useState<TrendMarginPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"trend" | "categories" | "products">("trend");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchGrossMargin({
        groupId: group.id,
        startDate,
        endDate,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setProducts(res.products || []);
      setCategories(res.categories || []);
      setTrends(res.trends || []);
    } catch (err) {
      console.warn(`[GrossMarginPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load gross margin data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate, statusFilter]);

  const filteredProducts = useMemo(() => {
    if (statusFilter === "ALL") return products;
    return products.filter((p) => p.marginHealth === statusFilter);
  }, [products, statusFilter]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 w-full overflow-hidden border border-border/60 bg-gradient-to-b from-card to-card/70 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* TOP BAR / CARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-1.5">
                <Percent className="h-3 w-3 text-emerald-500" />
                COMMERCIAL & DISTRIBUTION INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-bold px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
              >
                LIVE ENGINE
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
                {group.group_name || "Gross Margin & Profitability"}
              </h2>
            </div>
          </div>

          {/* VIEW SWITCHER & CONTROLS */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("trend")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "trend"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Trend
              </button>
              <button
                type="button"
                onClick={() => setViewMode("categories")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "categories"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Categories
              </button>
              <button
                type="button"
                onClick={() => setViewMode("products")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "products"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3 w-3" />
                Products
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Refresh Real-time Margins"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 5-KPI METRIC RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* KPI 1: Invoiced Revenue */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Invoiced Sales</span>
              <DollarSign className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {(kpis?.totalInvoicesCount || 0).toLocaleString()} Invoices
            </div>
          </div>

          {/* KPI 2: Total COGS */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total COGS</span>
              <Coins className="h-3.5 w-3.5 text-slate-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalCogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Direct Product Cost
            </div>
          </div>

          {/* KPI 3: Gross Profit */}
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Gross Profit</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24 bg-emerald-500/10" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                ₱{(kpis?.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
              Realized Margin (₱)
            </div>
          </div>

          {/* KPI 4: Gross Margin % */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin %</span>
              <Percent className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {kpis?.grossMarginPercentage || 0}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">weighted</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Target baseline &gt; 20%
            </div>
          </div>

          {/* KPI 5: Dispatched Units */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Dispatched Units</span>
              <Receipt className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.totalUnitsSold || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              ₱{(kpis?.averageOrderProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} avg profit / inv
            </div>
          </div>
        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-black uppercase tracking-wider scrollbar-none">
          <span className="text-muted-foreground/60 text-[9px] mr-1">Filter Margin:</span>
          {(["ALL", "HIGH", "HEALTHY", "LOW", "NEGATIVE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-full transition-all border whitespace-nowrap ${
                statusFilter === st
                  ? "bg-foreground text-background border-foreground shadow-xs font-black"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
              }`}
            >
              {st === "ALL" ? "All Margins" : st === "HIGH" ? "High (≥25%)" : st === "HEALTHY" ? "Healthy (15-25%)" : st === "LOW" ? "Low (<15%)" : "Negative (<0%)"}
            </button>
          ))}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN BODY TOGGLE */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* VIEW 1: TREND / WATERFALL COMPOSED CHART */}
            {viewMode === "trend" && (
              <div className="space-y-3">
                <div className="h-60 sm:h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="periodLabel"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: number) => `${val}%`}
                        domain={[0, 45]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(val: number | string, name: string) => {
                          const num = Number(val || 0);
                          if (name === "Margin %") {
                            return [`${num.toFixed(1)}%`, "Gross Margin"];
                          }
                          return [`₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="Sales Revenue"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="cogs"
                        name="COGS"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="marginPercentage"
                        name="Margin %"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#10b981" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VIEW 2: CATEGORIES BREAKDOWN */}
            {viewMode === "categories" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-3.5 rounded-xl border border-border/40 bg-card/40 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        <Layers className="h-4 w-4 text-cyan-500 shrink-0" />
                        <span className="text-xs font-black text-foreground tracking-tight truncate">{c.category}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black tracking-wider ${
                          c.grossMarginPercentage >= 25
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                            : c.grossMarginPercentage >= 15
                            ? "border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5"
                            : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                        }`}
                      >
                        {c.grossMarginPercentage}% Margin
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</div>
                        <div className="font-bold text-foreground">
                          ₱{c.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Gross Profit</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₱{c.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span>{c.productCount} SKUs Active</span>
                      <span>{c.unitsSold.toLocaleString()} Units Sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: PRODUCTS LEDGER */}
            {viewMode === "products" && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border/40 text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Product SKU / Name</th>
                        <th className="p-2.5 text-right">Units</th>
                        <th className="p-2.5 text-right">Revenue</th>
                        <th className="p-2.5 text-right">COGS</th>
                        <th className="p-2.5 text-right">Gross Profit</th>
                        <th className="p-2.5 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredProducts.slice(0, 15).map((p) => (
                        <tr key={p.productId} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[260px]">
                              {p.productName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {p.productCode || `SKU-${p.productId}`} {p.productBrand ? `• ${p.productBrand}` : ""}
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-medium text-foreground">
                            {p.unitsSold.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-foreground">
                            ₱{p.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-medium text-muted-foreground">
                            ₱{p.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₱{p.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                MARGIN_HEALTH_BADGES[p.marginHealth]
                              }`}
                            >
                              {p.grossMarginPercentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                            No products match the selected margin health filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* BOTTOM ACTION / DEEP DIVE LINK */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="text-[10px] text-muted-foreground">
            {kpis?.topMarginCategory ? (
              <span>
                Top Margin Driver: <span className="font-bold text-foreground">{kpis.topMarginCategory}</span> ({kpis.topMarginCategoryRate}% Margin)
              </span>
            ) : (
              <span>Real-time realized invoice margin calculations</span>
            )}
          </div>
          <Link
            href={`/holdings/executive-dashboard/manufacturing/${group.id}/gross-margin`}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            Deep Dive Analytics
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

