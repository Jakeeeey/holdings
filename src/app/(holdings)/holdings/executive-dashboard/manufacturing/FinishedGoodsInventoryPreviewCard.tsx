"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  PackageCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Coins,
  TrendingUp,
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
  Cell,
} from "recharts";
import { fetchFinishedGoodsInventory } from "@/modules/holdings/executive-dashboard/finished-goods-inventory/providers/fetchProvider";
import type {
  FinishedGoodsInventoryKpis,
  FinishedGoodsItem,
  FinishedGoodsCategorySummary,
  FinishedGoodsStockStatus,
} from "@/modules/holdings/executive-dashboard/finished-goods-inventory/types";

export interface FinishedGoodsInventoryPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

const STATUS_BADGES: Record<FinishedGoodsStockStatus, string> = {
  OPTIMAL: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  LOW_STOCK: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  OVERSTOCKED: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  OUT_OF_STOCK: "text-red-700 bg-red-500/10 border-red-500/20 dark:text-red-400",
};

export function FinishedGoodsInventoryPreviewCard({
  group,
  startDate,
  endDate,
}: FinishedGoodsInventoryPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<FinishedGoodsInventoryKpis | null>(null);
  const [items, setItems] = useState<FinishedGoodsItem[]>([]);
  const [categories, setCategories] = useState<FinishedGoodsCategorySummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFinishedGoodsInventory({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setItems(res.items || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      console.warn(`[FinishedGoodsInventoryPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load finished goods inventory data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((it) => it.category === selectedCategory);
  }, [items, selectedCategory]);

  const chartData = useMemo(() => {
    return filteredItems.slice(0, 7).map((it) => ({
      name: it.productCode || it.productName.slice(0, 10),
      fullName: it.productName,
      available: it.availableQuantity,
      reserved: it.reservedQuantity,
      onHand: it.onHandQuantity,
      valuation: it.totalValuation,
      uom: it.uom,
      status: it.status,
    }));
  }, [filteredItems]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden hover:border-border/80 transition-all duration-300">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                MANUFACTURING OPERATIONS INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                FINISHED GOODS INVENTORY
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Finished Goods Inventory"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Warehouse inventory valuations, stock on hand vs reserved, days of inventory, and fulfillment readiness
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
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Chart View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading}
              className="h-7 w-7 p-0 rounded-lg border-border/40 hover:bg-muted/50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </Button>

            {/* Deep Dive Link */}
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/finished-goods`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
              >
                <span>Deep Dive</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && !kpis && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {error && !kpis && (
          <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold">Failed to fetch finished goods inventory data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Inventory Valuation */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Value</span>
                  <Coins className="h-3.5 w-3.5 text-cyan-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-cyan-600 dark:text-cyan-400">
                    ₱{(kpis.totalInventoryValuation / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>₱{kpis.totalInventoryValuation.toLocaleString()} total asset</span>
                </div>
              </div>

              {/* On Hand vs Reserved */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total On-Hand</span>
                  <Boxes className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalOnHandUnits.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.totalReservedUnits.toLocaleString()} reserved for orders</span>
                </div>
              </div>

              {/* Fulfillment Readiness */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Service Level</span>
                  <PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.fulfillmentReadinessRate}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">ready</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.totalAvailableUnits.toLocaleString()} uncommitted units</span>
                </div>
              </div>

              {/* Days of Supply (DOI) */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Days of Supply</span>
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.averageDaysOfSupply}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">days</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Healthy ~3-week buffer</span>
                </div>
              </div>

              {/* Stock Health Balance */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Stock Health</span>
                  {kpis.lowStockSkus > 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm sm:text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.optimalStockSkus} Optimal
                  </span>
                  {kpis.lowStockSkus > 0 && (
                    <span className="text-[10px] font-bold text-rose-500">
                      · {kpis.lowStockSkus} Low
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.totalMonitoredSkus} finished SKUs</span>
                </div>
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                All Categories ({items.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === c.category ? null : c.category)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === c.category
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{c.categoryLabel}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                    ₱{(c.totalValuation / 1000).toFixed(0)}k
                  </span>
                </button>
              ))}
            </div>

            {/* Main Views Container */}
            {viewMode === "chart" && (
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-foreground">Available Stock vs Reserved Allocation by Finished SKU</span>
                  <span className="text-[10px] text-muted-foreground">
                    Units on hand and committed dispatch orders
                  </span>
                </div>

                <div className="h-60 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        angle={-20}
                        textAnchor="end"
                        height={35}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Inventory Valuation (₱)") return [`₱${Number(val).toLocaleString()}`, name];
                          if (name === "Available Units" || name === "Reserved Units") return [`${Number(val).toLocaleString()}`, name];
                          return [val, name];
                        }}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? `${item.fullName} (${item.name})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="available"
                        name="Available Units"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={35}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.status === "LOW_STOCK" ? "#f43f5e" : "#06b6d4"}
                          />
                        ))}
                      </Bar>
                      <Bar
                        yAxisId="left"
                        dataKey="reserved"
                        name="Reserved Units"
                        fill="#fbbf24"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={25}
                        opacity={0.8}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.slice(0, 6).map((it) => (
                  <div
                    key={it.id}
                    className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 hover:border-border/80 hover:bg-muted/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {it.productCode}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          STATUS_BADGES[it.status]
                        }`}
                      >
                        {it.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {it.productName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {it.warehouseLocation}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Available / On-Hand
                        </span>
                        <span className="font-bold text-foreground">
                          {it.availableQuantity.toLocaleString()} / {it.onHandQuantity.toLocaleString()} {it.uom}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Valuation
                        </span>
                        <span className="font-bold text-cyan-500">
                          ₱{Math.round(it.totalValuation).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {it.daysOfSupply} Days of Supply
                      </span>
                      <span className="text-muted-foreground font-mono">
                        ₱{it.unitValue.toLocaleString()}/{it.uom}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "table" && (
              <div className="border border-border/40 rounded-xl overflow-x-auto bg-muted/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    <tr>
                      <th className="p-2.5">SKU Code</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">On Hand</th>
                      <th className="p-2.5 text-right">Reserved</th>
                      <th className="p-2.5 text-right">Available</th>
                      <th className="p-2.5 text-right">Unit Value</th>
                      <th className="p-2.5 text-right">Total Valuation</th>
                      <th className="p-2.5 text-center">DOI</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredItems.slice(0, 6).map((it) => (
                      <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-foreground">{it.productCode}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-foreground block truncate max-w-[170px]">
                            {it.productName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[170px]">
                            {it.warehouseLocation}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{it.categoryLabel}</td>
                        <td className="p-2.5 text-right font-medium text-foreground">
                          {it.onHandQuantity.toLocaleString()} {it.uom}
                        </td>
                        <td className="p-2.5 text-right text-amber-500 font-medium">
                          {it.reservedQuantity.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-foreground">
                          {it.availableQuantity.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          ₱{it.unitValue.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-cyan-500">
                          ₱{Math.round(it.totalValuation).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {it.daysOfSupply}d
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              STATUS_BADGES[it.status]
                            }`}
                          >
                            {it.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

