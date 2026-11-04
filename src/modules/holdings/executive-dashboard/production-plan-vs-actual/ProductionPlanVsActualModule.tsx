"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
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
import { fetchProductionPlanVsActual } from "./providers/fetchProvider";
import type {
  ProductionPlanVsActualKpis,
  ProductPlanSummary,
  ProductionPlanVsActualJobOrder,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function ProductionPlanVsActualModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionPlanVsActualKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<ProductionPlanVsActualJobOrder[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductPlanSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"planned" | "actual" | "variance" | "rate" | "no">("planned");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionPlanVsActual({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setProductSummaries(res.productSummaries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load production data";
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
          j.branchName.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "planned") diff = b.plannedQuantity - a.plannedQuantity;
      else if (sortField === "actual") diff = b.actualGoodQuantity - a.actualGoodQuantity;
      else if (sortField === "variance") diff = b.quantityVariance - a.quantityVariance;
      else if (sortField === "rate") diff = b.fulfillmentRate - a.fulfillmentRate;
      else if (sortField === "no") diff = a.jobOrderNo.localeCompare(b.jobOrderNo);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [jobOrders, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return productSummaries.map((p) => ({
      name: p.productCode || p.productName.slice(0, 10),
      fullName: p.productName,
      planned: p.plannedQuantity,
      actual: p.actualGoodQuantity,
      rejected: p.rejectedQuantity,
      rate: p.fulfillmentRate,
      uom: p.uom,
    }));
  }, [productSummaries]);

  const handleExportCSV = () => {
    if (!jobOrders.length) return;
    const headers = [
      "Job Order No",
      "Product Name",
      "Product SKU",
      "UOM",
      "Branch",
      "Status",
      "Planned Quantity",
      "Actual Good Yield",
      "Rejected Quantity",
      "Quantity Variance",
      "Fulfillment Rate (%)",
      "Planned Completion Date",
      "Actual Completion Date",
      "Schedule Variance Days",
    ];

    const rows = jobOrders.map((j) => [
      `"${j.jobOrderNo}"`,
      `"${j.productName}"`,
      `"${j.productCode}"`,
      `"${j.uom}"`,
      `"${j.branchName}"`,
      `"${j.status}"`,
      j.plannedQuantity,
      j.actualGoodQuantity,
      j.rejectedQuantity,
      j.quantityVariance,
      j.fulfillmentRate,
      `"${j.plannedCompletionDate || ""}"`,
      `"${j.actualCompletionDate || ""}"`,
      j.completionVarianceDays ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `production_plan_vs_actual_${startDate || "all"}_to_${endDate || "all"}.csv`
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
              Production Plan vs Actual Intelligence
            </h1>
            <Badge
              variant="outline"
              className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-bold px-2.5 py-0.5 rounded-full text-xs"
            >
              MANUFACTURING OPERATIONS
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-facility production plans, actual shop-floor yield fulfillment, scrap variance, and schedule adherence.
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
            <span className="font-semibold">Failed to fetch production report:</span> {error}
          </div>
        </div>
      )}

      {/* Loaded KPIs Strip */}
      {kpis && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Planned Target */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Planned Target</span>
                  <Layers className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.totalPlannedQuantity.toLocaleString()}
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  Across {kpis.totalJobOrders} Job Orders
                </div>
              </CardContent>
            </Card>

            {/* Actual Good Yield */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Actual Good Yield</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.totalActualGoodQuantity.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.overallFulfillmentRate}% fulfillment rate
                </div>
              </CardContent>
            </Card>

            {/* Net Quantity Variance */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Output Variance</span>
                  {kpis.netQuantityVariance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  )}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black ${
                    kpis.netQuantityVariance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {kpis.netQuantityVariance > 0 ? "+" : ""}
                  {kpis.netQuantityVariance.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Net units vs production plan
                </div>
              </CardContent>
            </Card>

            {/* Scrap Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Scrap &amp; Rejection</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {kpis.totalRejectedQuantity.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-500 font-semibold">
                  {kpis.scrapRate}% rejection rate
                </div>
              </CardContent>
            </Card>

            {/* Schedule Adherence */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>On-Time Rate</span>
                  <Award className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
                  {kpis.onTimeCompletionRate}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Schedule adherence index
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
                    Product Line Production Plan vs Actual Yield
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cross-product comparison between targeted production batches, actual finished goods, and scrap.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                  Yield Target: &gt;95%
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
                                <span>Planned Target:</span>
                                <span className="font-semibold">{Number(d.planned).toLocaleString()} {d.uom}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>Actual Good Yield:</span>
                                <span>{Number(d.actual).toLocaleString()} {d.uom}</span>
                              </div>
                              <div className="flex justify-between items-center text-rose-500">
                                <span>Scrap / Rejection:</span>
                                <span className="font-semibold">{Number(d.rejected).toLocaleString()} {d.uom}</span>
                              </div>
                              <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400 font-bold border-t border-border/40 pt-1">
                                <span>Fulfillment Rate:</span>
                                <span>{d.rate}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="planned" name="Planned Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Good Yield" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="rate"
                        position="top"
                        formatter={(v: unknown) => `${v}%`}
                        style={{ fontSize: "10px", fontWeight: 700, fill: "currentColor" }}
                        className="text-foreground"
                      />
                    </Bar>
                    <Bar dataKey="rejected" name="Scrap / Rejection" fill="#f43f5e" radius={[4, 4, 0, 0]} />
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
                    Job Orders Production Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detailed job order execution, fulfillment variance, scrap, and scheduled completion metrics.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search JO, product, SKU..."
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
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Status</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "planned") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("planned");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Planned</span>
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
                            <span>Actual Yield</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Scrap</th>
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
                            <span>Variance</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
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
                            <span>Fulfillment Rate</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAndSortedJobs.map((j) => {
                        const isDone = j.status.includes("COMPLETE") || j.status === "CLOSED";

                        return (
                          <tr key={j.jobOrderId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-foreground">{j.jobOrderNo}</div>
                              <span className="text-[10px] text-muted-foreground">{j.branchName}</span>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-foreground">{j.productName}</div>
                              <span className="text-[10px] font-mono text-muted-foreground">{j.productCode}</span>
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold ${
                                  isDone
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {j.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-medium text-foreground">
                              {j.plannedQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {j.actualGoodQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td className="p-3 text-center font-medium text-rose-500">
                              {j.rejectedQuantity.toLocaleString()} {j.uom}
                            </td>
                            <td
                              className={`p-3 text-center font-bold font-mono ${
                                j.quantityVariance >= 0 ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {j.quantityVariance > 0 ? "+" : ""}
                              {j.quantityVariance.toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                                {j.fulfillmentRate}%
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

