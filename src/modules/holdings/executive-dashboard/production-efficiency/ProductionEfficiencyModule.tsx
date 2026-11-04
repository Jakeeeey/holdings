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
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
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
import { fetchProductionEfficiency } from "./providers/fetchProvider";
import type {
  ProductionEfficiencyKpis,
  WorkCenterEfficiencySummary,
  JobOrderEfficiencyItem,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function ProductionEfficiencyModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionEfficiencyKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<JobOrderEfficiencyItem[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenterEfficiencySummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"efficiency" | "standard" | "actual" | "variance" | "no">("efficiency");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionEfficiency({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setWorkCenters(res.workCenters || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load efficiency data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedJobs = useMemo(() => {
    let list = jobOrders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.jobOrderNo.toLowerCase().includes(q) ||
          j.productName.toLowerCase().includes(q) ||
          j.productCode.toLowerCase().includes(q) ||
          j.workCenterName.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "efficiency") diff = b.efficiencyPercent - a.efficiencyPercent;
      else if (sortField === "standard") diff = b.standardHours - a.standardHours;
      else if (sortField === "actual") diff = b.actualHours - a.actualHours;
      else if (sortField === "variance") diff = b.varianceHours - a.varianceHours;
      else if (sortField === "no") diff = a.jobOrderNo.localeCompare(b.jobOrderNo);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [jobOrders, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return workCenters.map((w) => ({
      name: w.workCenterName.length > 15 ? `${w.workCenterName.slice(0, 13)}...` : w.workCenterName,
      fullName: w.workCenterName,
      standard: w.standardHours,
      actual: w.actualHours,
      variance: w.varianceHours,
      efficiency: w.efficiencyPercent,
      throughput: w.averageProductivity,
    }));
  }, [workCenters]);

  const handleExportCSV = () => {
    if (!jobOrders.length) return;
    const headers = [
      "Job Order No",
      "Product Name",
      "Product SKU",
      "Work Center",
      "UOM",
      "Good Output Quantity",
      "Standard Allowed Hours",
      "Actual Logged Hours",
      "Hour Variance",
      "Efficiency Percent (%)",
      "Throughput Rate (Units/Hr)",
      "Status",
    ];

    const rows = jobOrders.map((j) => [
      `"${j.jobOrderNo}"`,
      `"${j.productName}"`,
      `"${j.productCode}"`,
      `"${j.workCenterName}"`,
      `"${j.uom}"`,
      j.goodOutputQuantity,
      j.standardHours,
      j.actualHours,
      j.varianceHours,
      j.efficiencyPercent,
      j.productivity,
      `"${j.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `production_efficiency_${startDate || "all"}_to_${endDate || "all"}.csv`
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
              Production Efficiency Intelligence
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full text-xs"
            >
              MANUFACTURING OPERATIONS
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Standard direct-labor hours vs actual logged hours, work station throughput, variance analysis, and OEE efficiency.
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
            <span className="font-semibold">Failed to fetch efficiency report:</span> {error}
          </div>
        </div>
      )}

      {/* Loaded KPIs Strip */}
      {kpis && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Overall Efficiency */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Overall Efficiency</span>
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.overallEfficiencyPercent}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Across {kpis.activeWorkCentersCount} work stations
                </div>
              </CardContent>
            </Card>

            {/* Standard Allowed Hours */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Standard Allowed</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.totalStandardHours.toLocaleString()}
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  Earned standard hours
                </div>
              </CardContent>
            </Card>

            {/* Actual Logged Hours */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Actual Logged</span>
                  <Layers className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.totalActualHours.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Direct labor shop-floor time
                </div>
              </CardContent>
            </Card>

            {/* Hour Variance */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Hour Variance</span>
                  {kpis.netVarianceHours >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black ${
                    kpis.netVarianceHours >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {kpis.netVarianceHours > 0 ? "+" : ""}
                  {kpis.netVarianceHours}h
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.netVarianceHours >= 0 ? "Saved below standard" : "Overtime incurred"}
                </div>
              </CardContent>
            </Card>

            {/* Average Throughput */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Avg Throughput</span>
                  <Gauge className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.averageThroughput}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Top: {kpis.topPerformingWorkCenter.slice(0, 14)}...</span>
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
                    Work Station Production Efficiency &amp; Labor Hours
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison between standard earned labor hours and actual logged hours across work centers.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                  Efficiency Target: &gt;95%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
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
                                <span>Throughput:</span>
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
            </CardContent>
          </Card>

          {/* Ledger Table Section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Job Orders Efficiency Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Station-by-station labor hours, throughput productivity, and variance analysis.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search JO, product, station..."
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
                            if (sortField === "no") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("no");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>Job Order</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3">Work Station</th>
                        <th className="p-3 text-center">Output</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "standard") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("standard");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Standard (hrs)</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "actual") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("actual");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Actual (hrs)</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "variance") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("variance");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Variance (hrs)</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Throughput</th>
                        <th
                          className="p-3 text-right cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "efficiency") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("efficiency");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Efficiency</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAndSortedJobs.map((j) => {
                        return (
                          <tr key={j.jobOrderId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-foreground">{j.jobOrderNo}</div>
                              <span className="text-[10px] text-muted-foreground">
                                {j.productName} ({j.productCode})
                              </span>
                            </td>
                            <td className="p-3 font-medium text-foreground">
                              {j.workCenterName}
                            </td>
                            <td className="p-3 text-center font-medium text-foreground">
                              {j.goodOutputQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-3 text-center font-medium text-blue-500">
                              {j.standardHours}h
                            </td>
                            <td className="p-3 text-center font-medium text-indigo-500">
                              {j.actualHours}h
                            </td>
                            <td
                              className={`p-3 text-center font-bold font-mono ${
                                j.varianceHours >= 0 ? "text-emerald-500" : "text-amber-500"
                              }`}
                            >
                              {j.varianceHours > 0 ? "+" : ""}
                              {j.varianceHours}h
                            </td>
                            <td className="p-3 text-center font-medium text-foreground">
                              {j.productivity} {j.uom}/h
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {j.efficiencyPercent}%
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

