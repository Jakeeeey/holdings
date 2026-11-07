"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  FlaskConical,
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
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { fetchQualityRejectRate } from "./providers/fetchProvider";
import type {
  QualityRejectRateKpis,
  ProductQualitySummary,
  BatchQualityInspection,
  DefectCategoryBreakdown,
  QualityDisposition,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const DISPOSITION_BADGES: Record<QualityDisposition, string> = {
  APPROVED: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  REJECTED: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  CONDITIONAL_RELEASE: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  UNDER_QUARANTINE: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400",
};

const PIE_COLORS = ["#f43f5e", "#0d9488", "#f59e0b", "#8b5cf6", "#3b82f6"];

export function QualityRejectRateModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<QualityRejectRateKpis | null>(null);
  const [products, setProducts] = useState<ProductQualitySummary[]>([]);
  const [inspections, setInspections] = useState<BatchQualityInspection[]>([]);
  const [defectCategories, setDefectCategories] = useState<DefectCategoryBreakdown[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [dispositionFilter, setDispositionFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"rejectRate" | "inspected" | "rejected" | "product">("rejectRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQualityRejectRate({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setProducts(res.products || []);
      setInspections(res.inspections || []);
      setDefectCategories(res.defectCategories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load quality reject rate data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedInspections = useMemo(() => {
    let list = inspections;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.jobOrderNo.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q) ||
          i.lotNumber.toLowerCase().includes(q) ||
          i.coaReferenceNo.toLowerCase().includes(q) ||
          i.defectDescription.toLowerCase().includes(q) ||
          i.inspectorName.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((i) => i.defectCategory === categoryFilter);
    }

    if (dispositionFilter !== "ALL") {
      list = list.filter((i) => i.disposition === dispositionFilter);
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "rejectRate") diff = a.rejectRate - b.rejectRate;
      else if (sortField === "inspected") diff = a.inspectedQuantity - b.inspectedQuantity;
      else if (sortField === "rejected") diff = a.rejectedQuantity - b.rejectedQuantity;
      else if (sortField === "product") diff = a.productName.localeCompare(b.productName);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [inspections, searchQuery, categoryFilter, dispositionFilter, sortField, sortOrder]);

  const toggleSort = (field: "rejectRate" | "inspected" | "rejected" | "product") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportCSV = () => {
    if (inspections.length === 0) return;
    const headers = [
      "Job Order",
      "Product Name",
      "Product Code",
      "Lot Number",
      "COA Reference",
      "Inspected Quantity",
      "Passed Quantity",
      "Rejected Quantity",
      "Reject Rate %",
      "UOM",
      "Disposition",
      "Defect Category",
      "Defect Description",
      "Inspector Name",
      "Inspected At",
      "Packaging Seal Passed",
      "Label Compliance Passed",
      "Microbiology Status",
    ];

    const rows = inspections.map((i) => [
      `"${i.jobOrderNo}"`,
      `"${i.productName}"`,
      `"${i.productCode}"`,
      `"${i.lotNumber}"`,
      `"${i.coaReferenceNo}"`,
      i.inspectedQuantity,
      i.passedQuantity,
      i.rejectedQuantity,
      i.rejectRate,
      `"${i.uom}"`,
      `"${i.disposition}"`,
      `"${i.defectCategory}"`,
      `"${i.defectDescription}"`,
      `"${i.inspectorName}"`,
      `"${i.inspectedAt}"`,
      i.labParameters.packagingSealPassed ? "Yes" : "No",
      i.labParameters.labelCompliancePassed ? "Yes" : "No",
      `"${i.labParameters.microbiologicalStatus}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quality_reject_rate_audit_${groupId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    return products.slice(0, 8).map((p) => ({
      name: p.productCode || p.productName.slice(0, 12),
      fullName: p.productName,
      inspected: p.totalInspectedUnits,
      passed: p.totalPassedUnits,
      rejected: p.totalRejectedUnits,
      passRate: p.passRate,
      rejectRate: p.rejectRate,
    }));
  }, [products]);

  const pieData = useMemo(() => {
    return defectCategories.map((c) => ({
      name: c.label,
      value: c.rejectedUnits,
      incidents: c.incidentCount,
    }));
  }, [defectCategories]);

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
              Quality & Reject Rate Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-11">
            Finished batch quality assurance releases, reject rate monitoring, laboratory parameters, and quarantine compliance
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
            disabled={loading || inspections.length === 0}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
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
            <span className="font-semibold">Failed to fetch quality reject rate data:</span> {error}
          </div>
        </div>
      )}

      {/* KPIs & Analysis */}
      {kpis && (
        <>
          {/* Top KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Overall Pass Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Overall Pass Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      kpis.isWithinTolerance ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.overallPassRate}%
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500">passed</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.isWithinTolerance ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>Target: &ge; 98.0% compliance</span>
                </div>
              </CardContent>
            </Card>

            {/* Overall Reject Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Reject Rate</span>
                  <XCircle className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      kpis.isWithinTolerance ? "text-foreground" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {kpis.overallRejectRate}%
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    vs {kpis.toleranceTarget}% max
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  {kpis.totalRejectedUnits.toLocaleString()} total units non-compliant
                </div>
              </CardContent>
            </Card>

            {/* Total Inspected Volume */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inspected Volume</span>
                  <ShieldCheck className="h-4 w-4 text-teal-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.totalInspectedUnits.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Across {kpis.totalBatchesInspected} QA batch releases
                </div>
              </CardContent>
            </Card>

            {/* Quarantined Lots */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Quarantine Lots</span>
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                    {kpis.batchesQuarantined}
                  </span>
                  <span className="text-[11px] font-bold text-purple-500">lots held</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Under lab incubation & testing
                </div>
              </CardContent>
            </Card>

            {/* Top Defect Driver */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Primary Defect</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="truncate">
                  <span className="text-sm sm:text-base font-black tracking-tight text-foreground truncate block" title={kpis.primaryDefectReason}>
                    {kpis.primaryDefectReason}
                  </span>
                </div>
                <div className="text-[10px] text-rose-500 font-semibold pt-1 truncate">
                  Top reject: {kpis.topRejectSku} ({kpis.topRejectSkuRate}%)
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Pass vs Reject Volume by SKU */}
            <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Passed vs Rejected Volume by Product (Units)
                </CardTitle>
                <CardDescription className="text-xs">
                  Batch output volumes compared with target 98.0% Pass Rate % line
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
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
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[95, 100]}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Pass Rate (%)") return [`${val}%`, name];
                          if (name === "Passed Units" || name === "Rejected Units") return [`${Number(val).toLocaleString()}`, name];
                          return [val, name];
                        }}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="passed"
                        name="Passed Units"
                        fill="#0d9488"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="rejected"
                        name="Rejected Units"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="passRate"
                        name="Pass Rate (%)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Defect Category Pareto Breakdown */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Defect Category Share
                </CardTitle>
                <CardDescription className="text-xs">
                  Rejected unit share by failure type
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
                        formatter={(val: number | string) => [`${Number(val).toLocaleString()} units`, "Rejected"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-xs">
                  {defectCategories.map((c, idx) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-[11px] text-muted-foreground">{c.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {c.rejectedUnits}u ({c.percentageOfTotalRejects}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job orders, SKU, LOT #, COA, inspector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs rounded-lg border-border/40 bg-card/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Defect Types</option>
                  {defectCategories.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disposition Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Disposition:</span>
                <select
                  value={dispositionFilter}
                  onChange={(e) => setDispositionFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Dispositions</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CONDITIONAL_RELEASE">Conditional Release</option>
                  <option value="UNDER_QUARANTINE">Under Quarantine</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Quality Assurance Release Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredAndSortedInspections.length} of {inspections.length} inspected batches
                </CardDescription>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="p-3">Job Order</th>
                    <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => toggleSort("product")}>
                      <div className="flex items-center gap-1">
                        <span>Product Name & LOT</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">COA Reference</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("inspected")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Inspected</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("rejected")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Rejected</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("rejectRate")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Reject Rate %</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Defect Description</th>
                    <th className="p-3">Inspector</th>
                    <th className="p-3 text-center">Disposition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedInspections.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {i.jobOrderNo}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block truncate max-w-[180px]">
                          {i.productName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {i.productCode} · {i.lotNumber}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {i.coaReferenceNo}
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {i.inspectedQuantity.toLocaleString()} {i.uom}
                      </td>
                      <td className="p-3 text-right font-black text-rose-500">
                        {i.rejectedQuantity.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span
                          className={
                            i.rejectRate <= 2.0 ? "text-emerald-500" : "text-amber-500"
                          }
                        >
                          {i.rejectRate}%
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <span className="text-foreground truncate block" title={i.defectDescription}>
                          {i.defectDescription}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {i.inspectorName}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            DISPOSITION_BADGES[i.disposition]
                          }`}
                        >
                          {i.disposition.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedInspections.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No quality assurance inspection records matching your filter criteria.
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

