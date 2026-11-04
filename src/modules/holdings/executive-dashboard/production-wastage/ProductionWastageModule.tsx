"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trash2,
  AlertTriangle,
  Flame,
  Coins,
  ShieldCheck,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  TrendingDown,
  Layers,
  Factory,
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
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { fetchProductionWastage } from "./providers/fetchProvider";
import type {
  ProductionWastageKpis,
  ProductionWastageJobOrder,
  ProductWastageSummary,
  WastageReasonBreakdown,
  WorkCenterWastageSummary,
  WastageSeverity,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const SEVERITY_BADGES: Record<WastageSeverity, string> = {
  CRITICAL: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  HIGH: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  MODERATE: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400",
  LOW: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
};

const PIE_COLORS = ["#f43f5e", "#fb923c", "#facc15", "#38bdf8", "#a855f7", "#34d399"];

export function ProductionWastageModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ProductionWastageKpis | null>(null);
  const [jobOrders, setJobOrders] = useState<ProductionWastageJobOrder[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductWastageSummary[]>([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<WastageReasonBreakdown[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenterWastageSummary[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"loss" | "rate" | "qty" | "jo">("loss");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProductionWastage({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setJobOrders(res.jobOrders || []);
      setProductSummaries(res.productSummaries || []);
      setReasonBreakdown(res.reasonBreakdown || []);
      setWorkCenters(res.workCenters || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load production wastage data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedJobOrders = useMemo(() => {
    let list = jobOrders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (jo) =>
          jo.jobOrderNo.toLowerCase().includes(q) ||
          jo.productName.toLowerCase().includes(q) ||
          jo.productCode.toLowerCase().includes(q) ||
          jo.batchNo.toLowerCase().includes(q) ||
          jo.workCenterName.toLowerCase().includes(q) ||
          jo.reasonLabel.toLowerCase().includes(q) ||
          (jo.vendorName && jo.vendorName.toLowerCase().includes(q))
      );
    }

    if (severityFilter !== "ALL") {
      list = list.filter((jo) => jo.severity === severityFilter);
    }

    if (vendorFilter === "VENDOR_CHARGEABLE") {
      list = list.filter((jo) => jo.isChargeableToVendor);
    } else if (vendorFilter === "INTERNAL") {
      list = list.filter((jo) => !jo.isChargeableToVendor);
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "loss") diff = a.totalCostLoss - b.totalCostLoss;
      else if (sortField === "rate") diff = a.wastageRate - b.wastageRate;
      else if (sortField === "qty") diff = a.wastageQty - b.wastageQty;
      else if (sortField === "jo") diff = a.jobOrderNo.localeCompare(b.jobOrderNo);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [jobOrders, searchQuery, severityFilter, vendorFilter, sortField, sortOrder]);

  const toggleSort = (field: "loss" | "rate" | "qty" | "jo") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportCSV = () => {
    if (jobOrders.length === 0) return;
    const headers = [
      "Job Order",
      "Product Name",
      "Product Code",
      "Batch No",
      "Work Center",
      "Good Yield",
      "Scrap Qty",
      "Total Input",
      "Wastage %",
      "UOM",
      "Unit Cost (PHP)",
      "Financial Loss (PHP)",
      "Defect Reason",
      "Category",
      "Vendor Chargeable",
      "Vendor Name",
      "Severity",
      "Created At",
    ];

    const rows = jobOrders.map((jo) => [
      `"${jo.jobOrderNo}"`,
      `"${jo.productName}"`,
      `"${jo.productCode}"`,
      `"${jo.batchNo}"`,
      `"${jo.workCenterName}"`,
      jo.goodYieldQty,
      jo.wastageQty,
      jo.totalInputQty,
      jo.wastageRate,
      `"${jo.uom}"`,
      jo.unitCost,
      jo.totalCostLoss,
      `"${jo.reasonLabel}"`,
      `"${jo.category}"`,
      jo.isChargeableToVendor ? "Yes" : "No",
      `"${jo.vendorName || ""}"`,
      `"${jo.severity}"`,
      `"${jo.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `production_wastage_report_${groupId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const productChartData = useMemo(() => {
    return productSummaries.slice(0, 6).map((p) => ({
      name: p.productCode || p.productName.slice(0, 12),
      fullName: p.productName,
      loss: p.totalCostLoss,
      qty: p.totalWastedQty,
      rate: p.wastageRate,
      severity: p.severity,
    }));
  }, [productSummaries]);

  const pieData = useMemo(() => {
    return reasonBreakdown.slice(0, 5).map((r) => ({
      name: r.reasonLabel,
      value: r.totalLossAmount,
      count: r.incidentCount,
    }));
  }, [reasonBreakdown]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/holdings/executive-dashboard">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-border/40 hover:bg-muted"
                title="Back to Executive Dashboard"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Production Wastage & Scrap Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-11">
            Granular yield defect diagnostics, financial loss recovery, vendor chargebacks, and line scrap tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-border/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={loading || jobOrders.length === 0}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
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

      {/* Error Banner */}
      {error && !kpis && (
        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Failed to fetch production wastage audit data:</span> {error}
          </div>
        </div>
      )}

      {/* KPIs & Analysis */}
      {kpis && (
        <>
          {/* Top KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Wastage Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Overall Wastage Rate</span>
                  {kpis.withinTolerance ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      kpis.withinTolerance
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.overallWastageRate}%
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    / {kpis.toleranceThreshold}% cap
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.withinTolerance ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.withinTolerance ? "Within SLA tolerance" : "Exceeds tolerance"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Financial Loss */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scrap Value Loss</span>
                  <Coins className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    ₱{Math.round(kpis.totalFinancialLoss).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                  <span>₱{Math.round(kpis.vendorChargeableLoss).toLocaleString()} vendor recoverable</span>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Quantity */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scrap Quantity</span>
                  <Trash2 className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.totalWastageUnits.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span>Across {kpis.totalIncidents} production runs</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Scrap Product */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Scrap SKU</span>
                  <Flame className="h-4 w-4 text-rose-500" />
                </div>
                <div className="truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate block">
                    {kpis.topWastageProduct}
                  </span>
                </div>
                <div className="text-[10px] text-rose-500 font-semibold pt-1">
                  ₱{Math.round(kpis.topWastageProductLoss).toLocaleString()} scrap value
                </div>
              </CardContent>
            </Card>

            {/* Primary Defect */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Primary Defect</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="truncate">
                  <span className="text-sm sm:text-base font-black tracking-tight text-foreground truncate block" title={kpis.primaryScrapReason}>
                    {kpis.primaryScrapReason}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  {kpis.primaryScrapReasonCount} incidents recorded
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Financial Loss by Product */}
            <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Top Scrapped Products by Cost Loss (PHP)
                </CardTitle>
                <CardDescription className="text-xs">
                  Financial impact comparison vs scrap units per manufactured product
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={productChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
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
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Financial Loss (₱)") return [`₱${Number(val).toLocaleString()}`, name];
                          if (name === "Scrap Units") return [`${Number(val).toLocaleString()}`, name];
                          return [val, name];
                        }}
                        labelFormatter={(label) => {
                          const item = productChartData.find((d) => d.name === label);
                          return item ? `${item.fullName} (${item.name})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="loss"
                        name="Financial Loss (₱)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      >
                        {productChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.severity === "CRITICAL" || entry.severity === "HIGH" ? "#f43f5e" : "#fbbf24"}
                          />
                        ))}
                      </Bar>
                      <Bar
                        yAxisId="right"
                        dataKey="qty"
                        name="Scrap Units"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                        opacity={0.7}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Defect Reason Pareto Distribution */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Scrap Reason Valuation
                </CardTitle>
                <CardDescription className="text-xs">
                  Pareto cost loss share across root cause categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-col items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                        formatter={(val: number | string) => [`₱${Number(val).toLocaleString()}`, "Loss Amount"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-xs">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-[11px] text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        ₱{Math.round(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Center Line Summary Strip */}
          {workCenters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {workCenters.map((wc) => (
                <div
                  key={wc.workCenterId}
                  className="bg-muted/15 border border-border/40 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-rose-500 font-mono">
                      {wc.wastageRate}% Rate
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs font-bold text-foreground line-clamp-1">
                      {wc.workCenterName}
                    </span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">₱{Math.round(wc.totalLossAmount).toLocaleString()}</span>
                    <span className="text-muted-foreground">{wc.totalWastedQty.toLocaleString()} units</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job orders, SKU, defect reason, lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs rounded-lg border-border/40 bg-card/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Severity Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical (&gt; 2.5%)</option>
                  <option value="HIGH">High (&gt; 1.8%)</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Vendor Chargeable Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Type:</span>
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Scrap</option>
                  <option value="VENDOR_CHARGEABLE">Vendor Chargeable</option>
                  <option value="INTERNAL">Internal Process</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Job Order Scrap & Yield Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredAndSortedJobOrders.length} of {jobOrders.length} audited runs
                </CardDescription>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => toggleSort("jo")}>
                      <div className="flex items-center gap-1">
                        <span>Job Order</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Product Name & Batch</th>
                    <th className="p-3">Work Center / Line</th>
                    <th className="p-3 text-right">Good Output</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("qty")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Scrap Qty</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("rate")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Wastage %</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("loss")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost Loss</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Defect Reason & Root Cause</th>
                    <th className="p-3 text-center">Chargeback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedJobOrders.map((jo) => (
                    <tr key={jo.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {jo.jobOrderNo}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block truncate max-w-[180px]">
                          {jo.productName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {jo.productCode} · {jo.batchNo}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                        {jo.workCenterName}
                      </td>
                      <td className="p-3 text-right text-muted-foreground font-medium">
                        {jo.goodYieldQty.toLocaleString()} {jo.uom}
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {jo.wastageQty.toLocaleString()} {jo.uom}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            SEVERITY_BADGES[jo.severity]
                          }`}
                        >
                          {jo.wastageRate}%
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-black text-rose-500">
                        ₱{Math.round(jo.totalCostLoss).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="text-foreground block truncate max-w-[200px]" title={jo.reasonLabel}>
                          {jo.reasonLabel}
                        </span>
                        {jo.remarks && (
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[200px]" title={jo.remarks}>
                            {jo.remarks}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {jo.isChargeableToVendor ? (
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">
                              Charge Vendor
                            </Badge>
                            {jo.vendorName && (
                              <span className="text-[9px] text-muted-foreground truncate max-w-[100px]" title={jo.vendorName}>
                                {jo.vendorName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Internal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedJobOrders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No production scrap records matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

