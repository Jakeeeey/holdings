"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  Coins,
  Cpu,
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
  Cell,
} from "recharts";
import { fetchMachineDowntime } from "@/modules/holdings/executive-dashboard/machine-downtime/providers/fetchProvider";
import type {
  MachineDowntimeKpis,
  MachineAssetSummary,
  DowntimeCategoryBreakdown,
  MachineOperatingStatus,
} from "@/modules/holdings/executive-dashboard/machine-downtime/types";

export interface MachineDowntimePreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

const STATUS_BADGES: Record<MachineOperatingStatus, string> = {
  OPERATIONAL: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  UNDER_MAINTENANCE: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  STANDBY: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
  BREAKDOWN_UNPLANNED: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
};

export function MachineDowntimePreviewCard({
  group,
  startDate,
  endDate,
}: MachineDowntimePreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<MachineDowntimeKpis | null>(null);
  const [machines, setMachines] = useState<MachineAssetSummary[]>([]);
  const [categories, setCategories] = useState<DowntimeCategoryBreakdown[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMachineDowntime({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setMachines(res.machines || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      console.warn(`[MachineDowntimePreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load machine downtime data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredMachines = useMemo(() => {
    if (!selectedCategory) return machines;
    return machines.filter((m) =>
      m.primaryCause.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [machines, selectedCategory]);

  const chartData = useMemo(() => {
    return filteredMachines.slice(0, 7).map((m) => ({
      name: m.machineName.length > 14 ? `${m.machineName.slice(0, 14)}…` : m.machineName,
      fullName: m.machineName,
      downtimeHours: m.totalDowntimeHours,
      operatingHours: m.totalOperatingHours,
      availability: m.availabilityRate,
      status: m.status,
    }));
  }, [filteredMachines]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden hover:border-border/80 transition-all duration-300">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                MANUFACTURING OPERATIONS INTELLIGENCE
              </span>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                MACHINE DOWNTIME & RELIABILITY
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Machine Downtime"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Equipment uptime availability, MTBF/MTTR reliability metrics, root cause stoppages, and financial impact
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
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Chart View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs font-semibold rounded-md gap-1.5"
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading}
              className="h-7 w-7 p-0 rounded-lg border-border/40 hover:bg-muted/50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </Button>

            {/* Deep Dive Link */}
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/downtime`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <span>Deep Dive</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && !kpis && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {error && !kpis && (
          <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold">Failed to fetch machine downtime data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Overall Availability Rate */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Availability Rate</span>
                  <Cpu className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      kpis.isTargetMet ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.overallAvailabilityRate}%
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    vs {kpis.targetAvailabilityRate}% target
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.isTargetMet ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.isTargetMet ? "Within SLA uptime target" : "Uptime target missed"}</span>
                </div>
              </div>

              {/* Total Downtime Hours */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Downtime</span>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.totalDowntimeHours}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">hours</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Across {kpis.totalDowntimeIncidents} stoppage events</span>
                </div>
              </div>

              {/* MTBF (Reliability) */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MTBF (Reliability)</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                    {kpis.mtbfAverageHours}h
                  </span>
                  <span className="text-[10px] font-bold text-blue-500">between fails</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Mean operating hours</span>
                </div>
              </div>

              {/* MTTR (Repair Speed) */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MTTR (Repair Time)</span>
                  <Wrench className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.mttrAverageHours}h
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">avg repair</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Maintenance resolution speed</span>
                </div>
              </div>

              {/* Estimated Financial Loss */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Lost Capacity Value</span>
                  <Coins className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    ₱{Math.round(kpis.estimatedFinancialLoss).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-semibold truncate">
                  <AlertOctagon className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={kpis.topDowntimeMachine}>
                    Top loss: {kpis.topDowntimeMachine}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                All Machines ({machines.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === c.label ? null : c.label)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === c.label
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                    {c.totalHours}h
                  </span>
                </button>
              ))}
            </div>

            {/* Main Views Container */}
            {viewMode === "chart" && (
              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-foreground">Downtime Hours vs Availability Rate % by Machine</span>
                  <span className="text-[10px] text-muted-foreground">
                    Target Availability: &ge; 95.0%
                  </span>
                </div>

                <div className="h-60 sm:h-64 w-full">
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
                        tickFormatter={(v) => `${v}h`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[85, 100]}
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
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(val: number | string, name: string) => {
                          if (name === "Availability Rate (%)") return [`${val}%`, name];
                          if (name === "Downtime (Hours)") return [`${val} hrs`, name];
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
                        dataKey="downtimeHours"
                        name="Downtime (Hours)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.availability < 95.0 ? "#f43f5e" : "#f59e0b"}
                          />
                        ))}
                      </Bar>
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="availability"
                        name="Availability Rate (%)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMachines.slice(0, 6).map((m) => (
                  <div
                    key={m.workCenterId}
                    className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 hover:border-border/80 hover:bg-muted/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        WC #{m.workCenterId}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          STATUS_BADGES[m.status]
                        }`}
                      >
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1" title={m.machineName}>
                        {m.machineName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate" title={m.primaryCause}>
                        Primary cause: {m.primaryCause}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Availability
                        </span>
                        <span
                          className={`font-bold ${
                            m.availabilityRate >= 95.0 ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {m.availabilityRate}% Uptime
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Downtime
                        </span>
                        <span className="font-bold text-foreground">
                          {m.totalDowntimeHours}h ({m.incidentCount} events)
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        MTBF: {m.mtbfHours}h · MTTR: {m.mttrHours}h
                      </span>
                      <span className="text-rose-500 font-bold">
                        ₱{m.financialImpactPhp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "table" && (
              <div className="border border-border/40 rounded-xl overflow-x-auto bg-muted/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    <tr>
                      <th className="p-2.5">Work Center</th>
                      <th className="p-2.5">Machine / Equipment</th>
                      <th className="p-2.5 text-right">Planned (hrs)</th>
                      <th className="p-2.5 text-right">Downtime (hrs)</th>
                      <th className="p-2.5 text-right">Availability</th>
                      <th className="p-2.5 text-center">MTBF</th>
                      <th className="p-2.5 text-center">MTTR</th>
                      <th className="p-2.5 text-right">Output Loss</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredMachines.slice(0, 6).map((m) => (
                      <tr key={m.workCenterId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-foreground">#{m.workCenterId}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-foreground block truncate max-w-[180px]">
                            {m.machineName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[180px]" title={m.primaryCause}>
                            {m.primaryCause}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          {m.totalPlannedHours.toFixed(1)}
                        </td>
                        <td className="p-2.5 text-right font-black text-amber-500">
                          {m.totalDowntimeHours.toFixed(1)}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              m.availabilityRate >= 95.0 ? "text-emerald-500" : "text-rose-500"
                            }
                          >
                            {m.availabilityRate}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono text-muted-foreground">
                          {m.mtbfHours}h
                        </td>
                        <td className="p-2.5 text-center font-mono text-muted-foreground">
                          {m.mttrHours}h
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-500">
                          ₱{m.financialImpactPhp.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              STATUS_BADGES[m.status]
                            }`}
                          >
                            {m.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

