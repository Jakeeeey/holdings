"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  PackageCheck,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Warehouse,
  Coins,
  BadgeAlert,
  BarChart3,
  PieChart as PieIcon,
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
import { fetchInventory } from "./providers/fetchProvider";
import type {
  InventoryKpis,
  InventoryProductItem,
  InventoryCategorySummary,
  WarehouseLocationSummary,
  InventoryStockStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
}

const STOCK_STATUS_BADGES: Record<InventoryStockStatus, string> = {
  OPTIMAL: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LOW_STOCK: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  CRITICAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  OVERSTOCK: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

const PIE_COLORS = ["#0891b2", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#64748b"];

export function InventoryModule({ groupId }: ModuleProps) {
  const [kpis, setKpis] = useState<InventoryKpis | null>(null);
  const [items, setItems] = useState<InventoryProductItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategorySummary[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "units" | "cost" | "valuation">("valuation");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventory({
        groupId,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        branchId: locationFilter !== "ALL" ? Number(locationFilter) : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setItems(res.items || []);
      setCategories(res.categories || []);
      setLocations(res.locations || []);
    } catch (err) {
      console.warn(`[InventoryModule] Error for group ${groupId}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load inventory intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, categoryFilter, locationFilter, statusFilter]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let list = [...items];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q) ||
          i.branchName.toLowerCase().includes(q) ||
          i.productCategory.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((i) => i.stockStatus === statusFilter);
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((i) => i.productCategory.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (locationFilter !== "ALL") {
      list = list.filter((i) => String(i.branchId) === locationFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.productName.localeCompare(b.productName);
      } else if (sortField === "units") {
        cmp = a.runningInventory - b.runningInventory;
      } else if (sortField === "cost") {
        cmp = a.unitCost - b.unitCost;
      } else if (sortField === "valuation") {
        cmp = a.totalValuation - b.totalValuation;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [items, searchTerm, statusFilter, categoryFilter, locationFilter, sortField, sortAsc]);

  const toggleSort = (field: "name" | "units" | "cost" | "valuation") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      "Product Code",
      "Product Name",
      "Category",
      "Warehouse Location",
      "Running Inventory",
      "Unit Cost",
      "Total Valuation",
      "Stock Status",
    ];
    const rows = filteredItems.map((i) => [
      `"${i.productCode}"`,
      `"${i.productName.replace(/"/g, '""')}"`,
      `"${i.productCategory.replace(/"/g, '""')}"`,
      `"${i.branchName.replace(/"/g, '""')}"`,
      i.runningInventory,
      i.unitCost,
      i.totalValuation,
      `"${i.stockStatus}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieChartData = useMemo(() => {
    return categories.slice(0, 6).map((c) => ({
      name: c.category,
      value: c.totalValuation,
    }));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link href="/holdings/executive-dashboard">
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Executive Dashboard</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <Badge
            variant="outline"
            className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full"
          >
            DISTRIBUTION INVENTORY
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={filteredItems.length === 0}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card/90 to-cyan-500/5 p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          <Warehouse className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span>Multi-Warehouse Distribution Stock Oversight</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Inventory Valuation & Stock Performance
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Complete inventory management intelligence tracking physical stock balances, total capital valuation, warehouse location distribution, and proactive reorder replenishment triggers.
        </p>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Notice:</span> {error} (Displaying live cached catalog data)
          </span>
        </div>
      )}

      {/* 6-KPI Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Valuation */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-500/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
              Total Valuation
            </span>
            <Coins className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-cyan-700 dark:text-cyan-400">
                ₱{(kpis?.totalValuation || 0) >= 1000000
                  ? `${((kpis?.totalValuation || 0) / 1000000).toFixed(2)}M`
                  : `${((kpis?.totalValuation || 0) / 1000).toFixed(0)}K`}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Stock on hand value</p>
            </div>
          )}
        </div>

        {/* KPI 2: Total Units */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Physical Units</span>
            <Boxes className="h-4 w-4 text-blue-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {(kpis?.totalStockUnits || 0) >= 1000000
                  ? `${((kpis?.totalStockUnits || 0) / 1000000).toFixed(2)}M`
                  : (kpis?.totalStockUnits || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Across all depots</p>
            </div>
          )}
        </div>

        {/* KPI 3: Stock Health Rate */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock Health</span>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.stockHealthRate || 0}%
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Optimal levels</p>
            </div>
          )}
        </div>

        {/* KPI 4: Active SKUs */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">In-Stock SKUs</span>
            <Warehouse className="h-4 w-4 text-indigo-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.inStockSkuCount || 0}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Active product lines</p>
            </div>
          )}
        </div>

        {/* KPI 5: Reorder Alerts */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reorder Alerts</span>
            <BadgeAlert className="h-4 w-4 text-rose-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {(kpis?.lowStockCount || 0) + (kpis?.criticalStockCount || 0)}
              </div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                {kpis?.criticalStockCount || 0} Critical · {kpis?.lowStockCount || 0} Low
              </p>
            </div>
          )}
        </div>

        {/* KPI 6: Average Unit Cost */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Unit Cost</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                ₱{(kpis?.averageUnitCost || 0).toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Weighted unit value</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section: Category Valuation & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composed Chart: Category Valuation */}
        <Card className="lg:col-span-2 border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Category Valuation & Stock Units</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inventory capital investment (₱ Thousands) alongside physical unit count
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Distribution Stock
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={categories.slice(0, 6).map((c) => ({
                    label: c.category.length > 14 ? `${c.category.slice(0, 14)}...` : c.category,
                    valuation: Math.round(c.totalValuation / 1000),
                    units: Math.round(c.totalUnits / 1000),
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="valuation"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₱${v}k`}
                  />
                  <YAxis
                    yAxisId="units"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(val: number | string, name: string) => {
                      if (name === "Valuation (₱K)") {
                        return [`₱${Number(val).toLocaleString()}K`, name];
                      }
                      return [`${Number(val).toLocaleString()}K Units`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" />
                  <Bar
                    yAxisId="valuation"
                    dataKey="valuation"
                    name="Valuation (₱K)"
                    fill="#0891b2"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="units"
                    dataKey="units"
                    name="Units (K)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart: Valuation by Category */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-violet-500" />
                  <span>Valuation by Category</span>
                </CardTitle>
                <CardDescription className="text-xs">Capital distribution share</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[210px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(val: number | string) => [
                      `₱${Number(val).toLocaleString()}`,
                      "Valuation",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/30 max-h-[90px] overflow-y-auto">
              {pieChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-400 text-[11px]">
                    ₱{(item.value / 1000).toFixed(0)}k
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table Section */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>Stock On Hand Master Ledger</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed inventory counts and valuations for {filteredItems.length} active items
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search item, SKU, depot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs bg-muted/40"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                <Filter className="h-3 w-3 text-muted-foreground ml-1.5 mr-0.5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold h-7 px-2 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPTIMAL">Optimal</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="CRITICAL">Critical / Out</option>
                  <option value="OVERSTOCK">Overstock</option>
                </select>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-muted/40 border border-border/40 rounded-lg text-xs font-semibold h-8 px-2.5 focus:outline-none max-w-[160px] truncate"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-muted/40 border border-border/40 rounded-lg text-xs font-semibold h-8 px-2.5 focus:outline-none max-w-[160px] truncate"
              >
                <option value="ALL">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.branchId} value={String(loc.branchId)}>
                    {loc.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 border-b border-border/40">
                <tr>
                  <th
                    onClick={() => toggleSort("name")}
                    className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU / Product</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-bold text-muted-foreground">Category</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground">Warehouse Depot</th>
                  <th
                    onClick={() => toggleSort("units")}
                    className="py-3 px-4 font-bold text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock Units</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("cost")}
                    className="py-3 px-4 font-bold text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unit Cost (₱)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("valuation")}
                    className="py-3 px-4 font-bold text-cyan-700 dark:text-cyan-400 text-right cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Valuation (₱)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-bold text-muted-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredItems.map((item) => {
                  const badgeStyle =
                    STOCK_STATUS_BADGES[item.stockStatus] || STOCK_STATUS_BADGES.OPTIMAL;
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-mono font-bold text-foreground truncate" title={item.productCode}>
                          {item.productCode || "SKU"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate" title={item.productName}>
                          {item.productName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-[140px] truncate" title={item.productCategory}>
                        {item.productCategory}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-[160px] truncate" title={item.branchName}>
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{item.branchName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground text-right">
                        {item.runningInventory.toLocaleString()} {item.unitName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-right">
                        ₱{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-black text-cyan-700 dark:text-cyan-400 text-right">
                        ₱{item.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={`text-[10px] font-bold ${badgeStyle}`}>
                          {item.stockStatus === "LOW_STOCK" ? "Low Stock" : item.stockStatus}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                      No inventory items found matching selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

