"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  AlertTriangle,
  Building2,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
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
  LabelList,
} from "recharts";
import { fetchIntercompanyVacancies } from "@/modules/holdings/executive-dashboard/intercompany-vacancies/providers/fetchProvider";
import type {
  CompanyVacanciesSummary,
  IntercompanyVacanciesKpis,
} from "@/modules/holdings/executive-dashboard/intercompany-vacancies/types";

export interface IntercompanyVacanciesPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function IntercompanyVacanciesPreviewCard({
  group,
  startDate,
  endDate,
}: IntercompanyVacanciesPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyVacanciesKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyVacanciesSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyVacancies({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      console.warn(`[IntercompanyVacanciesPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load vacancies data";
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
      .filter((c) => c.openVacancies > 0 || c.totalNeeded > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        openVacancies: c.openVacancies,
        totalNeeded: c.totalNeeded,
        hiredCount: c.hiredCount,
        activeRequisitions: c.activeRequisitions,
        criticalCount: c.criticalCount,
        avgAgingDays: c.avgAgingDays,
      }))
      .sort((a, b) => b.openVacancies - a.openVacancies);
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
                className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                INTERCOMPANY VACANCIES
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Intercompany Vacancies"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Open headcount requisitions, role urgency, aging days, and hiring fulfillment across operating entities
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
            <Link href={`/holdings/executive-dashboard/hr/${group.id}/vacancies`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
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
              <span className="font-semibold">Failed to fetch vacancies data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Open Vacancies */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Open Vacancies</span>
                  <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalOpenVacancies.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    positions
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {companySummaries.length} operating entities</span>
                </div>
              </div>

              {/* Active Requisitions */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Requisitions</span>
                  <Layers className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-violet-600 dark:text-violet-400">
                    {kpis.totalRequisitions.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    requests
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>{kpis.newPositionRoles} New · {kpis.replacementRoles} Replacement</span>
                </div>
              </div>

              {/* Critical Aging Roles */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Critical Aging</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    {kpis.criticalRolesCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500">
                    &gt;45 days
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Avg Aging: {kpis.avgAgingDays} days</span>
                </div>
              </div>

              {/* Average Time to Fill */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Open Days</span>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.avgAgingDays}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    days active
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Pipeline velocity indicator</span>
                </div>
              </div>

              {/* Top Vacancies Entity */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Vacancy Load</span>
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {kpis.topVacanciesCompany}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-semibold truncate">
                  <span>{kpis.topVacanciesCount} open headcount positions</span>
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
                    className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
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
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Entities
                </Button>
                {companySummaries.map((c) => {
                  const isSelected = selectedCompanyId === c.companyId;
                  const isCritical = c.criticalCount > 0;
                  const isHeavy = c.openVacancies >= 8;

                  return (
                    <Button
                      key={c.companyId}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCompanyId(isSelected ? null : c.companyId)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-violet-600 hover:bg-violet-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          c.status === "OFFLINE"
                            ? "bg-muted-foreground"
                            : isCritical
                            ? "bg-rose-500"
                            : isHeavy
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-semibold">{c.companyCode}</span>
                      <span className="text-[10px] opacity-75">{c.openVacancies} open</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Company Focus Banner */}
            {activeCompany && (
              <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-violet-500" />
                  <span className="font-bold text-foreground">{activeCompany.companyName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeCompany.companyCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Open Vacancies:{" "}
                    <strong className="text-violet-600 dark:text-violet-400">
                      {activeCompany.openVacancies}
                    </strong>
                  </span>
                  <span>
                    Total Needed: <strong>{activeCompany.totalNeeded}</strong>
                  </span>
                  <span>
                    Hired: <strong>{activeCompany.hiredCount}</strong>
                  </span>
                  <span>
                    Critical (&gt;45d): <strong className="text-rose-500">{activeCompany.criticalCount}</strong>
                  </span>
                  <span>
                    Avg Aging: <strong>{activeCompany.avgAgingDays}d</strong>
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
                      Open Vacancies by Operating Entity
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Sorted by Open Volume
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Critical Threshold: <strong className="text-rose-500">&gt;45 days aging</strong>
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
                                <div className="flex justify-between items-center text-violet-600 dark:text-violet-400 font-bold">
                                  <span>Open Vacancies:</span>
                                  <span>{d.openVacancies} positions</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Total Headcount Needed:</span>
                                  <span className="font-semibold text-foreground">{d.totalNeeded}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Hired Candidates:</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{d.hiredCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Active Requisitions:</span>
                                  <span className="font-semibold text-foreground">{d.activeRequisitions}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground border-t border-border/40 pt-1">
                                  <span>Critical (&gt;45d):</span>
                                  <span className="font-semibold text-rose-500">{d.criticalCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Avg Aging:</span>
                                  <span className="font-semibold text-foreground">{d.avgAgingDays} days</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="openVacancies"
                        name="Open Vacancies"
                        fill="#8b5cf6"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        <LabelList
                          dataKey="openVacancies"
                          position="right"
                          formatter={(v: unknown) => `${v} open`}
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
                  const isCritical = c.criticalCount > 0;
                  const isHeavy = c.openVacancies >= 8;

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
                          ? "border-violet-500 bg-violet-500/10 shadow-md"
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
                                  : isCritical
                                  ? "bg-rose-500"
                                  : isHeavy
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="font-bold text-foreground text-sm">
                              {c.companyName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {c.companyCode} · {c.activeRequisitions} Requisitions
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs font-black bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                        >
                          {c.openVacancies} Open
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Needed
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {c.totalNeeded}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Hired
                          </span>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {c.hiredCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Avg Aging
                          </span>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {c.avgAgingDays}d ({c.criticalCount} crit)
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
                        <th className="p-2.5 text-center">Requisitions</th>
                        <th className="p-2.5 text-center">Total Needed</th>
                        <th className="p-2.5 text-center">Hired</th>
                        <th className="p-2.5 text-center">Critical (&gt;45d)</th>
                        <th className="p-2.5 text-center">Avg Aging</th>
                        <th className="p-2.5 text-right">Open Vacancies</th>
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
                              {c.activeRequisitions}
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {c.totalNeeded}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.hiredCount}
                            </td>
                            <td className="p-2.5 text-center font-bold text-rose-500">
                              {c.criticalCount}
                            </td>
                            <td className="p-2.5 text-center font-mono text-muted-foreground">
                              {c.avgAgingDays} days
                            </td>
                            <td className="p-2.5 text-right font-black text-violet-600 dark:text-violet-400">
                              {c.openVacancies}
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
