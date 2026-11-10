"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Coins,
  Receipt,
  Warehouse,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { fetchSalesmanProductivity } from "@/modules/holdings/executive-dashboard/salesman-productivity/providers/fetchProvider";
import type {
  SalesmanProductivityKpis,
  SalesmanProductivityItem,
  DepotProductivitySummary,
  ProductivityTier,
} from "@/modules/holdings/executive-dashboard/salesman-productivity/types";

export interface SalesmanProductivityPreviewCardProps {
  group: {
    id: number;
    group_name?: string;
    category?: string;
    [key: string]: unknown;
  };
  startDate?: string;
  endDate?: string;
}

const PRODUCTIVITY_TIER_BADGES: Record<ProductivityTier, string> = {
  ELITE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ON_TRACK: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  MODERATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  UNDERPERFORMING: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const BAR_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#f59e0b", "#94a3b8"];

export function SalesmanProductivityPreviewCard({
  group,
  startDate,
  endDate,
}: SalesmanProductivityPreviewCardProps) {
  const [kpis, setKpis] = useState<SalesmanProductivityKpis | null>(null);
  const [salesmen, setSalesmen] = useState<SalesmanProductivityItem[]>([]);
  const [depots, setDepots] = useState<DepotProductivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"leaderboard" | "depots" | "roster">("leaderboard");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSalesmanProductivity({
        groupId: group.id,
        startDate,
        endDate,
        tier: tierFilter !== "ALL" ? tierFilter : undefined,
        force,
      });

      setKpis(res.kpis);
      setSalesmen(res.salesmen || []);
      setDepots(res.depots || []);
    } catch (err) {
      console.warn(`[SalesmanProductivityPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load salesman productivity data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate, tierFilter]);

  const filteredSalesmen = useMemo(() => {
    if (tierFilter === "ALL") return salesmen;
    return salesmen.filter((s) => s.tier === tierFilter);
  }, [salesmen, tierFilter]);

  const topChartData = useMemo(() => {
    const nameCounts: Record<string, number> = {};
    salesmen.forEach((s) => {
      nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
    });

    return filteredSalesmen.slice(0, 6).map((s) => {
      const isDuplicateName = (nameCounts[s.name] || 0) > 1;
      const displayLabel = isDuplicateName ? `${s.name} (${s.code})` : s.name;
      return {
        name: displayLabel.length > 20 ? `${displayLabel.slice(0, 20)}...` : displayLabel,
        fullName: isDuplicateName ? `${s.name} (${s.code})` : s.name,
        revenue: s.totalRevenue,
        quota: s.quotaAchievementRate,
        dropSize: s.averageDropSize,
        tier: s.tier,
      };
    });
  }, [filteredSalesmen, salesmen]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 w-full overflow-hidden border border-border/60 bg-gradient-to-b from-card to-card/70 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* TOP BAR / CARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-cyan-500" />
                COMMERCIAL & DISTRIBUTION INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-bold px-1.5 py-0 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5"
              >
                LIVE ENGINE
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
                {group.group_name || "Salesman Productivity & Quota Monitor"}
              </h2>
            </div>
          </div>

          {/* VIEW SWITCHER & CONTROLS */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("leaderboard")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "leaderboard"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setViewMode("depots")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "depots"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Depots
              </button>
              <button
                type="button"
                onClick={() => setViewMode("roster")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === "roster"
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3 w-3" />
                Roster
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Refresh Real-time Sales Rep Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 5-KPI METRIC RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* KPI 1: Total Field Revenue */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Field Sales</span>
              <Coins className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Across {(kpis?.activeSalesmenCount || 0).toLocaleString()} Active Field Reps
            </div>
          </div>

          {/* KPI 2: Productive Invoices (Strikes) */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Productive Strikes</span>
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
              {(kpis?.totalOutletsReached || 0).toLocaleString()} Outlets Reached
            </div>
          </div>

          {/* KPI 3: Average Drop Size */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Avg Drop Size</span>
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-black tracking-tight text-foreground">
                ₱{(kpis?.averageDropSize || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Average Order Value
            </div>
          </div>

          {/* KPI 4: Quota Attainment */}
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Quota Attainment</span>
              <Target className="h-3.5 w-3.5" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16 bg-emerald-500/10" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {kpis?.averageQuotaAttainment || 0}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">team avg</span>
              </div>
            )}
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
              {(kpis?.eliteRepsCount || 0)} Elite Quota Achievers
            </div>
          </div>

          {/* KPI 5: Top Sales Rep */}
          <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Performer</span>
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-xs sm:text-sm font-black tracking-tight text-foreground truncate">
                {kpis?.topPerformerName || "N/A"}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              ₱{(kpis?.topPerformerRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Sales
            </div>
          </div>
        </div>

        {/* TIER FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-black uppercase tracking-wider scrollbar-none">
          <span className="text-muted-foreground/60 text-[9px] mr-1">Filter Tier:</span>
          {(["ALL", "ELITE", "ON_TRACK", "MODERATE", "UNDERPERFORMING"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded-full transition-all border whitespace-nowrap ${
                tierFilter === t
                  ? "bg-foreground text-background border-foreground shadow-xs font-black"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
              }`}
            >
              {t === "ALL" ? "All Sales Reps" : t.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN BODY TOGGLE */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* VIEW 1: LEADERBOARD CHART */}
            {viewMode === "leaderboard" && (
              <div className="space-y-3">
                <div className="h-60 sm:h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={topChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="currentColor"
                        opacity={0.8}
                        tick={{ fontSize: 11, fontWeight: "bold" }}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(val: number | string) => [
                          `₱${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          "Total Sales",
                        ]}
                        labelFormatter={(_: string, payload: readonly { payload?: { fullName?: string; quota?: number; dropSize?: number } }[]) => {
                          const item = payload[0]?.payload;
                          if (!item) return "";
                          return `${item.fullName} • ${item.quota}% Quota • ₱${(item.dropSize || 0).toLocaleString()} Drop`;
                        }}
                      />
                      <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {topChartData.map((_, index) => (
                          <Cell key={`cell-lead-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VIEW 2: DEPOTS GRID */}
            {viewMode === "depots" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {depots.map((d) => (
                  <div
                    key={d.branchId}
                    className="p-3.5 rounded-xl border border-border/40 bg-card/40 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        <Warehouse className="h-4 w-4 text-cyan-500 shrink-0" />
                        <span className="text-xs font-black text-foreground tracking-tight truncate">{d.branchName}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black tracking-wider ${
                          d.averageQuotaAttainment >= 90
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {d.averageQuotaAttainment}% Quota
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Depot Sales</div>
                        <div className="font-bold text-foreground">
                          ₱{d.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Drop Size</div>
                        <div className="font-bold text-foreground">
                          ₱{d.averageDropSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span>{d.salesmanCount} Active Sales Reps</span>
                      <span>{d.invoiceCount} Productive Invoices</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: ROSTER TABLE */}
            {viewMode === "roster" && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border/40 text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Salesman Name / Code</th>
                        <th className="p-2.5">Depot</th>
                        <th className="p-2.5 text-right">Invoices</th>
                        <th className="p-2.5 text-right">Sales Revenue</th>
                        <th className="p-2.5 text-right">Avg Drop Size</th>
                        <th className="p-2.5 text-center">Quota %</th>
                        <th className="p-2.5 text-center">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredSalesmen.slice(0, 15).map((s) => (
                        <tr key={s.salesmanId} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {s.code} {s.truckPlate ? `• ${s.truckPlate}` : ""}
                            </div>
                          </td>
                          <td className="p-2.5 text-muted-foreground truncate max-w-[130px]">
                            {s.branchName}
                          </td>
                          <td className="p-2.5 text-right font-medium text-foreground">
                            {s.invoiceCount.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-foreground">
                            ₱{s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-medium text-muted-foreground">
                            ₱{s.averageDropSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-2.5 text-center font-black text-foreground">
                            {s.quotaAchievementRate}%
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                PRODUCTIVITY_TIER_BADGES[s.tier]
                              }`}
                            >
                              {s.tier.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredSalesmen.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground text-xs">
                            No sales representatives match the selected tier filter.
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

        {/* BOTTOM ACTION / DEEP DIVE LINK */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="text-[10px] text-muted-foreground">
            {kpis?.topPerformerName ? (
              <span>
                Sales Force Leader: <span className="font-bold text-foreground">{kpis.topPerformerName}</span> (₱{(kpis.topPerformerRevenue).toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            ) : (
              <span>Live field productivity and strike rate tracking</span>
            )}
          </div>
          <Link
            href={`/holdings/executive-dashboard/manufacturing/${group.id}/salesman-productivity`}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
          >
            Deep Dive Analytics
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

