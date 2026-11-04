"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  PackageCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Coins,
  TrendingUp,
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
import { fetchFinishedGoodsInventory } from "./providers/fetchProvider";
import type {
  FinishedGoodsInventoryKpis,
  FinishedGoodsItem,
  FinishedGoodsCategorySummary,
  FinishedGoodsStockStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const STATUS_BADGES: Record<FinishedGoodsStockStatus, string> = {
  OPTIMAL: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  LOW_STOCK: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  OVERSTOCKED: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  OUT_OF_STOCK: "text-red-700 bg-red-500/10 border-red-500/20 dark:text-red-400",
};

const PIE_COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

export function FinishedGoodsInventoryModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<FinishedGoodsInventoryKpis | null>(null);
  const [items, setItems] = useState<FinishedGoodsItem[]>([]);
  const [categories, setCategories] = useState<FinishedGoodsCategorySummary[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"valuation" | "onHand" | "available" | "dos" | "sku">("valuation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFinishedGoodsInventory({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setItems(res.items || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load finished goods inventory data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedItems = useMemo(() => {
    let list = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          it.productCode.toLowerCase().includes(q) ||
          it.categoryLabel.toLowerCase().includes(q) ||
          it.warehouseLocation.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((it) => it.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((it) => it.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "valuation") diff = a.totalValuation - b.totalValuation;
      else if (sortField === "onHand") diff = a.onHandQuantity - b.onHandQuantity;
      else if (sortField === "available") diff = a.availableQuantity - b.availableQuantity;
      else if (sortField === "dos") diff = a.daysOfSupply - b.daysOfSupply;
      else if (sortField === "sku") diff = a.productCode.localeCompare(b.productCode);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [items, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: "valuation" | "onHand" | "available" | "dos" | "sku") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "SKU Code",
      "Product Name",
      "Category",
      "UOM",
      "Unit Value (PHP)",
      "On Hand",
      "Reserved",
      "Available",
      "Reorder Point",
      "Safety Stock",
      "Days of Supply",
      "Total Valuation (PHP)",
      "Warehouse Location",
      "Stock Status",
    ];

    const rows = items.map((it) => [
      `"${it.productCode}"`,
      `"${it.productName}"`,
      `"${it.categoryLabel}"`,
      `"${it.uom}"`,
      it.unitValue,
      it.onHandQuantity,
      it.reservedQuantity,
      it.availableQuantity,
      it.reorderPoint,
      it.safetyStock,
      it.daysOfSupply,
      it.totalValuation,
      `"${it.warehouseLocation}"`,
      `"${it.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finished_goods_inventory_${groupId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    return items.slice(0, 7).map((it) => ({
      name: it.productCode || it.productName.slice(0, 12),
      fullName: it.productName,
      available: it.availableQuantity,
      reserved: it.reservedQuantity,
      valuation: it.totalValuation,
      status: it.status,
    }));
  }, [items]);

  const pieData = useMemo(() => {
    return categories.map((c) => ({
      name: c.categoryLabel,
      value: c.totalValuation,
      skus: c.totalSkus,
    }));
  }, [categories]);

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
              Finished Goods Inventory Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-11">
            Warehouse inventory valuations, on-hand reserves, safety buffers, days of inventory, and dispatch readiness
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
            disabled={loading || items.length === 0}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
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
            <span className="font-semibold">Failed to fetch finished goods inventory data:</span> {error}
          </div>
        </div>
      )}

      {/* KPIs & Analysis */}
      {kpis && (
        <>
          {/* Top KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Valuation */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Value</span>
                  <Coins className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-600 dark:text-cyan-400">
                    ₱{(kpis.totalInventoryValuation / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>₱{kpis.totalInventoryValuation.toLocaleString()} total asset</span>
                </div>
              </CardContent>
            </Card>

            {/* Total On Hand */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">On-Hand Stock</span>
                  <Boxes className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.totalOnHandUnits.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">units</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  {kpis.totalReservedUnits.toLocaleString()} reserved for orders
                </div>
              </CardContent>
            </Card>

            {/* Service Level */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Service Level</span>
                  <PackageCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.fulfillmentReadinessRate}%
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500">ready</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  {kpis.totalAvailableUnits.toLocaleString()} uncommitted units
                </div>
              </CardContent>
            </Card>

            {/* Days of Supply */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Days of Supply</span>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.averageDaysOfSupply}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">days</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Healthy inventory cover</span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Health */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Stock Balance</span>
                  {kpis.lowStockSkus > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.optimalStockSkus} Optimal
                  </span>
                  {kpis.lowStockSkus > 0 && (
                    <span className="text-[11px] font-bold text-rose-500">
                      · {kpis.lowStockSkus} Low
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Across {kpis.totalMonitoredSkus} finished SKUs
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Available vs Reserved by SKU */}
            <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Available vs Reserved Units by Finished SKU
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical stock availability compared with committed customer orders
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
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Inventory Valuation (₱)") return [`₱${Number(val).toLocaleString()}`, name];
                          if (name === "Available Units" || name === "Reserved Units") return [`${Number(val).toLocaleString()}`, name];
                          return [val, name];
                        }}
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.name === label);
                          return item ? `${item.fullName} (${item.name})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="available"
                        name="Available Units"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.status === "LOW_STOCK" ? "#f43f5e" : "#06b6d4"}
                          />
                        ))}
                      </Bar>
                      <Bar
                        yAxisId="left"
                        dataKey="reserved"
                        name="Reserved Units"
                        fill="#fbbf24"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                        opacity={0.8}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Category Valuation Share */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Valuation by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Finished inventory capital breakdown
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
                        formatter={(val: number | string) => [`₱${Number(val).toLocaleString()}`, "Valuation"]}
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

          {/* Category Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((c) => (
              <div
                key={c.category}
                className="bg-muted/15 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{c.categoryLabel}</span>
                  <span className="text-[10px] font-bold text-cyan-500 font-mono">
                    {c.totalSkus} SKUs
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-black tracking-tight text-foreground">
                    ₱{Math.round(c.totalValuation).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{c.totalAvailableUnits.toLocaleString()} avail units</span>
                  <span>{c.averageDaysOfSupply}d DOI</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU code, product name, warehouse bay..."
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
                      {c.categoryLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border/40 bg-card text-foreground"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPTIMAL">Optimal</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OVERSTOCKED">Overstocked</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Finished Goods Inventory Valuation Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredAndSortedItems.length} of {items.length} monitored SKUs
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
                    <th className="p-3">Product Name & Location</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("onHand")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>On Hand</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right">Reserved</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("available")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Available</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right">Unit Value</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("valuation")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Valuation</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort("dos")}>
                      <div className="flex items-center justify-center gap-1">
                        <span>DOI</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedItems.map((it) => (
                    <tr key={it.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {it.productCode}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block truncate max-w-[200px]">
                          {it.productName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[200px]">
                          {it.warehouseLocation}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{it.categoryLabel}</td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {it.onHandQuantity.toLocaleString()} {it.uom}
                      </td>
                      <td className="p-3 text-right text-amber-500 font-medium">
                        {it.reservedQuantity.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-foreground">
                        {it.availableQuantity.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₱{it.unitValue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-cyan-500">
                        ₱{Math.round(it.totalValuation).toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {it.daysOfSupply}d
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            STATUS_BADGES[it.status]
                          }`}
                        >
                          {it.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedItems.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        No finished goods inventory records matching your filter criteria.
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

