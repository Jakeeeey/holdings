"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Timer,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Clock,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { fetchIntercompanyPunctuality } from "./providers/fetchProvider";
import type {
  CompanyPunctualitySummary,
  IntercompanyPunctualityKpis,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function IntercompanyPunctualityModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyPunctualityKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyPunctualitySummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"rate" | "onTime" | "late" | "name">("rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyPunctuality({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load punctuality data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedCompanies = useMemo(() => {
    let list = companySummaries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.companyCode.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "rate") diff = b.punctualityRate - a.punctualityRate;
      else if (sortField === "onTime") diff = b.onTimeCount - a.onTimeCount;
      else if (sortField === "late") diff = b.totalLateCount - a.totalLateCount;
      else if (sortField === "name") diff = a.companyName.localeCompare(b.companyName);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [companySummaries, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return filteredAndSortedCompanies
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
        avgDelayMinutes: c.avgDelayMinutes,
        employees: c.totalEmployees,
      }));
  }, [filteredAndSortedCompanies]);

  const handleExportCSV = () => {
    if (!companySummaries.length) return;
    const headers = [
      "Company Code",
      "Company Name",
      "Headcount",
      "Total Logs",
      "On-Time",
      "Grace Period",
      "Late",
      "Undertime",
      "Avg Delay (mins)",
      "Punctuality Rate (%)",
      "Status",
    ];

    const rows = companySummaries.map((c) => [
      `"${c.companyCode}"`,
      `"${c.companyName}"`,
      c.totalEmployees,
      c.totalLogs,
      c.onTimeCount,
      c.gracePeriodCount,
      c.totalLateCount,
      c.undertimeCount,
      c.avgDelayMinutes,
      `${c.punctualityRate}%`,
      c.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `intercompany_punctuality_${startDate || "all"}_to_${endDate || "all"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/holdings/executive-dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Intercompany Punctuality Intelligence
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full text-xs"
            >
              EXECUTIVE HR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time cross-company attendance compliance, on-time arrivals, grace periods, and tardiness benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 border-border/40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 border-border/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !kpis && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      )}

      {/* Error state */}
      {error && !kpis && (
        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Failed to fetch punctuality metrics:</span> {error}
          </div>
        </div>
      )}

      {/* Loaded KPIs Strip */}
      {kpis && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Overall Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Punctuality Rate</span>
                  <Timer className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.overallPunctualityRate.toFixed(1)}%
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Target: ≥95% Compliance
                </div>
              </CardContent>
            </Card>

            {/* On-Time Logs */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>On-Time Clock-Ins</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {(kpis.onTimeCount + kpis.gracePeriodCount).toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.totalPresentLogs.toLocaleString()} total shifts analyzed
                </div>
              </CardContent>
            </Card>

            {/* Late / Tardiness */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Tardiness Logs</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.totalLateCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  Avg delay: {kpis.avgDelayMinutes} mins
                </div>
              </CardContent>
            </Card>

            {/* Undertime Logs */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Undertime Logs</span>
                  <Clock className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.undertimeCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Early departure before 5PM
                </div>
              </CardContent>
            </Card>

            {/* Top Punctual Entity */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Top Benchmark</span>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-lg sm:text-xl font-black text-foreground truncate">
                  {kpis.topPunctualCompany}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {kpis.topPunctualRate.toFixed(1)}% Compliance
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Entity Punctuality Distribution & Benchmarks
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison of punctuality rate (% on-time compliance) and tardiness across operating entities.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                  Threshold: 95%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 15, right: 60, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
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
                            <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[220px]">
                              <div className="font-bold text-foreground border-b border-border/40 pb-1">
                                {d.fullName} ({d.code})
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
                                <span>Late:</span>
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
                    <Legend />
                    <Bar
                      dataKey="punctualityRate"
                      name="Punctuality Rate (%)"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                      barSize={22}
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
            </CardContent>
          </Card>

          {/* Ledger Table Section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Operating Entity Punctuality Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detailed breakdown of cross-company attendance compliance and delay metrics.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search entity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs rounded-lg border-border/40"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th
                          className="p-3 cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("name");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>Entity</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Headcount</th>
                        <th className="p-3 text-center">Total Logs</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "onTime") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("onTime");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>On-Time</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Grace Period</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "late") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("late");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Late</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Undertime</th>
                        <th className="p-3 text-center">Avg Delay</th>
                        <th
                          className="p-3 text-right cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "rate") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("rate");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Compliance Rate</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAndSortedCompanies.map((c) => {
                        const isHealthy = c.punctualityRate >= 95;
                        const isWarning = c.punctualityRate >= 90 && c.punctualityRate < 95;

                        return (
                          <tr key={c.companyId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
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
                                <div>
                                  <div className="font-bold text-foreground">{c.companyName}</div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {c.companyCode}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium text-muted-foreground">
                              {c.totalEmployees}
                            </td>
                            <td className="p-3 text-center font-medium text-foreground">
                              {c.totalLogs}
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.onTimeCount}
                            </td>
                            <td className="p-3 text-center font-medium text-muted-foreground">
                              {c.gracePeriodCount}
                            </td>
                            <td className="p-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                              {c.totalLateCount}
                            </td>
                            <td className="p-3 text-center font-medium text-rose-500">
                              {c.undertimeCount}
                            </td>
                            <td className="p-3 text-center font-mono text-muted-foreground">
                              {c.avgDelayMinutes} mins
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`text-sm font-black ${
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
