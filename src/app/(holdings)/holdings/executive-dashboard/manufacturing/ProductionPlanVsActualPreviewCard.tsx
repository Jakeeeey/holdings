"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Factory,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Award,
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
  LabelList,
} from "recharts";
import { fetchProductionPlanVsActual } from "@/modules/holdings/executive-dashboard/production-plan-vs-actual/providers/fetchProvider";
import type {
  ProductionPlanVsActualKpis,
  ProductPlanSummary,
  ProductionPlanVsActualJobOrder,
} from "@/modules/holdings/executive-dashboard/production-plan-vs-actual/types";

export interface ProductionPlanVsActualPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function ProductionPlanVsActualPreviewCard({
  group,
  startDate,
  endDate,
}: ProductionPlanVsActualPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionPlanVsActualKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<ProductionPlanVsActualJobOrder[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductPlanSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionPlanVsActual({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setProductSummaries(res.productSummaries || []);
    } catch (err: unknown) {
      console.warn(`[ProductionPlanVsActualPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load production data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const chartData = useMemo(() => {
    const list = selectedProductId
      ? jobOrders.filter((j) => j.productId === selectedProductId)
      : productSummaries;

    if (selectedProductId) {
      return (list as ProductionPlanVsActualJobOrder[]).map((j) => ({
        name: j.jobOrderNo,
        fullName: `${j.jobOrderNo} - ${j.productName}`,
        planned: j.plannedQuantity,
        actual: j.actualGoodQuantity,
        rejected: j.rejectedQuantity,
        variance: j.quantityVariance,
        rate: j.fulfillmentRate,
        uom: j.uom,
      }));
    }

    return (list as ProductPlanSummary[]).map((p) => ({
      name: p.productCode || p.productName.slice(0, 10),
      fullName: p.productName,
      planned: p.plannedQuantity,
      actual: p.actualGoodQuantity,
      rejected: p.rejectedQuantity,
      variance: p.quantityVariance,
      rate: p.fulfillmentRate,
      uom: p.uom,
    }));
  }, [productSummaries, jobOrders, selectedProductId]);

  const activeProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productSummaries.find((p) => p.productId === selectedProductId) || null;
  }, [selectedProductId, productSummaries]);

  const displayedJobs = useMemo(() => {
    if (!selectedProductId) return jobOrders;
    return jobOrders.filter((j) => j.productId === selectedProductId);
  }, [jobOrders, selectedProductId]);

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
                PLAN VS ACTUAL
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Production Plan vs Actual"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Target vs actual output yield, production variance, scrap rate, and schedule adherence
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/plan-vs-actual`}>
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
              <span className="font-semibold">Failed to fetch production plan data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Planned Target */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Planned Target</span>
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalPlannedQuantity.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    units
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.totalJobOrders} Job Orders</span>
                </div>
              </div>

              {/* Actual Good Yield */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Actual Good Yield</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.totalActualGoodQuantity.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    ({kpis.overallFulfillmentRate}%)
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>{kpis.completedJobsCount} finished · {kpis.inProductionJobsCount} in-progress</span>
                </div>
              </div>

              {/* Net Output Variance */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Output Variance</span>
                  {kpis.netQuantityVariance >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      kpis.netQuantityVariance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {kpis.netQuantityVariance > 0 ? "+" : ""}
                    {kpis.netQuantityVariance.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    vs plan
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>On-Time Rate: {kpis.onTimeCompletionRate}%</span>
                </div>
              </div>

              {/* Scrap / Rejections */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scrap &amp; Rejection</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                    {kpis.totalRejectedQuantity.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500">
                    ({kpis.scrapRate}%)
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Quality yield efficiency</span>
                </div>
              </div>

              {/* Top Volume Product */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Product Yield</span>
                  <Award className="h-3.5 w-3.5 text-cyan-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {kpis.topProductByVolume}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">
                  <span>{kpis.topProductFulfillmentRate}% fulfillment achieved</span>
                </div>
              </div>
            </div>

            {/* Quick Ledger Pill Row (Products) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Product Lines &amp; Batch Production ({productSummaries.length})
                </span>
                {selectedProductId && (
                  <button
                    onClick={() => setSelectedProductId(null)}
                    className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant={selectedProductId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProductId(null)}
                  className={`h-7 px-3 text-xs font-bold rounded-lg shrink-0 ${
                    selectedProductId === null
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Products
                </Button>
                {productSummaries.map((p) => {
                  const isSelected = selectedProductId === p.productId;
                  const isGood = p.fulfillmentRate >= 95;
                  const isModerate = p.fulfillmentRate >= 90;

                  return (
                    <Button
                      key={p.productId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProductId(isSelected ? null : p.productId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          isGood
                            ? "bg-emerald-500"
                            : isModerate
                            ? "bg-cyan-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="font-semibold">{p.productName}</span>
                      <span className="text-[10px] opacity-75">{p.fulfillmentRate}%</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Product Focus Banner */}
            {activeProduct && (
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-cyan-500" />
                  <span className="font-bold text-foreground">{activeProduct.productName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeProduct.productCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Planned: <strong className="text-foreground">{activeProduct.plannedQuantity.toLocaleString()} {activeProduct.uom}</strong>
                  </span>
                  <span>
                    Actual: <strong className="text-emerald-600 dark:text-emerald-400">{activeProduct.actualGoodQuantity.toLocaleString()} {activeProduct.uom}</strong>
                  </span>
                  <span>
                    Variance: <strong className={activeProduct.quantityVariance >= 0 ? "text-emerald-500" : "text-rose-500"}>{activeProduct.quantityVariance.toLocaleString()}</strong>
                  </span>
                  <span>
                    Fulfillment: <strong className="text-cyan-600 dark:text-cyan-400">{activeProduct.fulfillmentRate}%</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Main Interactive View */}
            {viewMode === "chart" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                      {selectedProductId ? "Job Orders for Selected Product" : "Planned vs Actual Good Yield by Product Line"}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Units ({activeProduct?.uom || "Quantity"})
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Yield Efficiency Target: <strong className="text-emerald-600 dark:text-emerald-400">&gt;95%</strong>
                  </span>
                </div>

                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[210px]">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1">
                                  {d.fullName}
                                </div>
                                <div className="flex justify-between items-center text-blue-500">
                                  <span>Planned Target:</span>
                                  <span className="font-semibold">{Number(d.planned).toLocaleString()} {d.uom}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                  <span>Actual Good Yield:</span>
                                  <span>{Number(d.actual).toLocaleString()} {d.uom}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-500">
                                  <span>Scrap / Rejection:</span>
                                  <span className="font-semibold">{Number(d.rejected).toLocaleString()} {d.uom}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground border-t border-border/40 pt-1">
                                  <span>Variance:</span>
                                  <span className={`font-bold ${d.variance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                    {d.variance > 0 ? "+" : ""}{Number(d.variance).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400 font-bold">
                                  <span>Fulfillment Rate:</span>
                                  <span>{d.rate}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="planned" name="Planned Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual Good Yield" fill="#10b981" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="rate"
                          position="top"
                          formatter={(v: unknown) => `${v}%`}
                          style={{ fontSize: "10px", fontWeight: 700, fill: "currentColor" }}
                          className="text-foreground"
                        />
                      </Bar>
                      <Bar dataKey="rejected" name="Scrap / Rejected" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedJobs.map((j) => {
                  const isDone = j.status.includes("COMPLETE") || j.status === "CLOSED";
                  const isGood = j.fulfillmentRate >= 95;

                  return (
                    <div
                      key={j.jobOrderId}
                      className="p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:border-border/80 hover:bg-muted/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isDone ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"
                              }`}
                            />
                            <span className="font-bold text-foreground text-sm">
                              {j.jobOrderNo}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {j.productName} ({j.productCode})
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-black ${
                            isGood
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {j.fulfillmentRate}% Yield
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Planned
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {j.plannedQuantity.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Actual Yield
                          </span>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {j.actualGoodQuantity.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Scrap
                          </span>
                          <div className="text-xs font-black text-rose-500">
                            {j.rejectedQuantity.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Job Order &amp; Product</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Planned Target</th>
                        <th className="p-2.5 text-center">Actual Yield</th>
                        <th className="p-2.5 text-center">Scrap / Rejected</th>
                        <th className="p-2.5 text-center">Variance</th>
                        <th className="p-2.5 text-right">Fulfillment Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {displayedJobs.map((j) => {
                        const isDone = j.status.includes("COMPLETE") || j.status === "CLOSED";

                        return (
                          <tr key={j.jobOrderId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-2.5">
                              <div>
                                <div className="font-bold text-foreground">{j.jobOrderNo}</div>
                                <span className="text-[10px] text-muted-foreground">
                                  {j.productName} ({j.productCode})
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold ${
                                  isDone
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {j.status}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {j.plannedQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {j.actualGoodQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-2.5 text-center font-medium text-rose-500">
                              {j.rejectedQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td
                              className={`p-2.5 text-center font-bold font-mono ${
                                j.quantityVariance >= 0 ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {j.quantityVariance > 0 ? "+" : ""}
                              {j.quantityVariance.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-black text-cyan-600 dark:text-cyan-400">
                              {j.fulfillmentRate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

