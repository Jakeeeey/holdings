"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Percent,
  TrendingUp,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  DollarSign,
  Receipt,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { fetchGrossMargin } from "./providers/fetchProvider";
import type {
  GrossMarginKpis,
  ProductMarginItem,
  CategoryMarginSummary,
  WarehouseMarginSummary,
  TrendMarginPoint,
  MarginHealth,
} from "./types";

interface ModuleProps {
  groupId: string;
}

const MARGIN_HEALTH_BADGES: Record<MarginHealth, string> = {
  HIGH: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  HEALTHY: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  LOW: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  NEGATIVE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const PIE_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

export function GrossMarginModule({ groupId }: ModuleProps) {
  const [kpis, setKpis] = useState<GrossMarginKpis | null>(null);
  const [products, setProducts] = useState<ProductMarginItem[]>([]);
  const [categories, setCategories] = useState<CategoryMarginSummary[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseMarginSummary[]>([]);
  const [trends, setTrends] = useState<TrendMarginPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "revenue" | "cogs" | "profit" | "margin" | "units">("profit");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchGrossMargin({
        groupId,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        branchId: warehouseFilter !== "ALL" ? Number(warehouseFilter) : undefined,
        force,
      });

      setKpis(res.kpis);
      setProducts(res.products || []);
      setCategories(res.categories || []);
      setWarehouses(res.warehouses || []);
      setTrends(res.trends || []);
    } catch (err) {
      console.warn(`[GrossMarginModule] Error for group ${groupId}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load gross margin intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, statusFilter, categoryFilter, warehouseFilter]);

  // Filtered & Sorted products
  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.productCode && p.productCode.toLowerCase().includes(q)) ||
          (p.productBrand && p.productBrand.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "revenue":
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case "cogs":
          comparison = a.totalCogs - b.totalCogs;
          break;
        case "margin":
          comparison = a.grossMarginPercentage - b.grossMarginPercentage;
          break;
        case "units":
          comparison = a.unitsSold - b.unitsSold;
          break;
        case "profit":
        default:
          comparison = a.grossProfit - b.grossProfit;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, sortField, sortAsc]);

  // Pagination slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize));

  // CSV Export
  const handleExportCSV = () => {
    if (processedProducts.length === 0) return;
    const headers = [
      "Product ID",
      "Product SKU",
      "Product Name",
      "Brand",
      "Category",
      "Units Sold",
      "Avg Unit Price",
      "Avg Unit Cost",
      "Total Revenue",
      "Total COGS",
      "Gross Profit",
      "Gross Margin %",
      "Margin Health",
    ];
    const rows = processedProducts.map((p) => [
      p.productId,
      p.productCode || "",
      `"${p.productName.replace(/"/g, '""')}"`,
      p.productBrand || "",
      `"${(p.productCategory || "").replace(/"/g, '""')}"`,
      p.unitsSold,
      p.averageUnitPrice,
      p.averageUnitCost,
      p.totalRevenue,
      p.totalCogs,
      p.grossProfit,
      p.grossMarginPercentage,
      p.marginHealth,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `gross_margin_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/holdings/executive-dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Executive Dashboard
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase flex items-center gap-2.5">
            <Percent className="h-6 w-6 text-emerald-500" />
            Gross Margin & Commercial Profitability Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Realized invoice sales, Cost of Goods Sold (COGS), gross margins, and SKU profitability curves.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs font-bold gap-1.5 border-border/60"
            disabled={processedProducts.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            className="h-8 text-xs font-bold gap-1.5 border-border/60"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Invoiced Sales */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Invoiced Sales</span>
              <DollarSign className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {(kpis?.totalInvoicesCount || 0).toLocaleString()} Invoices
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total COGS */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Total COGS</span>
              <Layers className="h-3.5 w-3.5 text-slate-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalCogs || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Product Acquisition / BOM
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Gross Profit */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Gross Profit</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20 bg-emerald-500/10" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                ₱{(kpis?.grossProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
              Realized Margin
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Gross Margin % */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Gross Margin %</span>
              <Percent className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {kpis?.grossMarginPercentage || 0}%
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Across all categories
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Dispatched Units */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Units Sold</span>
              <Receipt className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.totalUnitsSold || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Physical pieces / cases
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Profit per Order */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Profit / Order</span>
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.averageOrderProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground truncate">
              Average per sales invoice
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Revenue vs COGS and Margin % Trend (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Sales Revenue vs COGS & Gross Margin Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Invoiced Sales Revenue (Left, Cyan), Cost of Goods Sold (Left, Slate), and Gross Margin % (Right, Emerald)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val: number) => `${val}%`}
                    domain={[0, 45]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                    }}
                    formatter={(val: number | string, name: string) => {
                      const num = Number(val || 0);
                      if (name === "Margin %") {
                        return [`${num.toFixed(1)}%`, "Gross Margin"];
                      }
                      return [`₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Sales Revenue"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="cogs"
                    name="COGS"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="marginPercentage"
                    name="Margin %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Category Profit Share (1 Col) */}
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-cyan-500" />
              Gross Profit by Category
            </CardTitle>
            <CardDescription className="text-xs">
              Contribution of each commercial merchandise category to realized margin
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col justify-between">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="grossProfit"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-cat-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                    }}
                    formatter={(val: number | string) => [
                      `₱${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Gross Profit",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              {categories.slice(0, 4).map((c, idx) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{c.category}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {c.grossMarginPercentage}% ({c.revenueSharePercentage}% rev)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STRATEGIC RECOMMENDATIONS & INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            High-Margin SKU Acceleration
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kpis?.topMarginCategory || "Premium Spices"} yield higher profit margins ({kpis?.topMarginCategoryRate || 30}%+). Incentivize sales team push on high-margin lines across van sales routes.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            Low-Margin Line Review
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Products generating below 15% margin require supplier price renegotiations or bundling with high-margin items to protect aggregate operating cash flow.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Discount Policy Governance
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Standardize maximum trade discounts per tier. Prevent line-item discounts on commodities like edible oil that erode slim baseline margins.
          </p>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products by SKU code, product name, or brand..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring w-full md:w-52"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>

              {/* Warehouse Select */}
              <select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring w-full md:w-48"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.branchId} value={String(w.branchId)}>
                    {w.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-black uppercase tracking-wider scrollbar-none pt-1">
            <span className="text-muted-foreground/60 text-[9px] mr-1">Margin Tier:</span>
            {(["ALL", "HIGH", "HEALTHY", "LOW", "NEGATIVE"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-full transition-all border whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-foreground text-background border-foreground font-black"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
              >
                {st === "ALL" ? "All Tiers" : st === "HIGH" ? "High (≥25%)" : st === "HEALTHY" ? "Healthy (15-25%)" : st === "LOW" ? "Low (<15%)" : "Negative (<0%)"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COMPREHENSIVE PRODUCT MARGIN LEDGER TABLE */}
      <Card className="border-border/60">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider">
              Product Commercial Margin Ledger ({processedProducts.length.toLocaleString()} matching SKUs)
            </CardTitle>
            <CardDescription className="text-xs">
              Line-item sales revenue, direct acquisition costs, realized gross profit, and margin percentages
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/70 border-y border-border/40 text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Product SKU & Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("units")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Units Sold
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("revenue")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Revenue (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("cogs")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      COGS (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("profit")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Gross Profit (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("margin")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                    >
                      Margin %
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground truncate max-w-[240px] sm:max-w-[340px]">
                        {p.productName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{p.productCode || `SKU-${p.productId}`}</span>
                        {p.productBrand && <span>• {p.productBrand}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                      {p.productCategory || "General"}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {p.unitsSold.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      ₱{p.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-medium text-muted-foreground">
                      ₱{p.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₱{p.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center font-black text-foreground">
                      {p.grossMarginPercentage}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          MARGIN_HEALTH_BADGES[p.marginHealth]
                        }`}
                      >
                        {p.marginHealth}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                      No products match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {Math.min(processedProducts.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(processedProducts.length, currentPage * pageSize)} of {processedProducts.length.toLocaleString()}{" "}
              records
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-bold text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

