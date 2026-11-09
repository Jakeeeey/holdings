"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
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
import { fetchManufacturingCost } from "@/modules/holdings/executive-dashboard/manufacturing-cost/providers/fetchProvider";
import type {
  ManufacturingCostKpis,
  ProductCostItem,
  CategoryCostSummary,
  CostVarianceStatus,
} from "@/modules/holdings/executive-dashboard/manufacturing-cost/types";

export interface ManufacturingCostPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

const VARIANCE_BADGES: Record<CostVarianceStatus, string> = {
  FAVORABLE: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  ON_TARGET: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
  ELEVATED: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  UNFAVORABLE: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
};

export function ManufacturingCostPreviewCard({
  group,
  startDate,
  endDate,
}: ManufacturingCostPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ManufacturingCostKpis | null>(null);
  const [products, setProducts] = useState<ProductCostItem[]>([]);
  const [categories, setCategories] = useState<CategoryCostSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchManufacturingCost({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setProducts(res.products || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      console.warn(`[ManufacturingCostPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load manufacturing cost data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const chartData = useMemo(() => {
    return filteredProducts.slice(0, 7).map((p) => ({
      name: p.productCode || p.productName.slice(0, 10),
      fullName: p.productName,
      rawMaterial: p.rawMaterialCost,
      packaging: p.packagingCost,
      labor: p.directLaborCost,
      overhead: p.overheadCost,
      standardCost: p.standardCostPerUnit,
      actualCost: p.actualCostPerUnit,
      margin: p.grossMarginPercentage,
      uom: p.uom,
      status: p.status,
    }));
  }, [filteredProducts]);

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
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                MANUFACTURING COST / UNIT
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Manufacturing Cost / Unit"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Unit cost breakdown, BOM absorption, actual vs standard variances, and gross margins
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/cost-per-unit`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
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
              <span className="font-semibold">Failed to fetch manufacturing cost data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Average Cost Per Unit */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Cost / Unit</span>
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    ₱{kpis.averageCostPerUnit.toFixed(1)}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      kpis.isVarianceFavorable ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {kpis.overallCostVariance > 0 ? `+${kpis.overallCostVariance}%` : `${kpis.overallCostVariance}%`}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.isVarianceFavorable ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.isVarianceFavorable ? "Under budget target" : "Above standard target"}</span>
                </div>
              </div>

              {/* Standard Cost Target */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Budget Standard</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-muted-foreground">
                    ₱{kpis.budgetStandardUnitCost.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">target</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.evaluatedSkusCount} finished goods</span>
                </div>
              </div>

              {/* Average Gross Margin */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.averageGrossMargin}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">healthy</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Selling price vs actual cost</span>
                </div>
              </div>

              {/* Material Cost Absorption */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Material Share</span>
                  <PieChartIcon className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.materialCostSharePercentage}%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span>Raw materials + Packaging</span>
                </div>
              </div>

              {/* Top Margin Product */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Margin SKU</span>
                  <TrendingDown className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="mt-1 truncate">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-foreground truncate block" title={kpis.topCostEfficiencySku}>
                    {kpis.topCostEfficiencySku}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                  <span>{kpis.topCostEfficiencyMargin}% contribution margin</span>
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
                All Categories ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === c.category ? null : c.category)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === c.category
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{c.category}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                    ₱{c.averageUnitCost.toFixed(0)} avg
                  </span>
                </button>
              ))}
            </div>

            {/* Main Views Container */}
            {viewMode === "chart" && (
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-foreground">Unit Cost Composition vs Budget Target Line (PHP)</span>
                  <span className="text-[10px] text-muted-foreground">
                    Stacked: Raw Materials + Packaging + Labor + Overhead vs Standard Line
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
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `₱${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(val: number | string, name: string) => [
                          `₱${Number(val).toLocaleString()}`,
                          name,
                        ]}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? `${item.fullName} (${item.name})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        dataKey="rawMaterial"
                        name="Raw Material (₱)"
                        stackId="cost"
                        fill="#059669"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={38}
                      />
                      <Bar
                        dataKey="packaging"
                        name="Packaging (₱)"
                        stackId="cost"
                        fill="#10b981"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={38}
                      />
                      <Bar
                        dataKey="labor"
                        name="Direct Labor (₱)"
                        stackId="cost"
                        fill="#38bdf8"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={38}
                      />
                      <Bar
                        dataKey="overhead"
                        name="Overhead MOH (₱)"
                        stackId="cost"
                        fill="#fbbf24"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                      <Line
                        type="monotone"
                        dataKey="standardCost"
                        name="Standard Target (₱)"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#f43f5e" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 hover:border-border/80 hover:bg-muted/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {p.productCode}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          VARIANCE_BADGES[p.status]
                        }`}
                      >
                        {p.costVariancePercentage > 0
                          ? `+${p.costVariancePercentage}% Variance`
                          : `${p.costVariancePercentage}% Variance`}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {p.productName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {p.category} · Wholesale ₱{p.sellingPrice.toLocaleString()}/{p.uom}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Actual Unit Cost
                        </span>
                        <span className="font-bold text-foreground">
                          ₱{p.actualCostPerUnit.toLocaleString()} / {p.uom}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Gross Margin
                        </span>
                        <span className="font-bold text-emerald-500">
                          {p.grossMarginPercentage}% Margin
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        Std: ₱{p.standardCostPerUnit.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        Mat: ₱{(p.rawMaterialCost + p.packagingCost).toLocaleString()}
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
                      <th className="p-2.5 text-right">Standard Cost</th>
                      <th className="p-2.5 text-right">Actual Cost</th>
                      <th className="p-2.5 text-right">Variance</th>
                      <th className="p-2.5 text-right">Wholesale Price</th>
                      <th className="p-2.5 text-right">Gross Margin</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredProducts.slice(0, 6).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-foreground">{p.productCode}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-foreground block truncate max-w-[170px]">
                            {p.productName}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{p.category}</td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          ₱{p.standardCostPerUnit.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-foreground">
                          ₱{p.actualCostPerUnit.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              p.costVariancePercentage <= 0 ? "text-emerald-500" : "text-amber-500"
                            }
                          >
                            {p.costVariancePercentage > 0
                              ? `+${p.costVariancePercentage}%`
                              : `${p.costVariancePercentage}%`}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          ₱{p.sellingPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-500">
                          {p.grossMarginPercentage}%
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              VARIANCE_BADGES[p.status]
                            }`}
                          >
                            {p.status.replace(/_/g, " ")}
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

