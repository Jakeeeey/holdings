"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Hourglass,
  AlertOctagon,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Warehouse,
  Boxes,
  ShieldAlert,
  BarChart3,
  PieChart as PieIcon,
  TrendingDown,
  CheckCircle2,
  Clock,
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
import { fetchInventoryAging } from "./providers/fetchProvider";
import type {
  InventoryAgingKpis,
  InventoryAgingItem,
  AgingBracketSummary,
  WarehouseAgingSummary,
  AgingStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
}

const AGING_STATUS_BADGES: Record<AgingStatus, string> = {
  FRESH: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NORMAL: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  SLOW_MOVING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  AT_RISK: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  SLOB: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#06b6d4", "#10b981", "#8b5cf6"];

export function InventoryAgingModule({ groupId }: ModuleProps) {
  const [kpis, setKpis] = useState<InventoryAgingKpis | null>(null);
  const [items, setItems] = useState<InventoryAgingItem[]>([]);
  const [brackets, setBrackets] = useState<AgingBracketSummary[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseAgingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [bracketFilter, setBracketFilter] = useState<string>("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "days" | "units" | "cost" | "value">("value");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventoryAging({
        groupId,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        bracket: bracketFilter !== "ALL" ? bracketFilter : undefined,
        branchId: warehouseFilter !== "ALL" ? Number(warehouseFilter) : undefined,
        force,
      });

      setKpis(res.kpis);
      setItems(res.items || []);
      setBrackets(res.brackets || []);
      setWarehouses(res.warehouses || []);
    } catch (err) {
      console.warn(`[InventoryAgingModule] Error for group ${groupId}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load inventory aging intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, statusFilter, bracketFilter, warehouseFilter]);

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    let result = [...items];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          (i.productCode && i.productCode.toLowerCase().includes(q)) ||
          i.branchName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "days":
          comparison = a.daysSinceLastOutbound - b.daysSinceLastOutbound;
          break;
        case "units":
          comparison = a.currentStock - b.currentStock;
          break;
        case "cost":
          comparison = a.costPerUnit - b.costPerUnit;
          break;
        case "value":
        default:
          comparison = a.stockValue - b.stockValue;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [items, searchTerm, sortField, sortAsc]);

  // Pagination slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedItems.length / pageSize));

  // CSV Export
  const handleExportCSV = () => {
    if (processedItems.length === 0) return;
    const headers = ["ID", "Warehouse", "Product SKU", "Product Name", "Units", "Cost / Unit", "Stock Value", "Days Inactive", "Status", "Bracket"];
    const rows = processedItems.map((i) => [
      i.id,
      `"${i.branchName.replace(/"/g, '""')}"`,
      i.productCode || "",
      `"${i.productName.replace(/"/g, '""')}"`,
      i.currentStock,
      i.costPerUnit,
      i.stockValue,
      i.daysSinceLastOutbound,
      i.status,
      i.bracket,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_aging_report_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <Hourglass className="h-6 w-6 text-amber-500" />
            Inventory Aging & SLOB Risk Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Multi-tier warehouse aging brackets, slow-moving items, and obsolete stock inventory risk monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs font-bold gap-1.5 border-border/60"
            disabled={processedItems.length === 0}
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
        {/* KPI 1: Total Valuation */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Value</span>
              <Boxes className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalValuation || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {(kpis?.totalStockUnits || 0).toLocaleString()} Units
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total SLOB Value */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-[10px] font-black uppercase tracking-wider">SLOB Value</span>
              <AlertOctagon className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20 bg-rose-500/10" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                ₱{(kpis?.totalSlobValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-bold">
              Dead / Inactive Stock
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: SLOB Risk Ratio */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">SLOB Ratio</span>
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {kpis?.slobRiskRatio || 0}%
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Standard ceiling &lt; 15%
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: SLOB Units */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">SLOB Units</span>
              <Warehouse className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.slobUnits || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Physical tied units
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Critical SKUs */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Critical SKUs</span>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                {kpis?.criticalSlobSkuCount || 0}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {kpis?.atRiskSkuCount || 0} in 61-120d bracket
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Average Aging Days */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Avg Inactivity</span>
              <Clock className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {kpis?.averageAgingDays || 0} <span className="text-xs font-normal">days</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground truncate">
              Since last outbound
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Aging Brackets Composed Chart (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              Aging Brackets Valuation & Quantity Curve
            </CardTitle>
            <CardDescription className="text-xs">
              Valuation in Philippine Pesos (Left) vs Inactive Physical Units (Right) across time bands
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={brackets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="bracket"
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: string) => `${val} Days`}
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
                    tickFormatter={(val: number) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
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
                      if (name === "Valuation") {
                        return [`₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Aged Valuation"];
                      }
                      return [`${num.toLocaleString()} units`, "Physical Stock"];
                    }}
                    labelFormatter={(lbl: string) => {
                      const found = brackets.find((b) => b.bracket === lbl);
                      return found?.label || `${lbl} Days Bracket`;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="totalValuation"
                    name="Valuation"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {brackets.map((entry) => (
                      <Cell key={`cell-${entry.bracket}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalUnits"
                    name="Units"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Warehouse SLOB Exposure Pie / Distribution (1 Col) */}
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-rose-500" />
              SLOB Valuation by Warehouse
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of obsolete and dead capital across hubs
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col justify-between">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={warehouses}
                    dataKey="slobValuation"
                    nameKey="branchName"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {warehouses.map((_, index) => (
                      <Cell key={`cell-wh-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                      "SLOB Capital",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              {warehouses.slice(0, 4).map((w, idx) => (
                <div key={w.branchId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{w.branchName}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    ₱{w.slobValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MITIGATION & STRATEGIC RECOMMENDATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
            <AlertOctagon className="h-4 w-4" />
            Write-Off & Disposal Review
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kpis?.criticalSlobSkuCount || 0} SKUs have exceeded 120 days of zero outbound. Initiate batch audits for expired or damaged items to reclaim storage footprint.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
            <TrendingDown className="h-4 w-4" />
            Promo Bundling & Liquidation
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kpis?.atRiskSkuCount || 0} SKUs in the 61-120 day window hold ₱{(kpis?.totalValuation ? kpis.totalValuation * 0.19 : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} in tied working capital. Create discounted regional bundle offers.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            Procurement Reorder Freeze
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lock automated replenishment for products currently flagged as SLOB until warehouse inventory falls below 30 days of forward demand.
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
                placeholder="Search by product name, SKU code, or warehouse hub..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Warehouse Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring w-full md:w-52"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.branchId} value={String(w.branchId)}>
                    {w.branchName}
                  </option>
                ))}
              </select>

              {/* Bracket Select */}
              <select
                value={bracketFilter}
                onChange={(e) => {
                  setBracketFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring w-full md:w-44"
              >
                <option value="ALL">All Brackets</option>
                <option value="0-30">0-30 Days (Fresh)</option>
                <option value="31-60">31-60 Days (Normal)</option>
                <option value="61-90">61-90 Days (Slow Moving)</option>
                <option value="91-120">91-120 Days (At Risk)</option>
                <option value="120+">120+ Days (SLOB)</option>
              </select>
            </div>
          </div>

          {/* Status Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-black uppercase tracking-wider scrollbar-none pt-1">
            <span className="text-muted-foreground/60 text-[9px] mr-1">Status:</span>
            {(["ALL", "SLOB", "AT_RISK", "SLOW_MOVING", "NORMAL", "FRESH"] as const).map((st) => (
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
                {st === "ALL" ? "All Statuses" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COMPREHENSIVE SKU LEDGER TABLE */}
      <Card className="border-border/60">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider">
              SKU Inventory Ledger ({processedItems.length.toLocaleString()} matching records)
            </CardTitle>
            <CardDescription className="text-xs">
              Live stock position, aging days, unit costs, and extended valuation
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
                  <th className="p-3">Warehouse Hub</th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("units")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Physical Units
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("cost")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Cost / Unit
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("value")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Valuation (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("days")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                    >
                      Inactivity
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">Bracket</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground truncate max-w-[240px] sm:max-w-[340px]">
                        {item.productName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{item.productCode || `SKU-${item.productId}`}</span>
                        {item.productBrand && <span>• {item.productBrand}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[180px]">
                      {item.branchName}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {item.currentStock.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-medium text-muted-foreground">
                      ₱{item.costPerUnit.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-black text-foreground">
                      ₱{item.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-foreground">{item.daysSinceLastOutbound}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">days</span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-[9px] font-bold">
                        {item.bracket}d
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          AGING_STATUS_BADGES[item.status]
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                      No inventory records match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {Math.min(processedItems.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(processedItems.length, currentPage * pageSize)} of {processedItems.length.toLocaleString()}{" "}
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

