"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Building2,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Layers,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Legend,
} from "recharts";
import { fetchIntercompanyEmployeeMasterlist } from "@/modules/holdings/executive-dashboard/intercompany-employee-masterlist/providers/fetchProvider";
import type {
  CompanyMasterlistSummary,
  IntercompanyEmployeeMasterlistKpis,
} from "@/modules/holdings/executive-dashboard/intercompany-employee-masterlist/types";

export interface IntercompanyEmployeeMasterlistPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
}

export function IntercompanyEmployeeMasterlistPreviewCard({
  group,
}: IntercompanyEmployeeMasterlistPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyEmployeeMasterlistKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyMasterlistSummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyEmployeeMasterlist({
        groupId: group.id,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      console.warn(`[IntercompanyPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load headcount data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  // Chart data sorted from highest headcount to lowest
  const chartData = useMemo(() => {
    return companySummaries
      .filter((c) => c.totalEmployees > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        total: c.totalEmployees,
        share: c.headcountSharePct,
        regular: c.regularCount,
        probationary: c.probationaryCount,
        other: c.otherStatusCount,
        tenure: c.avgTenureYears,
      }))
      .sort((a, b) => b.total - a.total);
  }, [companySummaries]);

  const targetUrl = `/holdings/executive-dashboard/hr/${group.id}/employee-masterlist`;

  return (
    <div className="col-span-1 lg:col-span-2 xl:col-span-3 w-full">
      <Card className="relative overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-cyan-500/5 via-primary/5 to-emerald-500/5 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Human Resource Intelligence
                </p>
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/5 py-0 px-1.5 h-4"
                >
                  Intercompany Roster
                </Badge>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-0.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground whitespace-normal">
                  {group.group_name || "Intercompany Employee Masterlist"}
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium hidden md:inline">
                  • Headcount per operating company and workforce metrics
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {!loading && kpis && (
                <div className="text-right border-r border-border/60 pr-3 hidden sm:flex items-center gap-3.5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      Total Headcount
                    </p>
                    <p className="text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400 leading-tight">
                      {kpis.totalEmployees.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-border/50 pl-3.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      Active Entities
                    </p>
                    <p className="text-base sm:text-lg font-black font-mono text-foreground leading-tight">
                      {kpis.activeCompaniesCount} / {kpis.totalCompaniesCount}
                    </p>
                  </div>
                  <div className="border-l border-border/50 pl-3.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      Regular Ratio
                    </p>
                    <p className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                      {kpis.totalEmployees > 0
                        ? `${Math.round((kpis.regularCount / kpis.totalEmployees) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <div className="border border-border/60 rounded-lg p-0.5 bg-muted/20 flex items-center">
                  <Button
                    variant={viewMode === "chart" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("chart")}
                    className="h-6 px-2 text-[10px] gap-1 font-bold shadow-none"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Chart
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-6 px-2 text-[10px] gap-1 font-bold shadow-none"
                  >
                    <LayoutGrid className="h-3 w-3" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-6 px-2 text-[10px] gap-1 font-bold shadow-none"
                  >
                    <TableIcon className="h-3 w-3" />
                    Table
                  </Button>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="h-7 px-3 text-[11px] gap-1 font-bold shadow-2xs"
                >
                  <Link href={targetUrl}>
                    View Full Report
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                className="h-6 text-[10px] border-destructive/30"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 pt-0.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[360px] rounded-xl" />
            </div>
          ) : kpis ? (
            <div className="space-y-3">
              {/* Summary KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Total Active Workforce */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Total Workforce
                    </span>
                    <Users className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <div className="mt-1">
                    <p className="text-lg sm:text-xl font-black font-mono text-cyan-600 dark:text-cyan-400 leading-tight">
                      {kpis.totalEmployees.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{kpis.maleCount} Male</span>
                      <span>•</span>
                      <span>{kpis.femaleCount} Female</span>
                    </p>
                  </div>
                </div>

                {/* 2. Regular Employees */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Regular Staff
                    </span>
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div className="mt-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                        {kpis.regularCount.toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold tracking-wider py-0 px-1.5 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                      >
                        {kpis.totalEmployees > 0
                          ? `${Math.round((kpis.regularCount / kpis.totalEmployees) * 100)}%`
                          : "0%"}
                      </Badge>
                    </div>
                    <div className="mt-1.5">
                      <Progress
                        value={
                          kpis.totalEmployees > 0
                            ? (kpis.regularCount / kpis.totalEmployees) * 100
                            : 0
                        }
                        className="h-1 bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Probationary & Other */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Probationary
                    </span>
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="mt-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400 leading-tight">
                        {kpis.probationaryCount.toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold tracking-wider py-0 px-1.5 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                      >
                        {kpis.totalEmployees > 0
                          ? `${Math.round((kpis.probationaryCount / kpis.totalEmployees) * 100)}%`
                          : "0%"}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                      +{kpis.otherStatusCount} contractual / other
                    </p>
                  </div>
                </div>

                {/* 4. Operating Companies & Largest */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Active Entities
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="mt-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg sm:text-xl font-black font-mono text-foreground leading-tight">
                        {kpis.activeCompaniesCount}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          of {kpis.totalCompaniesCount}
                        </span>
                      </p>
                    </div>
                    <p
                      className="text-[10px] font-medium text-muted-foreground truncate mt-0.5"
                      title={`Largest: ${kpis.largestCompanyName} (${kpis.largestCompanyCount})`}
                    >
                      Top: {kpis.largestCompanyName} ({kpis.largestCompanyCount})
                    </p>
                  </div>
                </div>
              </div>

              {/* COMPANY HEADCOUNT QUICK-LEDGER STRIP: Prominently shows headcount per company at all times */}
              <div className="rounded-xl border border-border/60 bg-muted/10 p-2.5">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-3 w-3 text-cyan-500" />
                    Headcount Summary by Operating Company
                  </span>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {kpis.totalEmployees} total staff
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {companySummaries.map((c) => {
                    const isOffline = c.status === "OFFLINE";
                    const isSelected = selectedCompanyId === c.companyId;
                    return (
                      <button
                        key={c.companyId}
                        type="button"
                        onClick={() =>
                          setSelectedCompanyId(
                            isSelected ? null : c.companyId
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 text-left ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500/15 shadow-xs ring-1 ring-cyan-500"
                            : isOffline
                            ? "border-border/40 bg-muted/5 opacity-60 hover:opacity-100"
                            : "border-border/60 bg-card hover:border-cyan-500/40 hover:bg-muted/30"
                        }`}
                      >
                        <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                          {c.companyCode}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="font-mono font-black text-sm text-foreground">
                              {c.totalEmployees.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground">
                              ({c.headcountSharePct}%)
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[110px]" title={c.companyName}>
                            {c.companyName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Visualization: Chart, Grid, or Table */}
              {viewMode === "chart" ? (
                <div className="rounded-xl border border-border/60 bg-muted/5 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/40 mb-3 gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                        Company Headcount Breakdown & Roster Ranks
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Total active headcount displayed directly at the end of each company bar
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
                        <span className="text-muted-foreground">Regular</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
                        <span className="text-muted-foreground">Probationary</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#0ea5e9]" />
                        <span className="text-muted-foreground">Contract / Other</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart with Right-Pinned Headcount Numbers */}
                  <div className="w-full pt-1" style={{ height: `${Math.max(300, chartData.length * 48)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 10, right: 110, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          vertical={true}
                          stroke="hsl(var(--border))"
                          strokeOpacity={0.35}
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="code"
                          type="category"
                          width={75}
                          tick={{
                            fontSize: 11,
                            fontWeight: 900,
                            fill: "hsl(var(--foreground))",
                          }}
                          axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as (typeof chartData)[0];
                              return (
                                <div className="bg-background/95 backdrop-blur-xl border border-border/60 p-3 rounded-xl shadow-2xl min-w-[220px]">
                                  <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                                    <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400">
                                      {d.code}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                      {d.share}% share
                                    </span>
                                  </div>
                                  <p className="text-xs font-black text-foreground mb-2 truncate">
                                    {d.fullName}
                                  </p>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                        Total Headcount
                                      </span>
                                      <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm">
                                        {d.total} employees
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                      <span className="text-[10px] font-bold uppercase">
                                        Regular Staff
                                      </span>
                                      <span className="font-mono font-black">
                                        {d.regular}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                                      <span className="text-[10px] font-bold uppercase">
                                        Probationary
                                      </span>
                                      <span className="font-mono font-black">
                                        {d.probationary}
                                      </span>
                                    </div>
                                    {d.other > 0 && (
                                      <div className="flex justify-between items-center text-sky-600 dark:text-sky-400">
                                        <span className="text-[10px] font-bold uppercase">
                                          Other / Contract
                                        </span>
                                        <span className="font-mono font-black">
                                          {d.other}
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-1.5 border-t border-border/40 flex justify-between items-center text-[10px]">
                                      <span className="font-bold uppercase text-muted-foreground">
                                        Avg. Tenure
                                      </span>
                                      <span className="font-mono font-bold text-foreground">
                                        {d.tenure} yrs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 10, paddingBottom: 6 }}
                        />
                        {/* Stacked Roster Segments */}
                        <Bar
                          dataKey="regular"
                          name="Regular"
                          stackId="a"
                          fill="#10b981"
                          barSize={24}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="probationary"
                          name="Probationary"
                          stackId="a"
                          fill="#f59e0b"
                          barSize={24}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="other"
                          name="Other / Contract"
                          stackId="a"
                          fill="#0ea5e9"
                          barSize={24}
                          radius={[0, 4, 4, 0]}
                        >
                          {/* Right-pinned headcount label on the bar */}
                          <LabelList
                            dataKey="total"
                            position="right"
                            formatter={(v: unknown) => `${Number(v)} staff`}
                            style={{
                              fontSize: "11px",
                              fontWeight: 900,
                              fill: "hsl(var(--foreground))",
                            }}
                            offset={12}
                          />
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                /* Main Visualization: Grid View (Company Entity Cards with Prominent Numbers) */
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                      Operating Entities Breakdown ({companySummaries.length} Companies)
                    </h4>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Headcount and roster statistics per company
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                    {companySummaries.map((c) => {
                      const isOffline = c.status === "OFFLINE";
                      const isSelected = selectedCompanyId === c.companyId;

                      return (
                        <div
                          key={c.companyId}
                          onClick={() =>
                            setSelectedCompanyId(
                              isSelected ? null : c.companyId
                            )
                          }
                          className={`p-3.5 rounded-xl border transition-all duration-200 relative group cursor-pointer ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-500/10 shadow-xs ring-1 ring-cyan-500"
                              : "border-border/60 bg-muted/5 hover:border-cyan-500/40 hover:bg-muted/15"
                          }`}
                        >
                          {/* Header: Code & Online/Offline */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                              {c.companyCode}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOffline
                                    ? "bg-rose-500"
                                    : "bg-emerald-500 animate-pulse"
                                }`}
                              />
                              {isOffline ? "Offline" : `${c.departmentCount} depts`}
                            </span>
                          </div>

                          {/* Company Name */}
                          <h5
                            className="text-xs font-black text-foreground truncate mb-2"
                            title={c.companyName}
                          >
                            {c.companyName}
                          </h5>

                          {/* HERO HEADCOUNT NUMBER */}
                          <div className="my-2 p-2 rounded-lg bg-background/60 border border-border/40">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
                                {c.totalEmployees.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-black text-muted-foreground">
                                {c.headcountSharePct}%
                              </span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block -mt-0.5 mb-1.5">
                              Total Headcount
                            </span>
                            <Progress
                              value={c.headcountSharePct}
                              className="h-1 bg-muted"
                            />
                          </div>

                          {/* Footer stats */}
                          <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-border/50 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground font-semibold">
                                Regular
                              </span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {c.regularCount}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground font-semibold">
                                Probation
                              </span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {c.probationaryCount}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-muted-foreground font-semibold flex items-center justify-end gap-0.5">
                                <Layers className="h-2 w-2 text-purple-500" />
                                Tenure
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {c.avgTenureYears}y
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Main Visualization: Table View (Explicit Number Matrix) */
                <div className="rounded-xl border border-border/60 bg-muted/5 p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="p-3 pl-4">Company</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Headcount</th>
                          <th className="p-3 text-right">Share %</th>
                          <th className="p-3 text-right">Regular</th>
                          <th className="p-3 text-right">Probation</th>
                          <th className="p-3 text-right">Other</th>
                          <th className="p-3 text-right">Depts</th>
                          <th className="p-3 pr-4 text-right">Avg Tenure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {companySummaries.map((c) => {
                          const isOffline = c.status === "OFFLINE";
                          return (
                            <tr key={c.companyId} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                    {c.companyCode}
                                  </span>
                                  <span className="font-bold text-foreground truncate max-w-[200px]" title={c.companyName}>
                                    {c.companyName}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-bold py-0 px-1.5 h-4 ${
                                    isOffline
                                      ? "border-rose-500/30 text-rose-500 bg-rose-500/5"
                                      : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                  }`}
                                >
                                  {c.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                                {c.totalEmployees.toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-muted-foreground">
                                {c.headcountSharePct}%
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {c.regularCount}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                {c.probationaryCount}
                              </td>
                              <td className="p-3 text-right font-mono text-muted-foreground">
                                {c.otherStatusCount}
                              </td>
                              <td className="p-3 text-right font-mono text-muted-foreground">
                                {c.departmentCount}
                              </td>
                              <td className="p-3 pr-4 text-right font-mono font-semibold text-foreground">
                                {c.avgTenureYears}y
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
