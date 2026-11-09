"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Clock,
  ShieldCheck,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Coins,
  Cpu,
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
import { fetchMachineDowntime } from "./providers/fetchProvider";
import type {
  MachineDowntimeKpis,
  MachineAssetSummary,
  MachineDowntimeIncident,
  DowntimeCategoryBreakdown,
  MachineOperatingStatus,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

const STATUS_BADGES: Record<MachineOperatingStatus, string> = {
  OPERATIONAL: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  UNDER_MAINTENANCE: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  STANDBY: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
  BREAKDOWN_UNPLANNED: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
};

const PIE_COLORS = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export function MachineDowntimeModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<MachineDowntimeKpis | null>(null);
  const [machines, setMachines] = useState<MachineAssetSummary[]>([]);
  const [incidents, setIncidents] = useState<MachineDowntimeIncident[]>([]);
  const [categories, setCategories] = useState<DowntimeCategoryBreakdown[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"downtime" | "availability" | "duration" | "machine">("duration");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMachineDowntime({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setMachines(res.machines || []);
      setIncidents(res.incidents || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load machine downtime data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedIncidents = useMemo(() => {
    let list = incidents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.machineName.toLowerCase().includes(q) ||
          i.rootCause.toLowerCase().includes(q) ||
          i.categoryLabel.toLowerCase().includes(q) ||
          (i.technicianName && i.technicianName.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((i) => i.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((i) => i.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "duration") diff = a.durationMinutes - b.durationMinutes;
      else if (sortField === "machine") diff = a.machineName.localeCompare(b.machineName);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [incidents, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: "downtime" | "availability" | "duration" | "machine") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportCSV = () => {
    if (incidents.length === 0) return;
    const headers = [
      "Incident ID",
      "Machine / Work Center",
      "Category",
      "Duration (Minutes)",
      "Duration (Hours)",
      "Status",
      "Started At",
      "Ended At",
      "Root Cause",
      "Corrective Action",
      "Technician",
      "Estimated Output Loss (PHP)",
    ];

    const rows = incidents.map((i) => [
      i.id,
      `"${i.machineName}"`,
      `"${i.categoryLabel}"`,
      i.durationMinutes,
      i.durationHours,
      `"${i.status}"`,
      `"${i.startedAt}"`,
      `"${i.endedAt || "Ongoing"}"`,
      `"${i.rootCause}"`,
      `"${i.correctiveAction || ""}"`,
      `"${i.technicianName || ""}"`,
      i.financialLossPhp,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `machine_downtime_audit_${groupId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    return machines.slice(0, 8).map((m) => ({
      name: m.machineName.length > 15 ? `${m.machineName.slice(0, 15)}…` : m.machineName,
      fullName: m.machineName,
      downtimeHours: m.totalDowntimeHours,
      availability: m.availabilityRate,
      status: m.status,
    }));
  }, [machines]);

  const pieData = useMemo(() => {
    return categories.map((c) => ({
      name: c.label,
      value: c.totalHours,
      incidents: c.totalIncidents,
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
              Machine Downtime & Reliability Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-11">
            Plant work center uptime, MTBF/MTTR reliability KPIs, stoppage root causes, and output capacity loss
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
            disabled={loading || incidents.length === 0}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
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
            <span className="font-semibold">Failed to fetch machine downtime data:</span> {error}
          </div>
        </div>
      )}

      {/* KPIs & Analysis */}
      {kpis && (
        <>
          {/* Top KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Overall Availability */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Availability Rate</span>
                  <Cpu className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      kpis.isTargetMet ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {kpis.overallAvailabilityRate}%
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    vs {kpis.targetAvailabilityRate}% target
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      kpis.isTargetMet ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{kpis.isTargetMet ? "Meets operational SLA" : "Below uptime target"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Downtime Hours */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Downtime Hours</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.totalDowntimeHours}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">hours</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Across {kpis.totalDowntimeIncidents} recorded stoppages
                </div>
              </CardContent>
            </Card>

            {/* MTBF */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MTBF Reliability</span>
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                    {kpis.mtbfAverageHours}h
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Mean time between failures
                </div>
              </CardContent>
            </Card>

            {/* MTTR */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MTTR Resolution</span>
                  <Wrench className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {kpis.mttrAverageHours}h
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Average repair restoration time
                </div>
              </CardContent>
            </Card>

            {/* Output Capacity Loss */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Output Value Loss</span>
                  <Coins className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    ₱{Math.round(kpis.estimatedFinancialLoss).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-rose-500 font-semibold pt-1 truncate">
                  Top loss: {kpis.topDowntimeMachine}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Downtime by Machine vs Availability Line */}
            <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Downtime Hours vs Availability Rate % by Machine
                </CardTitle>
                <CardDescription className="text-xs">
                  Stoppage hours impact against 95.0% target uptime availability line
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
                        maxBarSize={45}
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
              </CardContent>
            </Card>

            {/* Chart 2: Root Cause Pareto Share */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Root Cause Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Stoppage hours by category
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
                        formatter={(val: number | string) => [`${val} hrs`, "Downtime"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-xs">
                  {categories.map((c, idx) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-[11px] text-muted-foreground">{c.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {c.totalHours}h ({c.percentageOfTotal}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machine Station Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {machines.slice(0, 4).map((m) => (
              <div
                key={m.workCenterId}
                className="bg-muted/15 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-mono font-bold">WC #{m.workCenterId}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      STATUS_BADGES[m.status]
                    }`}
                  >
                    {m.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-1">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1" title={m.machineName}>
                    {m.machineName}
                  </h4>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      className={`text-lg font-black tracking-tight ${
                        m.availabilityRate >= 95.0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {m.availabilityRate}% Uptime
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {m.totalDowntimeHours}h down
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>MTBF: {m.mtbfHours}h</span>
                  <span className="text-rose-500 font-bold">₱{m.financialImpactPhp.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search machine, root cause, technician..."
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
                      {c.label}
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
                  <option value="ALL">All Incidents</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="IN_PROGRESS">In Progress (Active)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Machine Downtime Stoppage Audit Log
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredAndSortedIncidents.length} of {incidents.length} recorded events
                </CardDescription>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => toggleSort("machine")}>
                      <div className="flex items-center gap-1">
                        <span>Machine / Work Center</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Downtime Category</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleSort("duration")}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Duration (hrs)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">Root Cause Diagnostics</th>
                    <th className="p-3">Corrective Action</th>
                    <th className="p-3">Technician</th>
                    <th className="p-3 text-right">Lost Value</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedIncidents.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground">
                        #{i.id}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block truncate max-w-[180px]">
                          {i.machineName}
                        </span>
                        {i.affectedProduct && (
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[180px]">
                            {i.affectedProduct}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {i.categoryLabel}
                      </td>
                      <td className="p-3 text-right font-black text-amber-500">
                        {i.durationHours}h ({i.durationMinutes}m)
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <span className="text-foreground truncate block" title={i.rootCause}>
                          {i.rootCause}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <span className="text-muted-foreground truncate block" title={i.correctiveAction}>
                          {i.correctiveAction || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {i.technicianName || "—"}
                      </td>
                      <td className="p-3 text-right font-black text-rose-500">
                        ₱{i.financialLossPhp.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            i.status === "RESOLVED"
                              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400"
                              : "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 animate-pulse"
                          }`}
                        >
                          {i.status === "RESOLVED" ? "Resolved" : "Active"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedIncidents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No machine downtime events matching your filter criteria.
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

