"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  ShieldCheck,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Layers,
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
import { fetchManufacturingCost } from "./providers/fetchProvider";
import type {
  ManufacturingCostKpis,
  ProductCostItem,
  CostComponentBreakdown,
  CategoryCostSummary,
  CostVarianceStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const VARIANCE_BADGES: Record<CostVarianceStatus, string> = {
  FAVORABLE: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  ON_TARGET: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
  ELEVATED: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  UNFAVORABLE: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
};

const PIE_COLORS = ["#059669", "#10b981", "#38bdf8", "#fbbf24"];

export function ManufacturingCostModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ManufacturingCostKpis | null>(null);
  const [products, setProducts] = useState<ProductCostItem[]>([]);
  const [components, setComponents] = useState<CostComponentBreakdown[]>([]);
  const [categories, setCategories] = useState<CategoryCostSummary[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"actual" | "standard" | "variance" | "margin" | "sku">("margin");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchManufacturingCost({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setProducts(res.products || []);
      setComponents(res.components || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load manufacturing cost data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedProducts = useMemo(() => {
    let list = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "actual") diff = a.actualCostPerUnit - b.actualCostPerUnit;
      else if (sortField === "standard") diff = a.standardCostPerUnit - b.standardCostPerUnit;
      else if (sortField === "variance") diff = a.costVariancePercentage - b.costVariancePercentage;
      else if (sortField === "margin") diff = a.grossMarginPercentage - b.grossMarginPercentage;
      else if (sortField === "sku") diff = a.productCode.localeCompare(b.productCode);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: "actual" | "standard" | "variance" | "margin" | "sku") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportCSV = () => {
    if (products.length === 0) return;
    const headers = [
      "SKU Code",
      "Product Name",
      "Category",
      "UOM",
      "Standard Cost (PHP)",
      "Actual Cost (PHP)",
      "Variance Amount (PHP)",
      "Variance %",
      "Raw Material Cost (PHP)",
      "Packaging Cost (PHP)",
      "Direct Labor Cost (PHP)",
      "Overhead Cost (PHP)",
      "Wholesale Price (PHP)",
      "Gross Margin %",
      "Batch Produced Units",
      "Variance Status",
    ];

    const rows = products.map((p) => [
      `"${p.productCode}"`,
      `"${p.productName}"`,
      `"${p.category}"`,
      `"${p.uom}"`,
      p.standardCostPerUnit,
      p.actualCostPerUnit,
      p.costVarianceAmount,
      p.costVariancePercentage,
      p.rawMaterialCost,
      p.packagingCost,
      p.directLaborCost,
      p.overheadCost,
      p.sellingPrice,
      p.grossMarginPercentage,
      p.totalBatchProducedUnits,
      `"${p.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manufacturing_cost_per_unit_${groupId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    return products.slice(0, 7).map((p) => ({
      name: p.productCode || p.productName.slice(0, 12),
      fullName: p.productName,
      rawMaterial: p.rawMaterialCost,
      packaging: p.packagingCost,
      labor: p.directLaborCost,
      overhead: p.overheadCost,
      standardCost: p.standardCostPerUnit,
      actualCost: p.actualCostPerUnit,
      margin: p.grossMarginPercentage,
    }));
  }, [products]);

  const pieData = useMemo(() => {
    return components.map((c) => ({
      name: c.label,
      value: c.totalCostShare,
      percentage: c.percentage,
    }));
  }, [components]);

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
              Manufacturing Cost / Unit Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-11">
            BOM unit cost absorption, standard cost variance tracking, material and labor breakdown, and contribution margins
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
            disabled={loading || products.length === 0}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
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
            <span className="font-semibold">Failed to fetch manufacturing cost data:</span> {error}
          </div>
        </div>
      )}

      {/* KPIs & Analysis */}
      {kpis && (
        <>
          {/* Top KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Average Cost Per Unit */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Cost / Unit</span>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    ₱{kpis.averageCostPerUnit.toFixed(1)}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      kpis.isVarianceFavorable ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {kpis.overallCostVariance > 0 ? `+${kpis.overallCostVariance}%` : `${kpis.overallCostVariance}%`}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.isVarianceFavorable ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.isVarianceFavorable ? "Under budget target" : "Above standard target"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Budget Standard */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Budget Standard</span>
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-muted-foreground">
                    ₱{kpis.budgetStandardUnitCost.toFixed(1)}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">target</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Across {kpis.evaluatedSkusCount} finished goods
                </div>
              </CardContent>
            </Card>

            {/* Gross Margin */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.averageGrossMargin}%
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500">healthy</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Selling price vs actual unit cost
                </div>
              </CardContent>
            </Card>

            {/* Material Cost Share */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Material Share</span>
                  <PieChartIcon className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.materialCostSharePercentage}%
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span>Raw materials + Packaging</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Margin Product */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Margin SKU</span>
                  <TrendingDown className="h-4 w-4 text-purple-500" />
                </div>
                <div className="truncate">
                  <span className="text-sm sm:text-base font-black tracking-tight text-foreground truncate block" title={kpis.topCostEfficiencySku}>
                    {kpis.topCostEfficiencySku}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold pt-1">
                  {kpis.topCostEfficiencyMargin}% contribution margin
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Unit Cost Composition Stacked Bar */}
            <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Unit Cost Composition vs Budget Target Line (PHP)
                </CardTitle>
                <CardDescription className="text-xs">
                  Stacked components (Raw Material, Packaging, Labor, Overhead) compared to Standard Target Line
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
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `₱${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                        formatter={(val: number | string, name: string) => [
                          `₱${Number(val).toLocaleString()}`,
                          name,
                        ]}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? `${item.fullName} (${item.name})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        dataKey="rawMaterial"
                        name="Raw Material (₱)"
                        stackId="cost"
                        fill="#059669"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="packaging"
                        name="Packaging (₱)"
                        stackId="cost"
                        fill="#10b981"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="labor"
                        name="Direct Labor (₱)"
                        stackId="cost"
                        fill="#38bdf8"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="overhead"
                        name="Overhead MOH (₱)"
                        stackId="cost"
                        fill="#fbbf24"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Line
                        type="monotone"
                        dataKey="standardCost"
                        name="Standard Target (₱)"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#f43f5e" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Cost Component Pareto Share */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Cost Component Share
                </CardTitle>
                <CardDescription className="text-xs">
                  Overall manufacturing capital distribution
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
                        formatter={(val: number | string) => [`₱${Number(val).toLocaleString()}`, "Capital Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-xs">
                  {components.map((item, idx) => (
                    <div key={item.component} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-[11px] text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {item.percentage}% (₱{item.averagePerUnit.toFixed(1)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((c) => (
              <div
                key={c.category}
                className="bg-muted/15 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{c.category}</span>
                  <span className="text-[10px] font-bold text-emerald-500 font-mono">
                    {c.productCount} SKUs
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black tracking-tight text-foreground">
                    ₱{c.averageUnitCost.toFixed(1)} / unit
                  </span>
                  <span className="text-xs font-bold text-emerald-500">
                    {c.averageMargin}% margin
                  </span>
                </div>
                <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Std: ₱{c.averageStandardCost.toFixed(1)}</span>
                  <span className={c.variancePercentage <= 0 ? "text-emerald-500" : "text-amber-500"}>
                    {c.variancePercentage > 0 ? `+${c.variancePercentage}%` : `${c.variancePercentage}%`} var
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU code, product name, category..."
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
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Variance:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="FAVORABLE">Favorable (&le; -1%)</option>
                  <option value="ON_TARGET">On Target (&plusmn;1%)</option>
                  <option value="ELEVATED">Elevated (+1% to +2.5%)</option>
                  <option value="UNFAVORABLE">Unfavorable (&gt; +2.5%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Finished Goods Unit Cost Breakdown Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredAndSortedProducts.length} of {products.length} evaluated products
                </CardDescription>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => toggleSort("sku")}>
                      <div className="flex items-center gap-1">
                        <span>SKU Code</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("standard")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Standard Target</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("actual")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Actual Cost</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("variance")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Variance %</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right">Raw Material</th>
                    <th className="p-3 text-right">Packaging</th>
                    <th className="p-3 text-right">Labor & MOH</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("margin")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Gross Margin</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {p.productCode}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block truncate max-w-[200px]">
                          {p.productName}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.category}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₱{p.standardCostPerUnit.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-foreground">
                        ₱{p.actualCostPerUnit.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={p.costVariancePercentage <= 0 ? "text-emerald-500" : "text-amber-500"}>
                          {p.costVariancePercentage > 0
                            ? `+${p.costVariancePercentage}%`
                            : `${p.costVariancePercentage}%`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₱{p.rawMaterialCost.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₱{p.packagingCost.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₱{(p.directLaborCost + p.overheadCost).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-500">
                        {p.grossMarginPercentage}%
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            VARIANCE_BADGES[p.status]
                          }`}
                        >
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedProducts.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-muted-foreground">
                        No manufacturing cost records matching your filter criteria.
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

