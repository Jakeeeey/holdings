"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Building2,
  Activity,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PermitDashboardSummary } from "../types/permit-dashboard.types";

interface DashboardStatCardsProps {
  summary: PermitDashboardSummary;
  healthFilter?: string;
  onHealthFilterChange?: (filter: string) => void;
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  summary,
  healthFilter = "all",
  onHealthFilterChange,
}) => {
  // Color palette for the health gauge
  const COLORS = {
    healthy: "#10b981", // Emerald 500
    warning: "#f59e0b", // Amber 500
    critical: "#f43f5e", // Rose 500
    empty: "#e2e8f0",    // Slate 200
  };

  // Pie chart segments
  const chartData = useMemo(() => {
    if (summary.total_permits === 0) {
      return [{ name: "No Permits", value: 1, color: COLORS.empty, key: "none" }];
    }

    const items = [
      {
        name: "Active & Valid",
        value: summary.active_count,
        color: COLORS.healthy,
        key: "healthy",
      },
      {
        name: "Expiring Soon",
        value: summary.expiring_count,
        color: COLORS.warning,
        key: "warning",
      },
      {
        name: "Expired (Overdue)",
        value: summary.expired_count,
        color: COLORS.critical,
        key: "critical",
      },
    ];

    // Filter out 0 value items so Recharts renders clean segments
    const activeItems = items.filter((item) => item.value > 0);
    return activeItems.length > 0 ? activeItems : [{ name: "Empty", value: 1, color: COLORS.empty, key: "none" }];
  }, [summary, COLORS.healthy, COLORS.warning, COLORS.critical, COLORS.empty]);

  const activePercent = summary.total_permits > 0
    ? Math.round((summary.active_count / summary.total_permits) * 100)
    : 0;
  const expiringPercent = summary.total_permits > 0
    ? Math.round((summary.expiring_count / summary.total_permits) * 100)
    : 0;
  const expiredPercent = summary.total_permits > 0
    ? Math.round((summary.expired_count / summary.total_permits) * 100)
    : 0;

  const handleCardClick = (targetFilter: string) => {
    if (!onHealthFilterChange) return;
    // Toggle: clicking the already active filter resets to 'all'
    if (healthFilter === targetFilter && targetFilter !== "all") {
      onHealthFilterChange("all");
    } else {
      onHealthFilterChange(targetFilter);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* ================= LEFT SECTION: Donut Compliance Gauge (4 cols on lg, 33%) ================= */}
      <Card className="lg:col-span-4 border border-border/80 shadow-xs bg-card/80 backdrop-blur-xs flex flex-col justify-between overflow-hidden">
        <CardContent className="p-4.5 flex flex-col justify-between h-full space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Compliance Health</h3>
                <p className="text-[11px] text-muted-foreground">Valid and active permits</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 font-bold ${
                summary.overall_compliance_rate >= 80
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : summary.overall_compliance_rate >= 50
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              }`}
            >
              {summary.overall_compliance_rate >= 80
                ? "Good"
                : summary.overall_compliance_rate >= 50
                ? "Needs Attention"
                : "Critical"}
            </Badge>
          </div>

          {/* Donut Chart with Center Percentage */}
          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={74}
                  paddingAngle={chartData.length > 1 ? 4 : 0}
                  dataKey="value"
                  stroke="transparent"
                  animationDuration={800}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    `${typeof value === "number" || typeof value === "string" ? value : 0} Permits`,
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Compliance Percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {summary.overall_compliance_rate}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Compliance
              </span>
            </div>
          </div>

          {/* Bottom Interactive Legend Chips */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/70 text-center">
            {/* Active Chip */}
            <button
              type="button"
              onClick={() => handleCardClick("healthy")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left flex flex-col items-center ${
                healthFilter === "healthy"
                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500"
                  : "bg-muted/30 border-transparent hover:bg-muted/60"
              }`}
            >
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                Active
              </span>
              <span className="text-xs font-bold text-foreground">
                {summary.active_count} <span className="text-[10px] text-muted-foreground font-normal">({activePercent}%)</span>
              </span>
            </button>

            {/* Expiring Chip */}
            <button
              type="button"
              onClick={() => handleCardClick("warning")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left flex flex-col items-center ${
                healthFilter === "warning"
                  ? "bg-amber-500/15 border-amber-500/50 shadow-xs ring-1 ring-amber-500"
                  : "bg-muted/30 border-transparent hover:bg-muted/60"
              }`}
            >
              <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                Expiring
              </span>
              <span className="text-xs font-bold text-foreground">
                {summary.expiring_count} <span className="text-[10px] text-muted-foreground font-normal">({expiringPercent}%)</span>
              </span>
            </button>

            {/* Expired Chip */}
            <button
              type="button"
              onClick={() => handleCardClick("critical")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer text-left flex flex-col items-center ${
                healthFilter === "critical"
                  ? "bg-destructive/15 border-destructive/50 shadow-xs ring-1 ring-destructive"
                  : "bg-muted/30 border-transparent hover:bg-muted/60"
              }`}
            >
              <span className="flex items-center gap-1 text-[10px] text-destructive font-semibold truncate">
                <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                Expired
              </span>
              <span className="text-xs font-bold text-foreground">
                {summary.expired_count} <span className="text-[10px] text-muted-foreground font-normal">({expiredPercent}%)</span>
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ================= RIGHT SECTION: 2x2 Elevated Interactive KPI Cards (8 cols on lg, 67%) ================= */}
      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Total Permits Card */}
        <Card
          onClick={() => handleCardClick("all")}
          className={`border shadow-xs transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            healthFilter === "all"
              ? "border-primary/60 ring-2 ring-primary/20 bg-primary/[0.03]"
              : "border-border/80 bg-card hover:border-primary/40 hover:shadow-sm"
          }`}
        >
          <CardContent className="p-4.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Permits
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {summary.total_permits}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">monitored</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-200">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {summary.online_companies_count !== undefined
                    ? `${summary.online_companies_count} of ${summary.total_companies} Companies Online`
                    : `${summary.total_companies} Companies Registered`}
                </span>
                {Boolean(summary.offline_companies_count && summary.offline_companies_count > 0) && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                    title={`${summary.offline_companies_count} company instance(s) currently offline`}
                  >
                    {summary.offline_companies_count} Offline
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-primary">
                {healthFilter === "all" ? "• Active Filter" : "Click to view all"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Active & Compliant Card */}
        <Card
          onClick={() => handleCardClick("healthy")}
          className={`border shadow-xs transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            healthFilter === "healthy"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-border/80 bg-card hover:border-emerald-500/40 hover:shadow-sm"
          }`}
        >
          <CardContent className="p-4.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Active & Valid
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {summary.active_count}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">permits</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                Valid and up to date
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                {healthFilter === "healthy" ? "• Active Filter" : "Filter Active"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Expiring Soon (90 Days) Card */}
        <Card
          onClick={() => handleCardClick("warning")}
          className={`border shadow-xs transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            healthFilter === "warning"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.08]"
              : "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/60 hover:shadow-sm"
          }`}
        >
          <CardContent className="p-4.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Expiring Soon
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                    {summary.expiring_count}
                  </span>
                  <span className="text-xs font-semibold text-amber-700/80 dark:text-amber-400/80">within 90 days</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-700/90 dark:text-amber-400/90 font-medium">
                Needs renewal soon
              </span>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {healthFilter === "warning" ? "• Active Filter" : "Filter Expiring"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Expired Permits Card */}
        <Card
          onClick={() => handleCardClick("critical")}
          className={`border shadow-xs transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            healthFilter === "critical"
              ? "border-destructive ring-2 ring-destructive/20 bg-destructive/[0.08]"
              : "border-destructive/30 bg-destructive/[0.03] hover:border-destructive/60 hover:shadow-sm"
          }`}
        >
          <CardContent className="p-4.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-destructive uppercase tracking-wider">
                  Expired (Overdue)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight text-destructive">
                    {summary.expired_count}
                  </span>
                  <span className="text-xs font-semibold text-destructive/80">immediate action</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive group-hover:scale-105 transition-transform duration-200">
                <AlertOctagon className="h-5 w-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-destructive/20 flex items-center justify-between text-xs">
              <span className="text-destructive font-medium">
                Needs immediate renewal
              </span>
              <span className="text-[11px] font-bold text-destructive">
                {healthFilter === "critical" ? "• Active Filter" : "Filter Expired"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
