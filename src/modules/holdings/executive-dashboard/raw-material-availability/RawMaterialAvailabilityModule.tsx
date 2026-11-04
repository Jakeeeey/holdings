"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  PackageX,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
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
import { fetchRawMaterialAvailability } from "./providers/fetchProvider";
import type {
  RawMaterialAvailabilityKpis,
  RawMaterialItem,
} from "./types";

interface ModuleProps {
  groupId: string;
  startDate?: string;
  endDate?: string;
}

export function RawMaterialAvailabilityModule({ groupId, startDate, endDate }: ModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<RawMaterialAvailabilityKpis | null>(null);
  const [materials, setMaterials] = useState<RawMaterialItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"coverage" | "available" | "days" | "name">("coverage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRawMaterialAvailability({
        groupId,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setMaterials(res.materials || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load raw material data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, startDate, endDate]);

  const filteredAndSortedMaterials = useMemo(() => {
    let list = materials;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.materialName.toLowerCase().includes(q) ||
          m.materialCode.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.primarySupplier && m.primarySupplier.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "coverage") diff = a.coveragePercentage - b.coveragePercentage;
      else if (sortField === "available") diff = b.availableQuantity - a.availableQuantity;
      else if (sortField === "days") diff = a.daysOfSupply - b.daysOfSupply;
      else if (sortField === "name") diff = a.materialName.localeCompare(b.materialName);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [materials, searchQuery, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return materials.slice(0, 10).map((m) => ({
      name: m.materialCode || m.materialName.slice(0, 10),
      fullName: m.materialName,
      available: m.availableQuantity,
      safetyMin: m.minimumSafetyStock,
      coverage: m.coveragePercentage,
      uom: m.uom,
      status: m.status,
    }));
  }, [materials]);

  const handleExportCSV = () => {
    if (!materials.length) return;
    const headers = [
      "Material Name",
      "Material SKU",
      "Category",
      "UOM",
      "On-Hand Quantity",
      "Reserved Quantity",
      "Available Quantity",
      "Safety Minimum Stock",
      "Reorder Point",
      "Days of Supply",
      "Buffer Coverage (%)",
      "Status",
      "Primary Supplier",
    ];

    const rows = materials.map((m) => [
      `"${m.materialName}"`,
      `"${m.materialCode}"`,
      `"${m.category}"`,
      `"${m.uom}"`,
      m.onHandQuantity,
      m.reservedQuantity,
      m.availableQuantity,
      m.minimumSafetyStock,
      m.reorderPoint,
      m.daysOfSupply,
      m.coveragePercentage,
      `"${m.status}"`,
      `"${m.primarySupplier || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `raw_material_availability_${startDate || "all"}_to_${endDate || "all"}.csv`
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
              Raw-Material Availability Intelligence
            </h1>
            <Badge
              variant="outline"
              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-2.5 py-0.5 rounded-full text-xs"
            >
              MANUFACTURING OPERATIONS
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-inventory raw ingredient readiness, packaging buffer stock, supply bottlenecks, and critical stockout prevention.
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
            <span className="font-semibold">Failed to fetch raw material report:</span> {error}
          </div>
        </div>
      )}

      {/* Loaded KPIs Strip */}
      {kpis && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Readiness Index */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Readiness Index</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.readinessIndex}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.sufficientCount} of {kpis.totalMonitoredItems} materials safe
                </div>
              </CardContent>
            </Card>

            {/* Critical Shortages */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Critical Shortages</span>
                  <AlertOctagon className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                  {kpis.criticalShortageCount}
                </div>
                <div className="text-[11px] text-rose-500 font-semibold">
                  Items below 50% safety stock
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Warnings */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Low Stock Warnings</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {kpis.lowStockCount}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Nearing reorder threshold
                </div>
              </CardContent>
            </Card>

            {/* Average Days of Supply */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Avg Supply Buffer</span>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">
                  {kpis.averageDaysOfSupply}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Days of production coverage
                </div>
              </CardContent>
            </Card>

            {/* Top Bottleneck Item */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Top Bottleneck</span>
                  <PackageX className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 truncate">
                  {kpis.topBottleneckItem}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Coverage: {kpis.topBottleneckCoverage}% ({kpis.topBottleneckUom})
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
                    Critical Raw Materials Buffer &amp; Safety Minimum
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison between available on-hand inventory and the required minimum safety buffer.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                  Safety Target: &gt;100%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[210px]">
                              <div className="font-bold text-foreground border-b border-border/40 pb-1">
                                {d.fullName}
                              </div>
                              <div className="flex justify-between items-center text-blue-500">
                                <span>Safety Minimum:</span>
                                <span className="font-semibold">{Number(d.safetyMin).toLocaleString()} {d.uom}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>Available Stock:</span>
                                <span>{Number(d.available).toLocaleString()} {d.uom}</span>
                              </div>
                              <div className="flex justify-between items-center text-rose-500 font-bold border-t border-border/40 pt-1">
                                <span>Buffer Coverage:</span>
                                <span>{d.coverage}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="safetyMin" name="Safety Min Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="available" name="Available On-Hand" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="coverage"
                        position="top"
                        formatter={(v: unknown) => `${v}%`}
                        style={{ fontSize: "10px", fontWeight: 700, fill: "currentColor" }}
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
                    Raw Materials &amp; Packaging Inventory Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive view of inventory levels, reservations, available stock, and days of supply.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search material, SKU, supplier..."
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
                            <span>Material</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">On-Hand</th>
                        <th className="p-3 text-center">Reserved</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "available") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("available");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Available</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Safety Min</th>
                        <th
                          className="p-3 text-center cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "days") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("days");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Supply (Days)</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="p-3 text-right cursor-pointer select-none hover:text-foreground"
                          onClick={() => {
                            if (sortField === "coverage") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            else {
                              setSortField("coverage");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Buffer Coverage</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAndSortedMaterials.map((m) => {
                        const isCritical = m.status === "CRITICAL_SHORTAGE";
                        const isLow = m.status === "LOW_STOCK";

                        return (
                          <tr key={m.materialId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-foreground">{m.materialName}</div>
                              <span className="text-[10px] text-muted-foreground">{m.materialCode}</span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[9px] py-0 px-1">
                                {m.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-medium text-foreground">
                              {m.onHandQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-3 text-center font-medium text-muted-foreground">
                              {m.reservedQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-3 text-center font-bold text-foreground">
                              {m.availableQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-3 text-center font-medium text-muted-foreground">
                              {m.minimumSafetyStock.toLocaleString()} {m.uom}
                            </td>
                            <td
                              className={`p-3 text-center font-bold font-mono ${
                                isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {m.daysOfSupply} days
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`text-sm font-black ${
                                  isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {m.coveragePercentage}%
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

