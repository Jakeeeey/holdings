"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "recharts";
import { fetchPurchases } from "@/modules/holdings/executive-dashboard/purchases/providers/fetchProvider";
import type {
  PurchaseOrderKpis,
  PurchaseOrderRecord,
  SupplierSpendSummary,
  MonthlySpendTrend,
  PurchaseInventoryStatus,
} from "@/modules/holdings/executive-dashboard/purchases/types";

export interface PurchasesPreviewCardProps {
  group: {
    id: number;
    group_name?: string;
    category?: string;
    [key: string]: unknown;
  };
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

export function PurchasesPreviewCard({
  group,
  startDate,
  endDate,
}: PurchasesPreviewCardProps) {
  const [kpis, setKpis] = useState<PurchaseOrderKpis | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<SupplierSpendSummary[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlySpendTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"chart" | "cards" | "table">("chart");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPurchases({
        groupId: group.id,
        startDate,
        endDate,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setOrders(res.orders || []);
      setTopSuppliers(res.topSuppliers || []);
      setMonthlyTrends(res.monthlyTrends || []);
    } catch (err) {
      console.warn(`[PurchasesPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load purchases data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate, statusFilter]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.inventoryStatusKey === statusFilter);
  }, [orders, statusFilter]);

  const chartData = useMemo(() => {
    if (monthlyTrends.length > 0) {
      return monthlyTrends.map((t) => ({
        label: t.month,
        spend: Math.round(t.spend / 1000), // in ₱K
        orderCount: t.orderCount,
        receivedSpend: Math.round(t.receivedSpend / 1000),
      }));
    }
    return topSuppliers.slice(0, 6).map((s) => ({
      label: s.supplierName.length > 14 ? `${s.supplierName.slice(0, 14)}...` : s.supplierName,
      spend: Math.round(s.totalSpend / 1000),
      orderCount: s.orderCount,
      receivedSpend: Math.round((s.totalSpend * (s.fulfillmentRate / 100)) / 1000),
    }));
  }, [monthlyTrends, topSuppliers]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden hover:border-border/80 transition-all duration-300">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                SUPPLY CHAIN & PROCUREMENT INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                PURCHASES & PROCUREMENT
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Purchases"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Purchase order tracking, supplier spend concentration, fulfillment rates, and delivery pipelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40">
              <Button
                variant={viewMode === "chart" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="Chart View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trend</span>
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="Suppliers Grid"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Suppliers</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                title="PO Ledger"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Orders</span>
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading}
              className="h-8 w-8 p-0"
              title="Refresh Purchases"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {/* Deep Dive Link */}
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/purchases`}>
              <Button
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
              >
                <span>Deep-Dive</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { key: "ALL", label: "All POs" },
            { key: "RECEIVED", label: "Received" },
            { key: "PARTIALLY_RECEIVED", label: "Partially Received" },
            { key: "FOR_RECEIVING", label: "For Receiving" },
            { key: "APPROVED", label: "Approved" },
            { key: "REQUESTED", label: "Requested" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                statusFilter === item.key
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">Notice:</span> {error} (Displaying live cached catalog data)
            </span>
          </div>
        )}

        {/* 5-KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* KPI 1: Total Spend */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total PO Spend</span>
              <ShoppingBag className="h-4 w-4 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  ₱{(kpis?.totalSpend || 0) >= 1000000
                    ? `${((kpis?.totalSpend || 0) / 1000000).toFixed(2)}M`
                    : `${((kpis?.totalSpend || 0) / 1000).toFixed(0)}K`}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Across {kpis?.totalOrders || 0} purchase orders
                </p>
              </div>
            )}
          </div>

          {/* KPI 2: Fulfillment Rate % */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Fulfillment Rate</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {kpis?.fulfillmentRate || 0}%
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground font-medium">Target: &ge; 85.0%</span>
                </div>
              </div>
            )}
          </div>

          {/* KPI 3: Received / In-Progress POs */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Received & Partial</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {(kpis?.receivedOrders || 0) + (kpis?.partiallyReceivedOrders || 0)}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {kpis?.receivedOrders || 0} Full · {kpis?.partiallyReceivedOrders || 0} Partial
                </p>
              </div>
            )}
          </div>

          {/* KPI 4: Pending / In-Transit */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending Delivery</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {kpis?.pendingOrders || 0}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Awaiting fulfillment / QA</p>
              </div>
            )}
          </div>

          {/* KPI 5: Active Suppliers */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Suppliers</span>
              <Building2 className="h-4 w-4 text-violet-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {kpis?.activeSuppliersCount || 0}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium truncate" title={kpis?.topSupplierName}>
                  Top: {kpis?.topSupplierName || "None"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Views Container */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* VIEW 1: CHART VIEW */}
            {viewMode === "chart" && (
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Monthly Spend Trend & Order Volume
                    </h4>
                    <p className="text-[11px] text-muted-foreground/70">
                      Total procurement spend (₱ Thousands) alongside received inventory volume
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    Last 6 Months
                  </Badge>
                </div>

                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="spend"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₱${v}k`}
                      />
                      <YAxis
                        yAxisId="orders"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Total Spend (₱K)" || name === "Received (₱K)") {
                            return [`₱${Number(val).toLocaleString()}K`, name];
                          }
                          return [val, name];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                        iconType="circle"
                      />
                      <Bar
                        yAxisId="spend"
                        dataKey="spend"
                        name="Total Spend (₱K)"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        yAxisId="spend"
                        dataKey="receivedSpend"
                        name="Received (₱K)"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="orderCount"
                        name="PO Count"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#6366f1" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VIEW 2: TOP SUPPLIERS CARDS GRID */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topSuppliers.slice(0, 6).map((supp, idx) => (
                  <div
                    key={supp.supplierId || idx}
                    className="p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:border-amber-500/40 hover:bg-muted/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground/60">
                            #{idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-foreground line-clamp-1" title={supp.supplierName}>
                            {supp.supplierName}
                          </h5>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                          {supp.supplierType || "TRADE"}
                        </Badge>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${
                          supp.fulfillmentRate >= 85
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {supp.fulfillmentRate}% Fulfilled
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">Total Spend</span>
                        <span className="text-sm font-black text-foreground">
                          ₱{supp.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                        <span>Orders Count</span>
                        <span className="font-semibold text-foreground">{supp.orderCount} POs</span>
                      </div>
                      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                        <span>Avg Order Value</span>
                        <span className="font-semibold text-foreground">₱{supp.averageOrderValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: RECENT POs TABLE LEDGER */}
            {viewMode === "table" && (
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="overflow-x-auto max-h-[280px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/50 sticky top-0 border-b border-border/40 z-10">
                      <tr>
                        <th className="py-2 px-3 font-bold text-muted-foreground">PO Number</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground">Date</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground">Supplier</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-right">Amount (₱)</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredOrders.slice(0, 7).map((order) => {
                        const badgeStyle =
                          INVENTORY_BADGES[order.inventoryStatusKey] || INVENTORY_BADGES.UNKNOWN;
                        return (
                          <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                              {order.poNo}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                              {order.date}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground max-w-[180px] truncate" title={order.supplierName}>
                              {order.supplierName}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-foreground text-right">
                              ₱{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge variant="outline" className={`text-[10px] font-bold ${badgeStyle}`}>
                                {order.inventoryStatusText}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                            No purchase orders found matching selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Audit Strip */}
        <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted-foreground gap-2">
          <div className="flex items-center gap-1.5">
            <Truck className="h-3 w-3 text-amber-500" />
            <span>
              Real-time purchase order lifecycle tracking with automated goods receiving logs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Directus Live Gateway · Container 5 (Distribution)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
