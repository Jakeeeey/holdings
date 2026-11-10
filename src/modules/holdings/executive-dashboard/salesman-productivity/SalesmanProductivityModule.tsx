"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Warehouse,
  Coins,
  Receipt,
  Trophy,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { fetchSalesmanProductivity } from "./providers/fetchProvider";
import type {
  SalesmanProductivityKpis,
  SalesmanProductivityItem,
  DepotProductivitySummary,
  ProductivityTier,
} from "./types";

interface ModuleProps {
  groupId: string;
}

const PRODUCTIVITY_TIER_BADGES: Record<ProductivityTier, string> = {
  ELITE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ON_TRACK: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  MODERATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  UNDERPERFORMING: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const PIE_COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

export function SalesmanProductivityModule({ groupId }: ModuleProps) {
  const [kpis, setKpis] = useState<SalesmanProductivityKpis | null>(null);
  const [salesmen, setSalesmen] = useState<SalesmanProductivityItem[]>([]);
  const [depots, setDepots] = useState<DepotProductivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [depotFilter, setDepotFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "revenue" | "invoices" | "dropSize" | "quota" | "customers">("revenue");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSalesmanProductivity({
        groupId,
        tier: tierFilter !== "ALL" ? tierFilter : undefined,
        branchId: depotFilter !== "ALL" ? Number(depotFilter) : undefined,
        force,
      });

      setKpis(res.kpis);
      setSalesmen(res.salesmen || []);
      setDepots(res.depots || []);
    } catch (err) {
      console.warn(`[SalesmanProductivityModule] Error for group ${groupId}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load salesman productivity intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, tierFilter, depotFilter]);

  // Filtered & Sorted salesmen
  const processedSalesmen = useMemo(() => {
    let result = [...salesmen];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.truckPlate && s.truckPlate.toLowerCase().includes(q)) ||
          s.branchName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "invoices":
          comparison = a.invoiceCount - b.invoiceCount;
          break;
        case "dropSize":
          comparison = a.averageDropSize - b.averageDropSize;
          break;
        case "quota":
          comparison = a.quotaAchievementRate - b.quotaAchievementRate;
          break;
        case "customers":
          comparison = a.uniqueCustomersCount - b.uniqueCustomersCount;
          break;
        case "revenue":
        default:
          comparison = a.totalRevenue - b.totalRevenue;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [salesmen, searchTerm, sortField, sortAsc]);

  // Pagination slice
  const paginatedSalesmen = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSalesmen.slice(start, start + pageSize);
  }, [processedSalesmen, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedSalesmen.length / pageSize));

  // CSV Export
  const handleExportCSV = () => {
    if (processedSalesmen.length === 0) return;
    const headers = [
      "Salesman ID",
      "Salesman Code",
      "Salesman Name",
      "Depot Hub",
      "Truck Plate",
      "Productive Invoices",
      "Accounts Served",
      "Total Sales Revenue",
      "Average Drop Size",
      "Quota Target",
      "Quota Achievement %",
      "Productivity Tier",
      "Latest Active Date",
    ];
    const rows = processedSalesmen.map((s) => [
      s.salesmanId,
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.branchName.replace(/"/g, '""')}"`,
      s.truckPlate || "",
      s.invoiceCount,
      s.uniqueCustomersCount,
      s.totalRevenue,
      s.averageDropSize,
      s.targetAmount,
      s.quotaAchievementRate,
      s.tier,
      s.latestInvoiceDate || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `salesman_productivity_report_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const topLeaderboardData = useMemo(() => {
    return salesmen.slice(0, 8).map((s) => ({
      name: s.name.length > 14 ? `${s.name.slice(0, 14)}...` : s.name,
      fullName: s.name,
      revenue: s.totalRevenue,
      dropSize: s.averageDropSize,
      quota: s.quotaAchievementRate,
    }));
  }, [salesmen]);

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
            <Users className="h-6 w-6 text-cyan-500" />
            Salesman Productivity & Field Performance Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Field sales representative output, productive strike rates, drop size analysis, and quota attainment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs font-bold gap-1.5 border-border/60"
            disabled={processedSalesmen.length === 0}
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
              <span className="text-[10px] font-black uppercase tracking-wider">Field Sales</span>
              <Coins className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              {(kpis?.activeSalesmenCount || 0).toLocaleString()} Active Field Reps
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Productive Invoices */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Productive Strikes</span>
              <Receipt className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.totalInvoicesCount || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Sales Invoices Generated
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Outlets Reached */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Active Outlets</span>
              <Warehouse className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {(kpis?.totalOutletsReached || 0).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Buying Store Accounts
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Average Drop Size */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Avg Drop Size</span>
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.averageDropSize || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Order Value / Invoice
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Quota Attainment */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Quota Attainment</span>
              <Target className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16 bg-emerald-500/10" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {kpis?.averageQuotaAttainment || 0}%
              </div>
            )}
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
              {(kpis?.eliteRepsCount || 0)} Elite Reps
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Top Field Performer */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider">Top Performer</span>
              <ShieldCheck className="h-3.5 w-3.5 text-yellow-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-xs sm:text-sm font-black tracking-tight text-foreground truncate">
                {kpis?.topPerformerName || "N/A"}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground truncate">
              ₱{(kpis?.topPerformerRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Sales
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Top Reps Leaderboard (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              Sales Representative Commercial Output & Average Drop Size
            </CardTitle>
            <CardDescription className="text-xs">
              Total Invoiced Revenue in Philippine Pesos (Left, Bars) and Average Drop Size (Right, Tooltip)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topLeaderboardData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="currentColor"
                    opacity={0.6}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                    }}
                    formatter={(val: number | string) => [
                      `₱${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Sales Generated",
                    ]}
                    labelFormatter={(_: string, payload: readonly { payload?: { fullName?: string; quota?: number; dropSize?: number } }[]) => {
                      const item = payload[0]?.payload;
                      if (!item) return "";
                      return `${item.fullName} • ${item.quota}% Quota • ₱${(item.dropSize || 0).toLocaleString()} Drop Size`;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
                  <Bar
                    dataKey="revenue"
                    name="Invoiced Revenue"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  >
                    {topLeaderboardData.map((_, index) => (
                      <Cell key={`cell-lead-mod-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Depot Sales Distribution (1 Col) */}
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-500" />
              Depot Hub Sales Share
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue distribution across regional distribution branches
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col justify-between">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={depots}
                    dataKey="totalRevenue"
                    nameKey="branchName"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {depots.map((_, index) => (
                      <Cell key={`cell-depot-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                      "Hub Sales",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              {depots.slice(0, 4).map((d, idx) => (
                <div key={d.branchId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{d.branchName}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    ₱{d.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STRATEGIC COACHING & FIELD ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
            <Trophy className="h-4 w-4" />
            Top Performer Recognition & Incentives
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kpis?.eliteRepsCount || 0} field representatives have met or exceeded their quota benchmark. Scale their effective route visit techniques across other van sales territories.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            Drop Size & Basket Optimization
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Average order drop size is ₱{(kpis?.averageDropSize || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}. Introduce bundle pricing on oils and condiments to increase average line items per invoice.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
            <Target className="h-4 w-4" />
            Underperforming Rep Route Review
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kpis?.underperformingRepsCount || 0} sales representatives are currently operating below 60% of their quota. Conduct joint field calls and reassess outlet territory allocation.
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
                placeholder="Search by salesman name, code, truck plate, or depot..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Depot Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={depotFilter}
                onChange={(e) => {
                  setDepotFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring w-full md:w-56"
              >
                <option value="ALL">All Depot Hubs</option>
                {depots.map((d) => (
                  <option key={d.branchId} value={String(d.branchId)}>
                    {d.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tier Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-black uppercase tracking-wider scrollbar-none pt-1">
            <span className="text-muted-foreground/60 text-[9px] mr-1">Productivity Tier:</span>
            {(["ALL", "ELITE", "ON_TRACK", "MODERATE", "UNDERPERFORMING"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTierFilter(t);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-full transition-all border whitespace-nowrap ${
                  tierFilter === t
                    ? "bg-foreground text-background border-foreground font-black"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
              >
                {t === "ALL" ? "All Sales Reps" : t.replace("_", " ")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COMPREHENSIVE SALESMAN PRODUCTIVITY TABLE */}
      <Card className="border-border/60">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider">
              Field Sales Representative Roster ({processedSalesmen.length.toLocaleString()} matching records)
            </CardTitle>
            <CardDescription className="text-xs">
              Live commercial output, productive strikes, active accounts reach, drop sizes, and quota completion
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
                      Salesman Name & Code
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3">Depot Hub</th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("invoices")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Invoices
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("customers")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Outlets
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("revenue")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Sales Revenue (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("dropSize")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                    >
                      Avg Drop (₱)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("quota")}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                    >
                      Quota %
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-center">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedSalesmen.map((s) => (
                  <tr key={s.salesmanId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground truncate max-w-[220px] sm:max-w-[320px]">
                        {s.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{s.code}</span>
                        {s.truckPlate && <span>• {s.truckPlate}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                      {s.branchName}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {s.invoiceCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {s.uniqueCustomersCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">
                      ₱{s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-medium text-muted-foreground">
                      ₱{s.averageDropSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 text-center font-black text-foreground">
                      {s.quotaAchievementRate}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          PRODUCTIVITY_TIER_BADGES[s.tier]
                        }`}
                      >
                        {s.tier.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedSalesmen.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                      No sales representatives match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {Math.min(processedSalesmen.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(processedSalesmen.length, currentPage * pageSize)} of {processedSalesmen.length.toLocaleString()}{" "}
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
