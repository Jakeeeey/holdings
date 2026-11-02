"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Search,
  ArrowUpDown,
  Download,
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
  LabelList,
} from "recharts";
import { fetchIntercompanyOvertime } from "./providers/fetchProvider";
import type {
  CompanyOvertimeSummary,
  IntercompanyOvertimeKpis,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function IntercompanyOvertimeModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyOvertimeKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyOvertimeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"approved" | "filed" | "rate" | "name">("approved");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyOvertime({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load overtime data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedCompanies = useMemo(() => {
    let list = companySummaries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.companyCode.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "approved") diff = b.totalApprovedOtHours - a.totalApprovedOtHours;
      else if (sortField === "filed") diff = b.totalFiledOtHours - a.totalFiledOtHours;
      else if (sortField === "rate") diff = b.otApprovalRate - a.otApprovalRate;
      else if (sortField === "name") diff = a.companyName.localeCompare(b.companyName);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [companySummaries, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return companySummaries
      .filter((c) => c.totalFiledOtHours > 0 || c.totalApprovedOtHours > 0)
      .map((c) => ({
        code: c.companyCode,
        fullName: c.companyName,
        approved: c.totalApprovedOtHours,
        filed: c.totalFiledOtHours,
        requests: c.totalOtRequests,
        rate: c.otApprovalRate,
      }))
      .sort((a, b) => b.approved - a.approved);
  }, [companySummaries]);

  const handleExportCsv = () => {
    if (!companySummaries.length) return;
    const headers = [
      "Company Code",
      "Company Name",
      "Status",
      "Approved OT (Hours)",
      "Filed OT (Hours)",
      "OT Share %",
      "Approval Rate %",
      "Total Requests",
      "Pending Requests",
      "Total Employees",
    ];
    const rows = companySummaries.map((c) => [
      `"${c.companyCode}"`,
      `"${c.companyName}"`,
      `"${c.status}"`,
      c.totalApprovedOtHours,
      c.totalFiledOtHours,
      `${c.otHoursSharePct}%`,
      `${c.otApprovalRate}%`,
      c.totalOtRequests,
      c.pendingOtRequests,
      c.totalEmployees,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `intercompany_overtime_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs">
              <Link href="/holdings/executive-dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic text-foreground">
            Intercompany <span className="text-indigo-600 dark:text-indigo-400">Overtime Utilization</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Subsidiary overtime hours, request logs, and approval analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || !companySummaries.length}
            className="h-8 text-xs font-bold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-8 text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            className="h-7 text-xs border-destructive/30"
          >
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Approved Overtime</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {kpis.totalApprovedOtHours.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">hrs</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {kpis.otApprovalRate}% approval rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Filed Overtime</span>
                <Clock className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {kpis.totalFiledOtHours.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">hrs</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {kpis.totalOtRequests.toLocaleString()} requests filed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Pending Review</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {kpis.totalPendingOtRequests.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  +{kpis.totalRejectedOtRequests} rejected
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Active Entities</span>
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                  {kpis.activeCompaniesCount}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    of {kpis.totalCompaniesCount}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Top: {kpis.topOtCompany} ({kpis.topOtHours}h)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Chart Section */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Overtime Hours by Operating Entity
          </CardTitle>
          <CardDescription className="text-xs">
            Comparison of approved overtime hours vs requested duration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 90, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.35} />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 11, fontWeight: 800, fill: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as (typeof chartData)[0];
                      return (
                        <div className="bg-background/95 backdrop-blur-xl border border-border/60 p-3 rounded-xl shadow-2xl min-w-[200px]">
                          <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-0.5">
                            {d.code}
                          </p>
                          <p className="text-xs font-black text-foreground mb-2">{d.fullName}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono font-black text-emerald-600 dark:text-emerald-400">
                              <span>Approved OT:</span>
                              <span>{d.approved} hrs</span>
                            </div>
                            <div className="flex justify-between text-indigo-600 font-mono font-bold">
                              <span>Filed OT:</span>
                              <span>{d.filed} hrs</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground font-mono">
                              <span>Requests:</span>
                              <span>{d.requests} ({d.rate}% rate)</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
                <Bar dataKey="approved" name="Approved OT" fill="#10b981" barSize={24} radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="approved"
                    position="top"
                    formatter={(v: unknown) => `${Number(v)}h`}
                    style={{ fontSize: "10px", fontWeight: 900, fill: "hsl(var(--foreground))" }}
                    offset={6}
                  />
                </Bar>
                <Bar dataKey="filed" name="Filed OT" fill="#6366f1" fillOpacity={0.25} stroke="#6366f1" strokeWidth={1} barSize={14} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Ledger Table */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              Company Overtime Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Complete multi-company overtime hours and request tracking
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th
                    className="p-3 pl-4 cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("name");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Company</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 text-center">Status</th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("approved");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Approved OT (hrs)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("filed");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Filed OT (hrs)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("rate");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Approval Rate</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right">Requests</th>
                  <th className="p-3 text-right">Pending</th>
                  <th className="p-3 pr-4 text-right">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAndSortedCompanies.map((c) => {
                  const isOffline = c.status === "OFFLINE";
                  return (
                    <tr key={c.companyId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {c.companyCode}
                          </span>
                          <span className="font-bold text-foreground truncate max-w-[220px]" title={c.companyName}>
                            {c.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold py-0 px-1.5 h-4 ${
                            isOffline
                              ? "border-rose-500/30 text-rose-500 bg-rose-500/5"
                              : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {c.totalApprovedOtHours.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {c.totalFiledOtHours.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {c.otApprovalRate}%
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {c.totalOtRequests}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        {c.pendingOtRequests}
                      </td>
                      <td className="p-3 pr-4 text-right font-mono font-semibold text-foreground">
                        {c.totalEmployees}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

