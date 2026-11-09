"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Warehouse,
  Coins,
  BadgeAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchInventory } from "@/modules/holdings/executive-dashboard/inventory/providers/fetchProvider";
import type {
  InventoryKpis,
  InventoryProductItem,
  InventoryCategorySummary,
  InventoryStockStatus,
} from "@/modules/holdings/executive-dashboard/inventory/types";

export interface InventoryPreviewCardProps {
  group: {
    id: number;
    group_name?: string;
    category?: string;
    [key: string]: unknown;
  };
  startDate?: string;
  endDate?: string;
}

const STOCK_STATUS_BADGES: Record<InventoryStockStatus, string> = {
  OPTIMAL: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LOW_STOCK: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  CRITICAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  OVERSTOCK: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export function InventoryPreviewCard({ group }: InventoryPreviewCardProps) {
  const [kpis, setKpis] = useState<InventoryKpis | null>(null);
  const [items, setItems] = useState<InventoryProductItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"chart" | "cards" | "table">("chart");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventory({
        groupId: group.id,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setItems(res.items || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.warn(`[InventoryPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load inventory data";
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
    return items.filter((i) => i.stockStatus === statusFilter);
  }, [items, statusFilter]);

  const chartData = useMemo(() => {
    return categories.slice(0, 6).map((c) => ({
      label: c.category.length > 15 ? `${c.category.slice(0, 15)}...` : c.category,
      valuation: Math.round(c.totalValuation / 1000), // in ₱K
      units: Math.round(c.totalUnits / 1000), // in Thousands
    }));
  }, [categories]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden hover:border-border/80 transition-all duration-300">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                SUPPLY CHAIN & DISTRIBUTION INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                INVENTORY & WAREHOUSE
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Inventory"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Real-time stock valuation, unit counts on hand, warehouse distribution, and low stock replenishments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40">
              <Button
                variant={viewMode === "chart" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="Chart View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Valuation</span>
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="Category Cards"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Categories</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="Stock Ledger"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ledger</span>
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading}
              className="h-8 w-8 p-0"
              title="Refresh Inventory"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {/* Deep Dive Link */}
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/inventory`}>
              <Button
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
              >
                <span>Deep-Dive</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { key: "ALL", label: "All Stock" },
            { key: "OPTIMAL", label: "Optimal Health" },
            { key: "LOW_STOCK", label: "Low Stock Warning" },
            { key: "CRITICAL", label: "Critical / Out of Stock" },
            { key: "OVERSTOCK", label: "Overstock Buffer" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                statusFilter === item.key
                  ? "bg-cyan-600 text-white border-cyan-700 shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">Notice:</span> {error} (Displaying live cached catalog data)
            </span>
          </div>
        )}

        {/* 5-KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* KPI 1: Total Valuation */}
          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-500/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Total Inventory Valuation
              </span>
              <Coins className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-cyan-700 dark:text-cyan-400">
                  ₱{(kpis?.totalValuation || 0) >= 1000000
                    ? `${((kpis?.totalValuation || 0) / 1000000).toFixed(2)}M`
                    : `${((kpis?.totalValuation || 0) / 1000).toFixed(0)}K`}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  At active branch warehouses
                </p>
              </div>
            )}
          </div>

          {/* KPI 2: Total Physical Stock Units */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Stock Units</span>
              <Boxes className="h-4 w-4 text-blue-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {(kpis?.totalStockUnits || 0) >= 1000000
                    ? `${((kpis?.totalStockUnits || 0) / 1000000).toFixed(2)}M`
                    : (kpis?.totalStockUnits || 0).toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Physical units on hand
                </p>
              </div>
            )}
          </div>

          {/* KPI 3: Stock Health Rate % */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Stock Health Rate</span>
              <PackageCheck className="h-4 w-4 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {kpis?.stockHealthRate || 0}%
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground font-medium">Target &ge; 90%</span>
                </div>
              </div>
            )}
          </div>

          {/* KPI 4: Active SKUs */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">In-Stock SKUs</span>
              <Warehouse className="h-4 w-4 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {kpis?.inStockSkuCount || 0}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Active catalog lines</p>
              </div>
            )}
          </div>

          {/* KPI 5: Low Stock / Reorder Alerts */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Reorder Alerts</span>
              <BadgeAlert className="h-4 w-4 text-rose-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {(kpis?.lowStockCount || 0) + (kpis?.criticalStockCount || 0)}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {kpis?.criticalStockCount || 0} Critical · {kpis?.lowStockCount || 0} Low Stock
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Views Container */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* VIEW 1: CHART VIEW */}
            {viewMode === "chart" && (
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Category Valuation & Stock Volume
                    </h4>
                    <p className="text-[11px] text-muted-foreground/70">
                      Total inventory value (₱ Thousands) alongside physical units (Thousands) by category
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    Top Categories
                  </Badge>
                </div>

                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="valuation"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₱${v}k`}
                      />
                      <YAxis
                        yAxisId="units"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Valuation (₱K)") {
                            return [`₱${Number(val).toLocaleString()}K`, name];
                          }
                          return [`${Number(val).toLocaleString()}K Units`, name];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                        iconType="circle"
                      />
                      <Bar
                        yAxisId="valuation"
                        dataKey="valuation"
                        name="Valuation (₱K)"
                        fill="#0891b2"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        yAxisId="units"
                        dataKey="units"
                        name="Units (K)"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VIEW 2: CATEGORY CARDS GRID */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.slice(0, 6).map((cat, idx) => (
                  <div
                    key={cat.category || idx}
                    className="p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:border-cyan-500/40 hover:bg-muted/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground/60">
                            #{idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-foreground line-clamp-1" title={cat.category}>
                            {cat.category}
                          </h5>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {cat.productCount} active lines
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
                        {cat.sharePercentage}% Share
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">Inventory Value</span>
                        <span className="text-sm font-black text-cyan-700 dark:text-cyan-400">
                          ₱{cat.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                        <span>Physical Units</span>
                        <span className="font-semibold text-foreground">
                          {cat.totalUnits.toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: INVENTORY ITEMS LEDGER TABLE */}
            {viewMode === "table" && (
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="overflow-x-auto max-h-[280px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/50 sticky top-0 border-b border-border/40 z-10">
                      <tr>
                        <th className="py-2 px-3 font-bold text-muted-foreground">SKU / Item</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground">Warehouse</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-right">Units on Hand</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-right">Unit Cost (₱)</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-right">Valuation (₱)</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredItems.slice(0, 7).map((item) => {
                        const badgeStyle =
                          STOCK_STATUS_BADGES[item.stockStatus] || STOCK_STATUS_BADGES.OPTIMAL;
                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 max-w-[190px]">
                              <div className="font-mono font-bold text-foreground truncate" title={item.productCode}>
                                {item.productCode || "SKU"}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate" title={item.productName}>
                                {item.productName}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-[130px] truncate" title={item.branchName}>
                              {item.branchName}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-foreground text-right">
                              {item.runningInventory.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-right">
                              ₱{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-cyan-700 dark:text-cyan-400 text-right">
                              ₱{item.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge variant="outline" className={`text-[10px] font-bold ${badgeStyle}`}>
                                {item.stockStatus === "LOW_STOCK" ? "Low Stock" : item.stockStatus}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                            No inventory items found matching selected filters.
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

        {/* Footer Audit Strip */}
        <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted-foreground gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            <span>
              Real-time multi-branch inventory valuation with synchronized stock replenishment monitoring
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Spring Boot & Directus Engine · Container 5 (Distribution)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

