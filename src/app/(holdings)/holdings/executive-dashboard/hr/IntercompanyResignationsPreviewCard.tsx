"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  UserMinus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Clock,
  HelpCircle,
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
import { fetchIntercompanyResignations } from "@/modules/holdings/executive-dashboard/intercompany-resignations/providers/fetchProvider";
import type {
  CompanyResignationSummary,
  IntercompanyResignationKpis,
} from "@/modules/holdings/executive-dashboard/intercompany-resignations/types";

export interface IntercompanyResignationsPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function IntercompanyResignationsPreviewCard({
  group,
  startDate,
  endDate,
}: IntercompanyResignationsPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyResignationKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyResignationSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyResignations({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      console.warn(`[IntercompanyResignationsPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load resignation data";
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
    return companySummaries
      .filter((c) => c.totalEmployees > 0 || c.totalResignations > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        totalResignations: c.totalResignations,
        turnoverRate: c.turnoverRate,
        pendingCount: c.pendingCount,
        approvedCount: c.approvedCount,
        avgNoticeDays: c.avgNoticeDays,
        complianceRate: c.complianceRate,
        totalEmployees: c.totalEmployees,
      }))
      .sort((a, b) => b.totalResignations - a.totalResignations);
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
                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                INTERCOMPANY RESIGNATIONS
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Intercompany Resignations"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Turnover rate, resignation requests, notice compliance, and reason distribution across operating companies
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
            <Link href={`/holdings/executive-dashboard/hr/${group.id}/resignations`}>
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
              <span className="font-semibold">Failed to fetch resignation data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Resignations */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Resignations</span>
                  <UserMinus className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalResignations.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">exits</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.approvedCount} approved · {kpis.pendingCount} pending</span>
                </div>
              </div>

              {/* Group Turnover Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Group Turnover</span>
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    {kpis.turnoverRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Bench &lt;3.0%
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Annualized workforce attrition</span>
                </div>
              </div>

              {/* Notice Compliance */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Notice Compliance</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.complianceRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ≥30 days
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Avg notice: {kpis.avgNoticeDays} days</span>
                </div>
              </div>

              {/* Pending Action */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pending Action</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.pendingCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    in-review
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Awaiting HR / clearance</span>
                </div>
              </div>

              {/* Top Exit Reason */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Exit Reason</span>
                  <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {kpis.topResignationReason}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                  <span>Highest Turnover: {kpis.highestTurnoverCompany}</span>
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
                    className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
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
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Entities
                </Button>
                {companySummaries.map((c) => {
                  const isSelected = selectedCompanyId === c.companyId;
                  const isLowAttrition = c.turnoverRate <= 2.0;
                  const isModerate = c.turnoverRate > 2.0 && c.turnoverRate <= 4.0;

                  return (
                    <Button
                      key={c.companyId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCompanyId(isSelected ? null : c.companyId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          c.status === "OFFLINE"
                            ? "bg-muted-foreground"
                            : isLowAttrition
                            ? "bg-emerald-500"
                            : isModerate
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-semibold">{c.companyCode}</span>
                      <span className="text-[10px] opacity-75">{c.totalResignations} ({c.turnoverRate}%)</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Company Focus Banner */}
            {activeCompany && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-rose-500" />
                  <span className="font-bold text-foreground">{activeCompany.companyName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeCompany.companyCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Resignations: <strong className="text-foreground">{activeCompany.totalResignations}</strong>
                  </span>
                  <span>
                    Turnover:{" "}
                    <strong className="text-rose-600 dark:text-rose-400">
                      {activeCompany.turnoverRate}%
                    </strong>
                  </span>
                  <span>
                    Pending: <strong>{activeCompany.pendingCount}</strong>
                  </span>
                  <span>
                    Approved: <strong>{activeCompany.approvedCount}</strong>
                  </span>
                  <span>
                    Compliance: <strong>{activeCompany.complianceRate}%</strong>
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
                      Total Resignations by Operating Entity
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Sorted by Volume
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Benchmark turnover: <strong className="text-rose-500">&lt;3.0%</strong>
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
                                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold">
                                  <span>Total Resignations:</span>
                                  <span>{d.totalResignations}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Turnover Rate:</span>
                                  <span className="font-semibold text-foreground">{d.turnoverRate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Pending Clearance:</span>
                                  <span className="font-semibold text-amber-500">{d.pendingCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Approved:</span>
                                  <span className="font-semibold text-foreground">{d.approvedCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground border-t border-border/40 pt-1">
                                  <span>Notice Compliance:</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {d.complianceRate}% ({d.avgNoticeDays}d avg)
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="totalResignations"
                        name="Resignations"
                        fill="#f43f5e"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        <LabelList
                          dataKey="totalResignations"
                          position="right"
                          formatter={(v: unknown) => `${v} exits`}
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
                  const isLowAttrition = c.turnoverRate <= 2.0;
                  const isModerate = c.turnoverRate > 2.0 && c.turnoverRate <= 4.0;

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
                          ? "border-rose-500 bg-rose-500/10 shadow-md"
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
                                  : isLowAttrition
                                  ? "bg-emerald-500"
                                  : isModerate
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
                          className="text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        >
                          {c.totalResignations} Exits
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Turnover
                          </span>
                          <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                            {c.turnoverRate}%
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Pending
                          </span>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {c.pendingCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Notice Days
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {c.avgNoticeDays}d ({c.complianceRate}%)
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
                        <th className="p-2.5 text-center">Total Resignations</th>
                        <th className="p-2.5 text-center">Pending</th>
                        <th className="p-2.5 text-center">Approved</th>
                        <th className="p-2.5 text-center">Avg Notice</th>
                        <th className="p-2.5 text-center">Notice Compliance</th>
                        <th className="p-2.5 text-right">Turnover Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {companySummaries.map((c) => {
                        return (
                          <tr
                            key={c.companyId}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span>{c.companyName}</span>
                                <Badge variant="outline" className="text-[9px] py-0 px-1">
                                  {c.companyCode}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-medium text-muted-foreground">
                              {c.totalEmployees}
                            </td>
                            <td className="p-2.5 text-center font-bold text-rose-600 dark:text-rose-400">
                              {c.totalResignations}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-amber-500">
                              {c.pendingCount}
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {c.approvedCount}
                            </td>
                            <td className="p-2.5 text-center font-mono text-muted-foreground">
                              {c.avgNoticeDays} days
                            </td>
                            <td className="p-2.5 text-center font-mono text-emerald-600 dark:text-emerald-400">
                              {c.complianceRate}%
                            </td>
                            <td className="p-2.5 text-right font-black text-rose-600 dark:text-rose-400">
                              {c.turnoverRate.toFixed(1)}%
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

