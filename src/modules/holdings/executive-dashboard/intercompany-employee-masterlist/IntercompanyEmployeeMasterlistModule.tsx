"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchIntercompanyEmployeeMasterlist } from "./providers/fetchProvider";
import type {
  CompanyMasterlistSummary,
  IntercompanyEmployeeMasterlistKpis,
} from "./types";

interface ModuleProps {
  groupId: string;
}

export function IntercompanyEmployeeMasterlistModule({ groupId }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyEmployeeMasterlistKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyMasterlistSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"headcount" | "name" | "share" | "regular">("headcount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyEmployeeMasterlist({
        groupId,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load headcount data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

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
      if (sortField === "headcount") diff = b.totalEmployees - a.totalEmployees;
      else if (sortField === "share") diff = b.headcountSharePct - a.headcountSharePct;
      else if (sortField === "regular") diff = b.regularCount - a.regularCount;
      else if (sortField === "name") diff = a.companyName.localeCompare(b.companyName);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [companySummaries, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return companySummaries
      .filter((c) => c.totalEmployees > 0)
      .map((c) => ({
        code: c.companyCode,
        fullName: c.companyName,
        total: c.totalEmployees,
        regular: c.regularCount,
        probationary: c.probationaryCount,
        other: c.otherStatusCount,
        share: c.headcountSharePct,
      }));
  }, [companySummaries]);

  const handleExportCsv = () => {
    if (!companySummaries.length) return;
    const headers = [
      "Company Code",
      "Company Name",
      "Status",
      "Total Headcount",
      "Share %",
      "Regular Count",
      "Probationary Count",
      "Other Status Count",
      "Department Count",
      "Average Tenure (Years)",
    ];
    const rows = companySummaries.map((c) => [
      `"${c.companyCode}"`,
      `"${c.companyName}"`,
      `"${c.status}"`,
      c.totalEmployees,
      `${c.headcountSharePct}%`,
      c.regularCount,
      c.probationaryCount,
      c.otherStatusCount,
      c.departmentCount,
      c.avgTenureYears,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `intercompany_headcount_${new Date().toISOString().slice(0, 10)}.csv`);
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
            Intercompany <span className="text-cyan-600 dark:text-cyan-400">Employee Masterlist</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Executive workforce breakdown & cross-company headcount metrics
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
                <span className="text-xs font-black uppercase tracking-wider">Total Workforce</span>
                <Users className="h-4 w-4 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {kpis.totalEmployees.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {kpis.maleCount} Male • {kpis.femaleCount} Female
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Regular Staff</span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {kpis.regularCount.toLocaleString()}
                  </p>
                  <span className="text-xs font-bold text-muted-foreground">
                    ({kpis.totalEmployees > 0 ? Math.round((kpis.regularCount / kpis.totalEmployees) * 100) : 0}%)
                  </span>
                </div>
                <Progress
                  value={kpis.totalEmployees > 0 ? (kpis.regularCount / kpis.totalEmployees) * 100 : 0}
                  className="h-1.5 mt-2 bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-black uppercase tracking-wider">Probationary</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {kpis.probationaryCount.toLocaleString()}
                  </p>
                  <span className="text-xs font-bold text-muted-foreground">
                    ({kpis.totalEmployees > 0 ? Math.round((kpis.probationaryCount / kpis.totalEmployees) * 100) : 0}%)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  +{kpis.otherStatusCount} contractual / other
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
                  Top: {kpis.largestCompanyName}
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
            <BarChart3 className="h-4 w-4 text-cyan-500" />
            Headcount Comparison by Entity
          </CardTitle>
          <CardDescription className="text-xs">
            Workforce distribution across operating companies (Regular vs Probationary vs Other)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
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
                          <p className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 mb-0.5">
                            {d.code} • {d.share}% share
                          </p>
                          <p className="text-xs font-black text-foreground mb-2">{d.fullName}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono font-black">
                              <span>Total:</span>
                              <span>{d.total}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-mono font-bold">
                              <span>Regular:</span>
                              <span>{d.regular}</span>
                            </div>
                            <div className="flex justify-between text-amber-600 font-mono font-bold">
                              <span>Probation:</span>
                              <span>{d.probationary}</span>
                            </div>
                            {d.other > 0 && (
                              <div className="flex justify-between text-sky-600 font-mono font-bold">
                                <span>Other:</span>
                                <span>{d.other}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
                <Bar dataKey="regular" name="Regular" stackId="a" fill="#10b981" />
                <Bar dataKey="probationary" name="Probationary" stackId="a" fill="#f59e0b" />
                <Bar dataKey="other" name="Other / Contract" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Headcount Breakdown Table */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-500" />
              Company Headcount Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Complete multi-company employment roster totals
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
                      setSortField("headcount");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Headcount</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("share");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Share %</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("regular");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Regular</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right">Probation</th>
                  <th className="p-3 text-right">Other</th>
                  <th className="p-3 text-right">Depts</th>
                  <th className="p-3 pr-4 text-right">Avg Tenure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAndSortedCompanies.map((c) => {
                  const isOffline = c.status === "OFFLINE";
                  return (
                    <tr key={c.companyId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
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
                      <td className="p-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {c.totalEmployees.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-muted-foreground">
                        {c.headcountSharePct}%
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.regularCount}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {c.probationaryCount}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {c.otherStatusCount}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {c.departmentCount}
                      </td>
                      <td className="p-3 pr-4 text-right font-mono font-semibold text-foreground">
                        {c.avgTenureYears}y
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedCompanies.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground text-xs">
                      No companies match your search criteria.
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

