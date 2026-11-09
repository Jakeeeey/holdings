"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
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
import { fetchPurchases } from "./providers/fetchProvider";
import type {
  PurchaseOrderKpis,
  PurchaseOrderRecord,
  SupplierSpendSummary,
  MonthlySpendTrend,
  PurchaseInventoryStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const INVENTORY_BADGES: Record<PurchaseInventoryStatus, string> = {
  RECEIVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PARTIALLY_RECEIVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  FOR_RECEIVING: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  FOR_DELIVERY: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  FOR_PICKUP: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  APPROVED: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  REQUESTED: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border/40",
  UNKNOWN: "bg-muted text-muted-foreground border-border/40",
};

const PIE_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#06b6d4", "#8b5cf6", "#64748b"];

export function PurchasesModule({ groupId, startDate, endDate }: ModuleProps) {
  const [kpis, setKpis] = useState<PurchaseOrderKpis | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<SupplierSpendSummary[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlySpendTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"date" | "totalAmount" | "poNo" | "supplier">("date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPurchases({
        groupId,
        startDate,
        endDate,
        supplierId: selectedSupplierId !== "ALL" ? Number(selectedSupplierId) : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setOrders(res.orders || []);
      setTopSuppliers(res.topSuppliers || []);
      setMonthlyTrends(res.monthlyTrends || []);
    } catch (err) {
      console.warn(`[PurchasesModule] Error for group ${groupId}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load purchases intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate, selectedSupplierId, statusFilter]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.poNo.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.inventoryStatusText.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.inventoryStatusKey === statusFilter);
    }

    if (selectedSupplierId !== "ALL") {
      list = list.filter((o) => String(o.supplierId) === selectedSupplierId);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.date.localeCompare(b.date);
      } else if (sortField === "totalAmount") {
        cmp = a.totalAmount - b.totalAmount;
      } else if (sortField === "poNo") {
        cmp = a.poNo.localeCompare(b.poNo);
      } else if (sortField === "supplier") {
        cmp = a.supplierName.localeCompare(b.supplierName);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [orders, searchTerm, statusFilter, selectedSupplierId, sortField, sortAsc]);

  const toggleSort = (field: "date" | "totalAmount" | "poNo" | "supplier") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = ["PO Number", "Date", "Supplier", "Gross Amount", "Total Amount", "Status", "Payment Status"];
    const rows = filteredOrders.map((o) => [
      `"${o.poNo}"`,
      `"${o.date}"`,
      `"${o.supplierName.replace(/"/g, '""')}"`,
      o.grossAmount,
      o.totalAmount,
      `"${o.inventoryStatusText}"`,
      `"${o.paymentStatusText}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `purchases_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieChartData = useMemo(() => {
    return topSuppliers.slice(0, 6).map((s) => ({
      name: s.supplierName,
      value: s.totalSpend,
    }));
  }, [topSuppliers]);

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
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full"
          >
            PROCUREMENT & PURCHASES
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
            disabled={filteredOrders.length === 0}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card/90 to-amber-500/5 p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          <Truck className="h-4 w-4 text-amber-500" />
          <span>Procurement & Inbound Supply Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Purchases & Vendor Spend Intelligence
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Comprehensive executive oversight of corporate purchasing, fulfillment status pipelines, supplier concentration risk, and historical delivery performance across all business units.
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

      {/* 5-KPI Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Spend */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total PO Spend</span>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                ₱{(kpis?.totalSpend || 0) >= 1000000
                  ? `${((kpis?.totalSpend || 0) / 1000000).toFixed(2)}M`
                  : `${((kpis?.totalSpend || 0) / 1000).toFixed(0)}K`}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                Across {kpis?.totalOrders || 0} orders
              </p>
            </div>
          )}
        </div>

        {/* KPI 2: Fulfillment Rate */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fulfillment Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.fulfillmentRate || 0}%
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground font-medium">Target &ge; 85%</span>
              </div>
            </div>
          )}
        </div>

        {/* KPI 3: Fully Received */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Received POs</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.receivedOrders || 0}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                {kpis?.partiallyReceivedOrders || 0} partial shipments
              </p>
            </div>
          )}
        </div>

        {/* KPI 4: Pending Deliveries */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Orders</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.pendingOrders || 0}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Awaiting receipt / QA</p>
            </div>
          )}
        </div>

        {/* KPI 5: Active Vendors */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Suppliers</span>
            <Building2 className="h-4 w-4 text-violet-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {kpis?.activeSuppliersCount || 0}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate" title={kpis?.topSupplierName}>
                Top: {kpis?.topSupplierName || "None"}
              </p>
            </div>
          )}
        </div>

        {/* KPI 6: Average PO Value */}
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg PO Value</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                ₱{((kpis?.averageOrderValue || 0) / 1000).toFixed(0)}K
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Mean batch size</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section: Monthly Trend & Supplier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composed Chart: Monthly Spend */}
        <Card className="lg:col-span-2 border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <span>Monthly Spend Trend & PO Volume</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical monthly spend progression (₱ Thousands) and inbound order count
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Procurement Trend
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyTrends.map((t) => ({
                    month: t.month,
                    spend: Math.round(t.spend / 1000),
                    receivedSpend: Math.round(t.receivedSpend / 1000),
                    orderCount: t.orderCount,
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="spend"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₱${v}k`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
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
                      if (name === "Total Spend (₱K)" || name === "Received (₱K)") {
                        return [`₱${Number(val).toLocaleString()}K`, name];
                      }
                      return [val, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" />
                  <Bar
                    yAxisId="spend"
                    dataKey="spend"
                    name="Total Spend (₱K)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="spend"
                    dataKey="receivedSpend"
                    name="Received (₱K)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orderCount"
                    name="PO Count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart: Supplier Concentration */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-violet-500" />
                  <span>Spend by Top Supplier</span>
                </CardTitle>
                <CardDescription className="text-xs">Budget allocation concentration</CardDescription>
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
                      "Spend",
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
                  <span className="font-semibold text-foreground text-[11px]">
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
                <ShoppingBag className="h-4 w-4 text-amber-500" />
                <span>Purchase Orders Master Ledger</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredOrders.length} of {orders.length} purchase orders
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search PO #, supplier..."
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
                  <option value="RECEIVED">Received</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="FOR_RECEIVING">For Receiving</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REQUESTED">Requested</option>
                </select>
              </div>

              {/* Supplier Filter */}
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-muted/40 border border-border/40 rounded-lg text-xs font-semibold h-8 px-2.5 focus:outline-none max-w-[160px] truncate"
              >
                <option value="ALL">All Suppliers</option>
                {topSuppliers.map((s) => (
                  <option key={s.supplierId} value={String(s.supplierId)}>
                    {s.supplierName}
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
                    onClick={() => toggleSort("poNo")}
                    className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>PO Number</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("date")}
                    className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("supplier")}
                    className="py-3 px-4 font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Supplier</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("totalAmount")}
                    className="py-3 px-4 font-bold text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Amount (₱)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-bold text-muted-foreground text-center">
                    Inventory Status
                  </th>
                  <th className="py-3 px-4 font-bold text-muted-foreground text-center">
                    Payment Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredOrders.map((order) => {
                  const badgeStyle =
                    INVENTORY_BADGES[order.inventoryStatusKey] || INVENTORY_BADGES.UNKNOWN;
                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {order.poNo}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                        {order.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-[220px] truncate" title={order.supplierName}>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{order.supplierName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground text-right">
                        ₱{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={`text-[10px] font-bold ${badgeStyle}`}>
                          {order.inventoryStatusText}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/30">
                          {order.paymentStatusText}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                      No purchase orders found matching the filter criteria.
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
