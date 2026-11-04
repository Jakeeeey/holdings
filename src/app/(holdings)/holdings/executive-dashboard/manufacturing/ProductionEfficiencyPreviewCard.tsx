"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  Layers,
  Gauge,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Cpu,
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
import { fetchProductionEfficiency } from "@/modules/holdings/executive-dashboard/production-efficiency/providers/fetchProvider";
import type {
  ProductionEfficiencyKpis,
  WorkCenterEfficiencySummary,
  JobOrderEfficiencyItem,
} from "@/modules/holdings/executive-dashboard/production-efficiency/types";

export interface ProductionEfficiencyPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function ProductionEfficiencyPreviewCard({
  group,
  startDate,
  endDate,
}: ProductionEfficiencyPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionEfficiencyKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<JobOrderEfficiencyItem[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenterEfficiencySummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionEfficiency({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setWorkCenters(res.workCenters || []);
    } catch (err: unknown) {
      console.warn(`[ProductionEfficiencyPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load efficiency data";
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
    const list = selectedWorkCenterId
      ? jobOrders.filter((j) => {
          const matched = workCenters.find((w) => w.workCenterId === selectedWorkCenterId);
          return matched && j.workCenterName === matched.workCenterName;
        })
      : workCenters;

    if (selectedWorkCenterId) {
      return (list as JobOrderEfficiencyItem[]).map((j) => ({
        name: j.jobOrderNo,
        fullName: `${j.jobOrderNo} (${j.productName})`,
        standard: j.standardHours,
        actual: j.actualHours,
        variance: j.varianceHours,
        efficiency: j.efficiencyPercent,
        throughput: j.productivity,
      }));
    }

    return (list as WorkCenterEfficiencySummary[]).map((w) => ({
      name: w.workCenterName.length > 14 ? `${w.workCenterName.slice(0, 12)}...` : w.workCenterName,
      fullName: w.workCenterName,
      standard: w.standardHours,
      actual: w.actualHours,
      variance: w.varianceHours,
      efficiency: w.efficiencyPercent,
      throughput: w.averageProductivity,
    }));
  }, [workCenters, jobOrders, selectedWorkCenterId]);

  const activeWorkCenter = useMemo(() => {
    if (!selectedWorkCenterId) return null;
    return workCenters.find((w) => w.workCenterId === selectedWorkCenterId) || null;
  }, [selectedWorkCenterId, workCenters]);

  const displayedJobs = useMemo(() => {
    if (!selectedWorkCenterId) return jobOrders;
    const matched = workCenters.find((w) => w.workCenterId === selectedWorkCenterId);
    return matched ? jobOrders.filter((j) => j.workCenterName === matched.workCenterName) : jobOrders;
  }, [jobOrders, selectedWorkCenterId, workCenters]);

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
                PRODUCTION EFFICIENCY
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Production Efficiency"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Standard vs actual labor hours, station throughput, productivity, and OEE performance
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/efficiency`}>
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
              <span className="font-semibold">Failed to fetch production efficiency data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Overall Efficiency % */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Overall Efficiency</span>
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.overallEfficiencyPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    OEE index
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.activeWorkCentersCount} work stations</span>
                </div>
              </div>

              {/* Standard Hours Earned */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Standard Allowed</span>
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalStandardHours.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    hrs
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Earned from good output</span>
                </div>
              </div>

              {/* Actual Hours Logged */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Actual Logged</span>
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalActualHours.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    hrs
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Shop-floor direct labor runtime</span>
                </div>
              </div>

              {/* Labor Hour Variance */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hour Variance</span>
                  {kpis.netVarianceHours >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      kpis.netVarianceHours >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.netVarianceHours > 0 ? "+" : ""}
                    {kpis.netVarianceHours} hrs
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {kpis.netVarianceHours >= 0 ? "saved" : "overtime"}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Labor efficiency delta</span>
                </div>
              </div>

              {/* Throughput Productivity */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Throughput</span>
                  <Gauge className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                    {kpis.averageThroughput}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    units / hr
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                  <span>Top: {kpis.topPerformingWorkCenter.slice(0, 15)}... ({kpis.topPerformingEfficiency}%)</span>
                </div>
              </div>
            </div>

            {/* Quick Ledger Pill Row (Work Centers) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Work Stations &amp; Production Lines ({workCenters.length})
                </span>
                {selectedWorkCenterId && (
                  <button
                    onClick={() => setSelectedWorkCenterId(null)}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant={selectedWorkCenterId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWorkCenterId(null)}
                  className={`h-7 px-3 text-xs font-bold rounded-lg shrink-0 ${
                    selectedWorkCenterId === null
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Work Centers
                </Button>
                {workCenters.map((w) => {
                  const isSelected = selectedWorkCenterId === w.workCenterId;
                  const isGreat = w.efficiencyPercent >= 100;
                  const isGood = w.efficiencyPercent >= 95;

                  return (
                    <Button
                      key={w.workCenterId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedWorkCenterId(isSelected ? null : w.workCenterId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          isGreat
                            ? "bg-emerald-500"
                            : isGood
                            ? "bg-cyan-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="font-semibold">{w.workCenterName}</span>
                      <span className="text-[10px] opacity-75">{w.efficiencyPercent}%</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Work Center Focus Banner */}
            {activeWorkCenter && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold text-foreground">{activeWorkCenter.workCenterName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeWorkCenter.jobCount} Jobs
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Standard: <strong className="text-foreground">{activeWorkCenter.standardHours} hrs</strong>
                  </span>
                  <span>
                    Actual: <strong className="text-foreground">{activeWorkCenter.actualHours} hrs</strong>
                  </span>
                  <span>
                    Variance: <strong className={activeWorkCenter.varianceHours >= 0 ? "text-emerald-500" : "text-amber-500"}>{activeWorkCenter.varianceHours > 0 ? "+" : ""}{activeWorkCenter.varianceHours} hrs</strong>
                  </span>
                  <span>
                    Efficiency: <strong className="text-emerald-600 dark:text-emerald-400">{activeWorkCenter.efficiencyPercent}%</strong>
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
                      {selectedWorkCenterId ? "Job Orders Execution for Selected Station" : "Standard vs Actual Labor Hours by Work Center"}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Hours (h)
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Target Efficiency: <strong className="text-emerald-600 dark:text-emerald-400">&gt;95% Target</strong>
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
                                  <span>Standard Allowed:</span>
                                  <span className="font-semibold">{d.standard} hrs</span>
                                </div>
                                <div className="flex justify-between items-center text-indigo-500 font-bold">
                                  <span>Actual Logged:</span>
                                  <span>{d.actual} hrs</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground border-t border-border/40 pt-1">
                                  <span>Hour Variance:</span>
                                  <span className={`font-bold ${d.variance >= 0 ? "text-emerald-500" : "text-amber-500"}`}>
                                    {d.variance > 0 ? "+" : ""}{d.variance} hrs
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                  <span>Labor Efficiency:</span>
                                  <span>{d.efficiency}%</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-500">
                                  <span>Productivity:</span>
                                  <span>{d.throughput} units/hr</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="standard" name="Standard Allowed (hrs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual Logged (hrs)" fill="#10b981" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="efficiency"
                          position="top"
                          formatter={(v: unknown) => `${v}%`}
                          style={{ fontSize: "10px", fontWeight: 700, fill: "currentColor" }}
                          className="text-foreground"
                        />
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedJobs.map((j) => {
                  const isDone = j.status === "COMPLETED";
                  const isGreat = j.efficiencyPercent >= 100;

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
                            {j.workCenterName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-black ${
                            isGreat
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {j.efficiencyPercent}% Eff
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Standard
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {j.standardHours}h
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Actual
                          </span>
                          <div className="text-xs font-black text-indigo-500">
                            {j.actualHours}h
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Throughput
                          </span>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {j.productivity}/h
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
                        <th className="p-2.5">Work Station</th>
                        <th className="p-2.5 text-center">Output</th>
                        <th className="p-2.5 text-center">Standard (hrs)</th>
                        <th className="p-2.5 text-center">Actual (hrs)</th>
                        <th className="p-2.5 text-center">Variance (hrs)</th>
                        <th className="p-2.5 text-center">Throughput</th>
                        <th className="p-2.5 text-right">Efficiency %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {displayedJobs.map((j) => {
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
                            <td className="p-2.5 font-medium text-foreground">
                              {j.workCenterName}
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {j.goodOutputQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-2.5 text-center font-medium text-blue-500">
                              {j.standardHours}h
                            </td>
                            <td className="p-2.5 text-center font-medium text-indigo-500">
                              {j.actualHours}h
                            </td>
                            <td
                              className={`p-2.5 text-center font-bold font-mono ${
                                j.varianceHours >= 0 ? "text-emerald-500" : "text-amber-500"
                              }`}
                            >
                              {j.varianceHours > 0 ? "+" : ""}
                              {j.varianceHours}h
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {j.productivity} {j.uom}/h
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                              {j.efficiencyPercent}%
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

