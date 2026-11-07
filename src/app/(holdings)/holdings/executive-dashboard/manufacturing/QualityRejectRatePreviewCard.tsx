"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  FlaskConical,
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
import { fetchQualityRejectRate } from "@/modules/holdings/executive-dashboard/quality-reject-rate/providers/fetchProvider";
import type {
  QualityRejectRateKpis,
  ProductQualitySummary,
  BatchQualityInspection,
  DefectCategoryBreakdown,
  QualityDisposition,
} from "@/modules/holdings/executive-dashboard/quality-reject-rate/types";

export interface QualityRejectRatePreviewCardProps {
  group: { id: number; group_name: string;[key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

const DISPOSITION_BADGES: Record<QualityDisposition, string> = {
  APPROVED: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  REJECTED: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  CONDITIONAL_RELEASE: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  UNDER_QUARANTINE: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400",
};

export function QualityRejectRatePreviewCard({
  group,
  startDate,
  endDate,
}: QualityRejectRatePreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<QualityRejectRateKpis | null>(null);
  const [products, setProducts] = useState<ProductQualitySummary[]>([]);
  const [inspections, setInspections] = useState<BatchQualityInspection[]>([]);
  const [defectCategories, setDefectCategories] = useState<DefectCategoryBreakdown[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQualityRejectRate({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setProducts(res.products || []);
      setInspections(res.inspections || []);
      setDefectCategories(res.defectCategories || []);
    } catch (err: unknown) {
      console.warn(`[QualityRejectRatePreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load quality reject rate data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredInspections = useMemo(() => {
    if (!selectedCategory) return inspections;
    return inspections.filter((i) => i.defectCategory === selectedCategory);
  }, [inspections, selectedCategory]);

  const chartData = useMemo(() => {
    return products.slice(0, 7).map((p) => ({
      name: p.productCode || p.productName.slice(0, 10),
      fullName: p.productName,
      inspected: p.totalInspectedUnits,
      passed: p.totalPassedUnits,
      rejected: p.totalRejectedUnits,
      passRate: p.passRate,
      rejectRate: p.rejectRate,
      status: p.status,
    }));
  }, [products]);

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
                className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                QUALITY & REJECT RATE
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Quality & Reject Rate"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Batch QA inspection pass rates, defect classifications, COA releases, and quarantine monitoring
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/quality`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
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
              <span className="font-semibold">Failed to fetch quality reject rate data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Overall Pass Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Overall Pass Rate</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${kpis.isWithinTolerance ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                  >
                    {kpis.overallPassRate}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    passed
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${kpis.isWithinTolerance ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                  />
                  <span>Target: &le; {kpis.toleranceTarget}% reject cap</span>
                </div>
              </div>

              {/* Overall Reject Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Reject Rate</span>
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${kpis.isWithinTolerance ? "text-foreground" : "text-rose-600 dark:text-rose-400"
                      }`}
                  >
                    {kpis.overallRejectRate}%
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    vs {kpis.toleranceTarget}% max
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.totalRejectedUnits.toLocaleString()} units non-compliant</span>
                </div>
              </div>

              {/* Inspected Units */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inspected Volume</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalInspectedUnits.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.totalBatchesInspected} QA batch releases</span>
                </div>
              </div>

              {/* Quarantined Batches */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Quarantine Lots</span>
                  <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                    {kpis.batchesQuarantined}
                  </span>
                  <span className="text-[10px] font-bold text-purple-500">lots held</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Awaiting lab confirmation</span>
                </div>
              </div>

              {/* Top Defect Reason */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Primary Defect</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 truncate">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-foreground truncate block" title={kpis.primaryDefectReason}>
                    {kpis.primaryDefectReason}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-semibold truncate">
                  <span className="truncate" title={kpis.topRejectSku}>
                    Top reject: {kpis.topRejectSku} ({kpis.topRejectSkuRate}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap ${selectedCategory === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
              >
                All Defect Categories ({inspections.length})
              </button>
              {defectCategories.map((c) => (
                <button
                  key={c.category}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === c.category ? null : c.category)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${selectedCategory === c.category
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                    {c.rejectedUnits} units ({c.percentageOfTotalRejects}%)
                  </span>
                </button>
              ))}
            </div>

            {/* Main Views Container */}
            {viewMode === "chart" && (
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-foreground">Inspection Volume vs Quality Pass Rate % by Product</span>
                  <span className="text-[10px] text-muted-foreground">
                    SLA Target: &ge; 98.0% Pass Rate
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
                        domain={[95, 100]}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `${v}%`}
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
                          if (name === "Pass Rate (%)") return [`${val}%`, name];
                          if (name === "Passed Units" || name === "Rejected Units") return [`${Number(val).toLocaleString()}`, name];
                          return [val, name];
                        }}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="passed"
                        name="Passed Units"
                        fill="#0d9488"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="rejected"
                        name="Rejected Units"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={25}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="passRate"
                        name="Pass Rate (%)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.slice(0, 6).map((p) => (
                  <div
                    key={p.productId}
                    className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 hover:border-border/80 hover:bg-muted/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {p.productCode}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.rejectRate <= 2.0
                            ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400"
                            : "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400"
                          }`}
                      >
                        {p.passRate}% Passed
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1" title={p.productName}>
                        {p.productName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate" title={p.primaryDefect}>
                        Defect: {p.primaryDefect}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Inspected / Passed
                        </span>
                        <span className="font-bold text-foreground">
                          {p.totalPassedUnits.toLocaleString()} / {p.totalInspectedUnits.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Reject Rate
                        </span>
                        <span
                          className={`font-bold ${p.rejectRate <= 2.0 ? "text-emerald-500" : "text-rose-500"
                            }`}
                        >
                          {p.rejectRate}% ({p.totalRejectedUnits} units)
                        </span>
                      </div>
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
                      <th className="p-2.5">Product & Lot</th>
                      <th className="p-2.5">COA Reference</th>
                      <th className="p-2.5 text-right">Inspected</th>
                      <th className="p-2.5 text-right">Rejected</th>
                      <th className="p-2.5 text-right">Reject %</th>
                      <th className="p-2.5">Defect Description</th>
                      <th className="p-2.5 text-center">Disposition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredInspections.slice(0, 6).map((i) => (
                      <tr key={i.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-foreground">{i.jobOrderNo}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-foreground block truncate max-w-[170px]">
                            {i.productName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {i.lotNumber}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-muted-foreground">{i.coaReferenceNo}</td>
                        <td className="p-2.5 text-right font-medium text-foreground">
                          {i.inspectedQuantity.toLocaleString()} {i.uom}
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-500">
                          {i.rejectedQuantity.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              i.rejectRate <= 2.0 ? "text-emerald-500" : "text-amber-500"
                            }
                          >
                            {i.rejectRate}%
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground truncate max-w-[170px]" title={i.defectDescription}>
                          {i.defectDescription}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${DISPOSITION_BADGES[i.disposition]
                              }`}
                          >
                            {i.disposition.replace(/_/g, " ")}
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

