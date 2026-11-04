"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trash2,
  AlertTriangle,
  Flame,
  Coins,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  TrendingDown,
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
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { fetchProductionWastage } from "@/modules/holdings/executive-dashboard/production-wastage/providers/fetchProvider";
import type {
  ProductionWastageKpis,
  ProductionWastageJobOrder,
  ProductWastageSummary,
  WastageReasonBreakdown,
} from "@/modules/holdings/executive-dashboard/production-wastage/types";

export interface ProductionWastagePreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

const SEVERITY_COLORS = {
  CRITICAL: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  HIGH: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  MODERATE: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400",
  LOW: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
};

export function ProductionWastagePreviewCard({
  group,
  startDate,
  endDate,
}: ProductionWastagePreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionWastageKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<ProductionWastageJobOrder[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductWastageSummary[]>([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<WastageReasonBreakdown[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedReasonCode, setSelectedReasonCode] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionWastage({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setProductSummaries(res.productSummaries || []);
      setReasonBreakdown(res.reasonBreakdown || []);
    } catch (err: unknown) {
      console.warn(`[ProductionWastagePreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load production wastage data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredJobOrders = useMemo(() => {
    if (!selectedReasonCode) return jobOrders;
    return jobOrders.filter((jo) => jo.reasonCode === selectedReasonCode);
  }, [jobOrders, selectedReasonCode]);

  const chartData = useMemo(() => {
    const list = selectedReasonCode
      ? productSummaries.filter((p) =>
          filteredJobOrders.some((jo) => jo.productId === p.productId)
        )
      : productSummaries;

    return list.slice(0, 6).map((p) => ({
      name: p.productCode || p.productName.slice(0, 10),
      fullName: p.productName,
      loss: p.totalCostLoss,
      qty: p.totalWastedQty,
      rate: p.wastageRate,
      uom: p.uom,
      severity: p.severity,
    }));
  }, [productSummaries, filteredJobOrders, selectedReasonCode]);

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
                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                PRODUCTION WASTAGE
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Production Wastage & Scrap"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Defect rates, scrap loss valuations, vendor chargebacks, and line yield scrap analysis
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/wastage`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
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
              <span className="font-semibold">Failed to fetch production wastage data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Overall Wastage Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Wastage Rate</span>
                  {kpis.withinTolerance ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      kpis.withinTolerance
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.overallWastageRate}%
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    vs {kpis.toleranceThreshold}% cap
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.withinTolerance ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.withinTolerance ? "Within tolerance" : "Action required"}</span>
                </div>
              </div>

              {/* Total Scrap Valuation Loss */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scrap Value Loss</span>
                  <Coins className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    ₱{Math.round(kpis.totalFinancialLoss).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                  <span>₱{Math.round(kpis.vendorChargeableLoss).toLocaleString()} vendor recoverable</span>
                </div>
              </div>

              {/* Total Wastage Units */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scrap Quantity</span>
                  <Trash2 className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalWastageUnits.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span>Across {kpis.totalIncidents} job order runs</span>
                </div>
              </div>

              {/* Top Scrap Product */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Scrap Product</span>
                  <Flame className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 truncate">
                  <span className="text-sm sm:text-base font-black tracking-tight text-foreground truncate block">
                    {kpis.topWastageProduct}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                  <span>₱{Math.round(kpis.topWastageProductLoss).toLocaleString()} scrap value</span>
                </div>
              </div>

              {/* Primary Defect Cause */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Primary Defect</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <div className="mt-1 truncate">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-foreground truncate block" title={kpis.primaryScrapReason}>
                    {kpis.primaryScrapReason}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.primaryScrapReasonCount} incidents recorded</span>
                </div>
              </div>
            </div>

            {/* Quick Filter Reason Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedReasonCode(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap ${
                  selectedReasonCode === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                All Reasons ({reasonBreakdown.length})
              </button>
              {reasonBreakdown.map((r) => (
                <button
                  key={r.reasonCode}
                  onClick={() =>
                    setSelectedReasonCode(selectedReasonCode === r.reasonCode ? null : r.reasonCode)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    selectedReasonCode === r.reasonCode
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{r.reasonLabel}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                    ₱{Math.round(r.totalLossAmount).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            {/* Main Views Container */}
            {viewMode === "chart" && (
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-foreground">Scrap Financial Loss vs Quantity by Product</span>
                  <span className="text-[10px] text-muted-foreground">
                    Tolerance benchmark: &le; 2.0% of total input
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
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `${v}`}
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
                          if (name === "Financial Loss (₱)") return [`₱${Number(val).toLocaleString()}`, name];
                          if (name === "Scrap Units") return [`${Number(val).toLocaleString()}`, name];
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
                        dataKey="loss"
                        name="Financial Loss (₱)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.severity === "CRITICAL" || entry.severity === "HIGH" ? "#f43f5e" : "#fbbf24"}
                          />
                        ))}
                      </Bar>
                      <Bar
                        yAxisId="right"
                        dataKey="qty"
                        name="Scrap Units"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                        opacity={0.7}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredJobOrders.slice(0, 6).map((jo) => (
                  <div
                    key={jo.id}
                    className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 hover:border-border/80 hover:bg-muted/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {jo.jobOrderNo}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          SEVERITY_COLORS[jo.severity]
                        }`}
                      >
                        {jo.wastageRate}% Wastage
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {jo.productName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Line: {jo.workCenterName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Scrap Quantity
                        </span>
                        <span className="font-bold text-foreground">
                          {jo.wastageQty.toLocaleString()} {jo.uom}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Cost Impact
                        </span>
                        <span className="font-bold text-rose-500">
                          ₱{Math.round(jo.totalCostLoss).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground truncate" title={jo.reasonLabel}>
                        {jo.reasonLabel}
                      </span>
                      {jo.isChargeableToVendor && (
                        <span className="text-emerald-500 font-bold shrink-0">
                          Vendor Chargeable
                        </span>
                      )}
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
                      <th className="p-2.5">Job Order</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Line / Work Center</th>
                      <th className="p-2.5 text-right">Scrap Qty</th>
                      <th className="p-2.5 text-right">Wastage %</th>
                      <th className="p-2.5 text-right">Financial Loss</th>
                      <th className="p-2.5">Primary Defect Cause</th>
                      <th className="p-2.5 text-center">Chargeback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredJobOrders.slice(0, 6).map((jo) => (
                      <tr key={jo.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-foreground">{jo.jobOrderNo}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-foreground block truncate max-w-[150px]">
                            {jo.productName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {jo.batchNo}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground truncate max-w-[140px]">
                          {jo.workCenterName}
                        </td>
                        <td className="p-2.5 text-right font-medium text-foreground">
                          {jo.wastageQty.toLocaleString()} {jo.uom}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              jo.wastageRate > 2.0
                                ? "text-rose-500"
                                : jo.wastageRate > 1.5
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }
                          >
                            {jo.wastageRate}%
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-500">
                          ₱{Math.round(jo.totalCostLoss).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-muted-foreground truncate max-w-[160px]" title={jo.reasonLabel}>
                          {jo.reasonLabel}
                        </td>
                        <td className="p-2.5 text-center">
                          {jo.isChargeableToVendor ? (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">
                              Vendor
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Internal</span>
                          )}
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

