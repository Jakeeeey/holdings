"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Hourglass,
  AlertOctagon,
  TrendingDown,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Warehouse,
  Boxes,
  ShieldAlert,
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
import { fetchInventoryAging } from "@/modules/holdings/executive-dashboard/inventory-aging/providers/fetchProvider";
import type {
  InventoryAgingKpis,
  InventoryAgingItem,
  AgingBracketSummary,
  WarehouseAgingSummary,
  AgingStatus,
} from "@/modules/holdings/executive-dashboard/inventory-aging/types";

export interface InventoryAgingPreviewCardProps {
  group: {
    id: number;
    group_name?: string;
    category?: string;
    [key: string]: unknown;
  };
  startDate?: string;
  endDate?: string;
}

const AGING_STATUS_BADGES: Record<AgingStatus, string> = {
  FRESH: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NORMAL: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  SLOW_MOVING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  AT_RISK: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  SLOB: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export function InventoryAgingPreviewCard({ group }: InventoryAgingPreviewCardProps) {
  const [kpis, setKpis] = useState<InventoryAgingKpis | null>(null);
  const [items, setItems] = useState<InventoryAgingItem[]>([]);
  const [brackets, setBrackets] = useState<AgingBracketSummary[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseAgingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"chart" | "warehouses" | "table">("chart");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventoryAging({
        groupId: group.id,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setItems(res.items || []);
      setBrackets(res.brackets || []);
      setWarehouses(res.warehouses || []);
    } catch (err) {
      console.warn(`[InventoryAgingPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load inventory aging data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, statusFilter]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const chartData = useMemo(() => {
    return brackets.map((b) => ({
      bracket: b.bracket,
      label: b.label,
      valuation: b.totalValuation,
      units: b.totalUnits,
      skus: b.skuCount,
    }));
  }, [brackets]);

  return (
    <Card className="overflow-hidden border border-border/60 bg-gradient-to-b from-card to-card/70 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* TOP BAR / CARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-1.5">
                <Hourglass className="h-3 w-3 text-amber-500 animate-spin-slow" />
                SUPPLY CHAIN & DISTRIBUTION INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-bold px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
              >
                LIVE ENGINE
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
                {group.group_name || "Inventory Aging & SLOB Monitor"}
              </h2>
            </div>
          </div>

          {/* VIEW SWITCHER & CONTROLS */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "chart"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Brackets
              </button>
              <button
                type="button"
                onClick={() => setViewMode("warehouses")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "warehouses"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Warehouses
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3 w-3" />
                Ledger
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Refresh Real-time Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 5-KPI METRIC RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* KPI 1: Total Aged Valuation */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Stock Value</span>
              <Boxes className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Across {(kpis?.totalSkuCount || 0).toLocaleString()} Active SKUs
            </div>
          </div>

          {/* KPI 2: Total SLOB Value */}
          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Total SLOB Value</span>
              <AlertOctagon className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24 bg-rose-500/10" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                ₱{(kpis?.totalSlobValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-bold">
              Dead / Slow Moving Stock
            </div>
          </div>

          {/* KPI 3: SLOB Risk Ratio */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">SLOB Risk Ratio</span>
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {kpis?.slobRiskRatio || 0}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">of total</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Target threshold &lt; 15%
            </div>
          </div>

          {/* KPI 4: Physical SLOB Units */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">SLOB Units</span>
              <Warehouse className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.slobUnits || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Out of {(kpis?.totalStockUnits || 0).toLocaleString()} physical units
            </div>
          </div>

          {/* KPI 5: Critical SLOB SKUs */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Critical SKUs</span>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                {kpis?.criticalSlobSkuCount || 0}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {kpis?.atRiskSkuCount || 0} additional at-risk
            </div>
          </div>
        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-black uppercase tracking-wider scrollbar-none">
          <span className="text-muted-foreground/60 text-[9px] mr-1">Filter:</span>
          {(["ALL", "SLOB", "AT_RISK", "SLOW_MOVING", "NORMAL", "FRESH"] as const).map((st) => (
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
              {st === "ALL" ? "All Aging" : st.replace("_", " ")}
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
            {/* VIEW 1: AGING BRACKETS COMPOSED CHART */}
            {viewMode === "chart" && (
              <div className="space-y-4">
                <div className="h-60 sm:h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="bracket"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val: string) => `${val}d`}
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
                        tickFormatter={(val: number) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
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
                          if (name === "Valuation") {
                            return [`₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Aged Valuation"];
                          }
                          return [`${num.toLocaleString()} units`, "Physical Quantity"];
                        }}
                        labelFormatter={(lbl: string) => {
                          const found = brackets.find((b) => b.bracket === lbl);
                          return found?.label || `${lbl} Days Bracket`;
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
                        dataKey="valuation"
                        name="Valuation"
                        fill="#06b6d4"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={45}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="units"
                        name="Units"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#f59e0b" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Brackets Quick Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {brackets.map((b) => (
                    <div
                      key={b.bracket}
                      className="p-2.5 rounded-xl border border-border/40 bg-card/40 space-y-1 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-[10px] font-bold text-muted-foreground truncate">{b.label}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-black text-foreground">
                        ₱{(b.totalValuation).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                        <span>{b.sharePercentage}% share</span>
                        <span>{b.skuCount} SKUs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: WAREHOUSES GRID */}
            {viewMode === "warehouses" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {warehouses.map((w) => (
                  <div
                    key={w.branchId}
                    className="p-3.5 rounded-xl border border-border/40 bg-card/40 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-cyan-500" />
                        <span className="text-xs font-black text-foreground tracking-tight">{w.branchName}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black tracking-wider ${
                          w.slobRatio > 20
                            ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {w.slobRatio}% SLOB
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Value</div>
                        <div className="font-bold text-foreground">
                          ₱{w.totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider">SLOB Value</div>
                        <div className="font-bold text-rose-600 dark:text-rose-400">
                          ₱{w.slobValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span>{w.skuCount} Total SKUs</span>
                      <span>{w.slobUnits.toLocaleString()} Dead Units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: LEDGER TABLE */}
            {viewMode === "table" && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border/40 text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Product SKU / Name</th>
                        <th className="p-2.5">Warehouse</th>
                        <th className="p-2.5 text-right">Units</th>
                        <th className="p-2.5 text-right">Valuation</th>
                        <th className="p-2.5 text-center">Aging Days</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredItems.slice(0, 15).map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[260px]">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.productCode || `SKU-${item.productId}`}
                            </div>
                          </td>
                          <td className="p-2.5 text-muted-foreground truncate max-w-[130px]">
                            {item.branchName}
                          </td>
                          <td className="p-2.5 text-right font-medium text-foreground">
                            {item.currentStock.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-foreground">
                            ₱{item.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-bold text-foreground">{item.daysSinceLastOutbound}</span>
                            <span className="text-[9px] text-muted-foreground ml-1">days</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                AGING_STATUS_BADGES[item.status]
                              }`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                            No inventory items match the selected filter.
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
            {kpis?.topAgedProductName ? (
              <span>
                Top SLOB Risk: <span className="font-bold text-foreground">{kpis.topAgedProductName}</span> (₱{(kpis.topAgedProductValue).toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            ) : (
              <span>Real-time warehouse aging sync</span>
            )}
          </div>
          <Link
            href={`/holdings/executive-dashboard/manufacturing/${group.id}/inventory-aging`}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            Deep Dive Analytics
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

