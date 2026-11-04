"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  UserX,
  Building2,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Award,
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
import { fetchIntercompanyConcerns } from "@/modules/holdings/executive-dashboard/intercompany-concerns/providers/fetchProvider";
import type {
  CompanyConcernsSummary,
  IntercompanyConcernsKpis,
} from "@/modules/holdings/executive-dashboard/intercompany-concerns/types";

export interface IntercompanyConcernsPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function IntercompanyConcernsPreviewCard({
  group,
  startDate,
  endDate,
}: IntercompanyConcernsPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyConcernsKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyConcernsSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyConcerns({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      console.warn(`[IntercompanyConcernsPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load concerns data";
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
      .filter((c) => c.totalConcerns > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        totalConcerns: c.totalConcerns,
        resolvedCount: c.resolvedCount + c.closedCount,
        pendingCount: c.pendingCount,
        inReviewCount: c.inReviewCount,
        anonymousCount: c.anonymousCount,
        resolutionRate: c.resolutionRate,
      }))
      .sort((a, b) => b.totalConcerns - a.totalConcerns);
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
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                INTERCOMPANY CONCERNS
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Intercompany Concerns"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Grievances, resolution rate, ticket backlog, and anonymous reporting across operating entities
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
            <Link href={`/holdings/executive-dashboard/hr/${group.id}/concerns`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
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
              <span className="font-semibold">Failed to fetch concerns data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Concerns */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Concerns</span>
                  <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalConcerns.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    tickets
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {companySummaries.length} operating entities</span>
                </div>
              </div>

              {/* Resolution Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Resolution Rate</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.resolutionRate}%
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    closed
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>{kpis.resolvedCount + kpis.closedCount} resolved / closed</span>
                </div>
              </div>

              {/* Pending Action */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pending Action</span>
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    {kpis.pendingCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500">
                    unassigned
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Requires HR intervention</span>
                </div>
              </div>

              {/* In Review */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">In Review</span>
                  <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-sky-600 dark:text-sky-400">
                    {kpis.inReviewCount}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    cases active
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Under investigation / mediation</span>
                </div>
              </div>

              {/* Anonymous Reports */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Anonymous Tickets</span>
                  <UserX className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                    {kpis.anonymousCount}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-500">
                    ({kpis.anonymousPercentage}%)
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                  <Award className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="truncate">Top: {kpis.topConcernCategory}</span>
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
                    className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
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
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Entities
                </Button>
                {companySummaries.map((c) => {
                  const isSelected = selectedCompanyId === c.companyId;
                  const isGood = c.resolutionRate >= 80;
                  const isModerate = c.resolutionRate >= 60;

                  return (
                    <Button
                      key={c.companyId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCompanyId(isSelected ? null : c.companyId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          c.status === "OFFLINE"
                            ? "bg-muted-foreground"
                            : isGood
                            ? "bg-emerald-500"
                            : isModerate
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-semibold">{c.companyCode}</span>
                      <span className="text-[10px] opacity-75">{c.totalConcerns} tickets</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Company Focus Banner */}
            {activeCompany && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-foreground">{activeCompany.companyName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeCompany.companyCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Total: <strong className="text-amber-600 dark:text-amber-400">{activeCompany.totalConcerns}</strong>
                  </span>
                  <span>
                    Resolved: <strong className="text-emerald-600 dark:text-emerald-400">{activeCompany.resolvedCount + activeCompany.closedCount}</strong>
                  </span>
                  <span>
                    Pending: <strong className="text-rose-500">{activeCompany.pendingCount}</strong>
                  </span>
                  <span>
                    Rate: <strong>{activeCompany.resolutionRate}%</strong>
                  </span>
                  <span>
                    Anon: <strong>{activeCompany.anonymousCount}</strong>
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
                      Employee Concerns Volume &amp; Resolution by Entity
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Sorted by Ticket Volume
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Target Resolution: <strong className="text-emerald-600 dark:text-emerald-400">&gt;80% target</strong>
                  </span>
                </div>

                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: 60, left: 20, bottom: 5 }}
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
                                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-bold">
                                  <span>Total Concerns:</span>
                                  <span>{d.totalConcerns} tickets</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                  <span>Resolved / Closed:</span>
                                  <span className="font-semibold">{d.resolvedCount} ({d.resolutionRate}%)</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-500">
                                  <span>Pending:</span>
                                  <span className="font-semibold">{d.pendingCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sky-500">
                                  <span>In Review:</span>
                                  <span className="font-semibold">{d.inReviewCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-purple-500 border-t border-border/40 pt-1">
                                  <span>Anonymous:</span>
                                  <span className="font-semibold">{d.anonymousCount}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="totalConcerns"
                        name="Total Concerns"
                        fill="#f59e0b"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        <LabelList
                          dataKey="totalConcerns"
                          position="right"
                          formatter={(v: unknown) => `${v} tickets`}
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
                  const isGood = c.resolutionRate >= 80;
                  const isModerate = c.resolutionRate >= 60;

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
                          ? "border-amber-500 bg-amber-500/10 shadow-md"
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
                                  : isGood
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
                            {c.companyCode} · {c.anonymousCount} Anonymous
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        >
                          {c.totalConcerns} Tickets
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Resolved
                          </span>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {c.resolvedCount + c.closedCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Pending
                          </span>
                          <div className="text-xs font-black text-rose-500">
                            {c.pendingCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Resolution
                          </span>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {c.resolutionRate}%
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
                        <th className="p-2.5 text-center">Pending</th>
                        <th className="p-2.5 text-center">In Review</th>
                        <th className="p-2.5 text-center">Resolved / Closed</th>
                        <th className="p-2.5 text-center">Anonymous</th>
                        <th className="p-2.5 text-center">Resolution Rate</th>
                        <th className="p-2.5 text-right">Total Concerns</th>
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
                            <td className="p-2.5 text-center font-bold text-rose-500">
                              {c.pendingCount}
                            </td>
                            <td className="p-2.5 text-center font-medium text-sky-600 dark:text-sky-400">
                              {c.inReviewCount}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.resolvedCount + c.closedCount}
                            </td>
                            <td className="p-2.5 text-center font-medium text-purple-600 dark:text-purple-400">
                              {c.anonymousCount}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-foreground">
                              {c.resolutionRate}%
                            </td>
                            <td className="p-2.5 text-right font-black text-amber-600 dark:text-amber-400">
                              {c.totalConcerns}
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

