"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  UserX,
  HelpCircle,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Award,
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
import { fetchIntercompanyConcerns } from "./providers/fetchProvider";
import type {
  CompanyConcernsSummary,
  IntercompanyConcernsKpis,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function IntercompanyConcernsModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<IntercompanyConcernsKpis | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanyConcernsSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"concerns" | "resolutionRate" | "pending" | "name">("concerns");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntercompanyConcerns({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setCompanySummaries(res.companySummaries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load concerns data";
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
      if (sortField === "concerns") diff = b.totalConcerns - a.totalConcerns;
      else if (sortField === "resolutionRate") diff = b.resolutionRate - a.resolutionRate;
      else if (sortField === "pending") diff = b.pendingCount - a.pendingCount;
      else if (sortField === "name") diff = a.companyName.localeCompare(b.companyName);
      return sortOrder === "asc" ? -diff : diff;
    });
  }, [companySummaries, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return filteredAndSortedCompanies
      .filter((c) => c.totalConcerns > 0)
      .map((c) => ({
        companyId: c.companyId,
        code: c.companyCode,
        fullName: c.companyName,
        totalConcerns: c.totalConcerns,
        resolvedCount: c.resolvedCount + c.closedCount,
        pendingCount: c.pendingCount,
        inReviewCount: c.inReviewCount,
        anonymousCount: c.anonymousCount,
        resolutionRate: c.resolutionRate,
      }));
  }, [filteredAndSortedCompanies]);

  const handleExportCSV = () => {
    if (!companySummaries.length) return;
    const headers = [
      "Company Code",
      "Company Name",
      "Total Concerns",
      "Pending Count",
      "In Review Count",
      "Resolved Count",
      "Closed Count",
      "Anonymous Count",
      "Resolution Rate (%)",
      "Share Percentage (%)",
      "Status",
    ];

    const rows = companySummaries.map((c) => [
      `"${c.companyCode}"`,
      `"${c.companyName}"`,
      c.totalConcerns,
      c.pendingCount,
      c.inReviewCount,
      c.resolvedCount,
      c.closedCount,
      c.anonymousCount,
      c.resolutionRate,
      c.sharePercentage,
      c.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `intercompany_concerns_${startDate || "all"}_to_${endDate || "all"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/holdings/executive-dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Intercompany Employee Concerns Intelligence
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full text-xs"
            >
              EXECUTIVE HR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-entity grievances, ticket resolution velocity, pending backlog, and anonymous reporting analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 border-border/40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 border-border/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
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

      {/* Error state */}
      {error && !kpis && (
        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Failed to fetch concerns report:</span> {error}
          </div>
        </div>
      )}

      {/* Loaded KPIs Strip */}
      {kpis && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Concerns */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Total Concerns</span>
                  <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.totalConcerns.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  Logged tickets across entities
                </div>
              </CardContent>
            </Card>

            {/* Resolution Rate */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Resolution Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.resolutionRate}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.resolvedCount + kpis.closedCount} resolved / closed
                </div>
              </CardContent>
            </Card>

            {/* Pending Action */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Pending Action</span>
                  <Clock className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                  {kpis.pendingCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-rose-500 font-semibold">
                  Awaiting HR assignment
                </div>
              </CardContent>
            </Card>

            {/* In Review */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>In Review</span>
                  <HelpCircle className="h-4 w-4 text-sky-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
                  {kpis.inReviewCount}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Under formal investigation
                </div>
              </CardContent>
            </Card>

            {/* Anonymous Reports */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Anonymous Tickets</span>
                  <UserX className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400">
                  {kpis.anonymousCount} ({kpis.anonymousPercentage}%)
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Top: {kpis.topConcernCategory}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Operating Entity Employee Concerns Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cross-company ticket volume and resolved grievance metrics.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                  Resolution Target: &gt;80%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 15, right: 60, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      dataKey="code"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
                      className="text-foreground"
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[220px]">
                              <div className="font-bold text-foreground border-b border-border/40 pb-1">
                                {d.fullName} ({d.code})
                              </div>
                              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-bold">
                                <span>Total Concerns:</span>
                                <span>{d.totalConcerns} tickets</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                <span>Resolved / Closed:</span>
                                <span className="font-semibold">{d.resolvedCount} ({d.resolutionRate}%)</span>
                              </div>
                              <div className="flex justify-between items-center text-rose-500">
                                <span>Pending:</span>
                                <span className="font-semibold">{d.pendingCount}</span>
                              </div>
                              <div className="flex justify-between items-center text-sky-500">
                                <span>In Review:</span>
                                <span className="font-semibold">{d.inReviewCount}</span>
                              </div>
                              <div className="flex justify-between items-center text-purple-500 border-t border-border/40 pt-1">
                                <span>Anonymous:</span>
                                <span className="font-semibold">{d.anonymousCount}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalConcerns"
                      name="Total Concerns"
                      fill="#f59e0b"
                      radius={[0, 6, 6, 0]}
                      barSize={22}
                    >
                      <LabelList
                        dataKey="totalConcerns"
                        position="right"
                        formatter={(v: unknown) => `${v} tickets`}
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          fill: "currentColor",
                        }}
                        className="text-foreground"
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Table Section */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Operating Entity Concerns Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive overview of employee grievances, resolution status, and anonymous ticket volume.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search entity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs rounded-lg border-border/40"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th
                          className="p-3 cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("name");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>Entity</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "pending") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("pending");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Pending</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">In Review</th>
                        <th className="p-3 text-center">Resolved / Closed</th>
                        <th className="p-3 text-center">Anonymous</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "resolutionRate") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("resolutionRate");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Resolution Rate</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="p-3 text-right cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "concerns") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("concerns");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Total Concerns</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAndSortedCompanies.map((c) => {
                        return (
                          <tr key={c.companyId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-bold text-foreground">{c.companyName}</div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {c.companyCode}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-rose-500">
                              {c.pendingCount}
                            </td>
                            <td className="p-3 text-center font-medium text-sky-600 dark:text-sky-400">
                              {c.inReviewCount}
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.resolvedCount + c.closedCount}
                            </td>
                            <td className="p-3 text-center font-medium text-purple-600 dark:text-purple-400">
                              {c.anonymousCount}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-foreground">
                              {c.resolutionRate}%
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                {c.totalConcerns}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

