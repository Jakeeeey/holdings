"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Timer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Award,
  Clock,
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
  LabelList,
} from "recharts";
import { fetchIntercompanyPunctuality } from "@/modules/holdings/executive-dashboard/intercompany-punctuality/providers/fetchProvider";
import type {
  CompanyPunctualitySummary,
  IntercompanyPunctualityKpis,
} from "@/modules/holdings/executive-dashboard/intercompany-punctuality/types";

export interface IntercompanyPunctualityPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function IntercompanyPunctualityPreviewCard({
  group,
  startDate,
  endDate,
}: IntercompanyPunctualityPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyPunctualityKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyPunctualitySummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyPunctuality({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      console.warn(`[IntercompanyPunctualityPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load punctuality data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  // Chart data sorted from highest punctuality rate to lowest
  const chartData = useMemo(() => {
    return companySummaries
      .filter((c) => c.totalLogs > 0 || c.totalEmployees > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        punctualityRate: c.punctualityRate,
        onTimeCount: c.onTimeCount,
        gracePeriodCount: c.gracePeriodCount,
        lateCount: c.totalLateCount,
        undertimeCount: c.undertimeCount,
        totalLogs: c.totalLogs,
        avgDelayMinutes: c.avgDelayMinutes,
        employees: c.totalEmployees,
      }))
      .sort((a, b) => b.punctualityRate - a.punctualityRate);
  }, [companySummaries]);

  const activeCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return companySummaries.find((c) => c.companyId === selectedCompanyId) || null;
  }, [selectedCompanyId, companySummaries]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden hover:border-border/80 transition-all duration-300">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                HUMAN RESOURCE INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                INTERCOMPANY PUNCTUALITY
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Intercompany Punctuality"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Headcount on-time arrival rate, tardiness, and punctuality per operating company
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
            <Link href={`/holdings/executive-dashboard/hr/${group.id}/punctuality`}>
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
              <span className="font-semibold">Failed to fetch punctuality metrics:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Overall Punctuality Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Punctuality Rate</span>
                  <Timer className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.overallPunctualityRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Target ≥95%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>On-time + Grace period</span>
                </div>
              </div>

              {/* On-Time Arrivals */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">On-Time Clock-Ins</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {(kpis.onTimeCount + kpis.gracePeriodCount).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    / {kpis.totalPresentLogs.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Grace period: {kpis.gracePeriodCount}</span>
                </div>
              </div>

              {/* Tardiness / Late */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tardiness / Late</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalLateCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    ({kpis.totalPresentLogs > 0 ? ((kpis.totalLateCount / kpis.totalPresentLogs) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span>Avg Delay: {kpis.avgDelayMinutes} mins</span>
                </div>
              </div>

              {/* Undertime */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Undertime Logs</span>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.undertimeCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">shifts</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Early departures before 5PM</span>
                </div>
              </div>

              {/* Top Punctual Entity */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Punctual Entity</span>
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {kpis.topPunctualCompany}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{kpis.topPunctualRate.toFixed(1)}% Compliance</span>
                </div>
              </div>
            </div>

            {/* Quick Ledger Pill Row (Operating Companies) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Operating Entities Ledger ({companySummaries.length})
                </span>
                {selectedCompanyId && (
                  <button
                    onClick={() => setSelectedCompanyId(null)}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant={selectedCompanyId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompanyId(null)}
                  className={`h-7 px-3 text-xs font-bold rounded-lg shrink-0 ${
                    selectedCompanyId === null
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Entities
                </Button>
                {companySummaries.map((c) => {
                  const isSelected = selectedCompanyId === c.companyId;
                  const isHealthy = c.punctualityRate >= 95;
                  const isWarning = c.punctualityRate >= 90 && c.punctualityRate < 95;

                  return (
                    <Button
                      key={c.companyId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCompanyId(isSelected ? null : c.companyId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          c.status === "OFFLINE"
                            ? "bg-muted-foreground"
                            : isHealthy
                            ? "bg-emerald-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-semibold">{c.companyCode}</span>
                      <span className="text-[10px] opacity-75">{c.punctualityRate}%</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Company Focus Banner */}
            {activeCompany && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold text-foreground">{activeCompany.companyName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeCompany.companyCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Rate:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {activeCompany.punctualityRate}%
                    </strong>
                  </span>
                  <span>
                    On-Time: <strong>{activeCompany.onTimeCount}</strong>
                  </span>
                  <span>
                    Grace: <strong>{activeCompany.gracePeriodCount}</strong>
                  </span>
                  <span>
                    Late: <strong>{activeCompany.totalLateCount}</strong>
                  </span>
                  <span>
                    Avg Delay: <strong>{activeCompany.avgDelayMinutes}m</strong>
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
                      Punctuality Rate (% Compliance)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Sorted by % Compliance
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Target baseline: <strong className="text-emerald-500">95.0%</strong>
                  </span>
                </div>

                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: 48, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="currentColor"
                        className="text-border/40"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        dataKey="code"
                        type="category"
                        tick={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
                        className="text-foreground"
                        axisLine={false}
                        tickLine={false}
                        width={50}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                                <div className="font-bold text-foreground flex items-center justify-between border-b border-border/40 pb-1">
                                  <span>{d.fullName}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {d.code}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                  <span>Punctuality Rate:</span>
                                  <span>{d.punctualityRate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>On-Time Clock-Ins:</span>
                                  <span className="font-semibold text-foreground">{d.onTimeCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Grace Period:</span>
                                  <span className="font-semibold text-foreground">{d.gracePeriodCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Tardiness / Late:</span>
                                  <span className="font-semibold text-amber-500">{d.lateCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Undertime:</span>
                                  <span className="font-semibold text-rose-500">{d.undertimeCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground border-t border-border/40 pt-1">
                                  <span>Avg Delay:</span>
                                  <span className="font-semibold text-foreground">{d.avgDelayMinutes} mins</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="punctualityRate"
                        name="Punctuality Rate"
                        fill="#10b981"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        <LabelList
                          dataKey="punctualityRate"
                          position="right"
                          formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            fill: "currentColor",
                          }}
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
                {companySummaries.map((c) => {
                  const isHealthy = c.punctualityRate >= 95;
                  const isWarning = c.punctualityRate >= 90 && c.punctualityRate < 95;

                  return (
                    <div
                      key={c.companyId}
                      onClick={() =>
                        setSelectedCompanyId(
                          selectedCompanyId === c.companyId ? null : c.companyId
                        )
                      }
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedCompanyId === c.companyId
                          ? "border-emerald-500 bg-emerald-500/10 shadow-md"
                          : "border-border/40 bg-muted/10 hover:border-border/80 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                c.status === "OFFLINE"
                                  ? "bg-muted-foreground"
                                  : isHealthy
                                  ? "bg-emerald-500"
                                  : isWarning
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            <span className="font-bold text-foreground text-sm">
                              {c.companyName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {c.companyCode} · {c.totalEmployees} Employees
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-black ${
                            isHealthy
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : isWarning
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {c.punctualityRate.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            On-Time
                          </span>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {c.onTimeCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Grace
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {c.gracePeriodCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Late / Delay
                          </span>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {c.totalLateCount} ({c.avgDelayMinutes}m)
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
                        <th className="p-2.5">Operating Entity</th>
                        <th className="p-2.5 text-center">Headcount</th>
                        <th className="p-2.5 text-center">Total Logs</th>
                        <th className="p-2.5 text-center">On-Time</th>
                        <th className="p-2.5 text-center">Grace Period</th>
                        <th className="p-2.5 text-center">Late</th>
                        <th className="p-2.5 text-center">Undertime</th>
                        <th className="p-2.5 text-center">Avg Delay</th>
                        <th className="p-2.5 text-right">Punctuality Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {companySummaries.map((c) => {
                        const isHealthy = c.punctualityRate >= 95;
                        const isWarning = c.punctualityRate >= 90 && c.punctualityRate < 95;

                        return (
                          <tr
                            key={c.companyId}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    c.status === "OFFLINE"
                                      ? "bg-muted-foreground"
                                      : isHealthy
                                      ? "bg-emerald-500"
                                      : isWarning
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                />
                                <span>{c.companyName}</span>
                                <Badge variant="outline" className="text-[9px] py-0 px-1">
                                  {c.companyCode}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-medium text-muted-foreground">
                              {c.totalEmployees}
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {c.totalLogs}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.onTimeCount}
                            </td>
                            <td className="p-2.5 text-center font-medium text-muted-foreground">
                              {c.gracePeriodCount}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-amber-600 dark:text-amber-400">
                              {c.totalLateCount}
                            </td>
                            <td className="p-2.5 text-center font-medium text-rose-500">
                              {c.undertimeCount}
                            </td>
                            <td className="p-2.5 text-center font-mono text-muted-foreground">
                              {c.avgDelayMinutes} mins
                            </td>
                            <td className="p-2.5 text-right">
                              <span
                                className={`font-black ${
                                  isHealthy
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : isWarning
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {c.punctualityRate.toFixed(1)}%
                              </span>
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

