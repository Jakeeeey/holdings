"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  PackageX,
  Boxes,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
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
  Legend,
  LabelList,
} from "recharts";
import { fetchRawMaterialAvailability } from "@/modules/holdings/executive-dashboard/raw-material-availability/providers/fetchProvider";
import type {
  RawMaterialAvailabilityKpis,
  RawMaterialItem,
  MaterialCategorySummary,
} from "@/modules/holdings/executive-dashboard/raw-material-availability/types";

export interface RawMaterialAvailabilityPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
  startDate?: string;
  endDate?: string;
}

export function RawMaterialAvailabilityPreviewCard({
  group,
  startDate,
  endDate,
}: RawMaterialAvailabilityPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<RawMaterialAvailabilityKpis | null>(null);
  const [materials, setMaterials] = useState<RawMaterialItem[]>([]);
  const [categories, setCategories] = useState<MaterialCategorySummary[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "grid" | "table">("chart");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRawMaterialAvailability({
        groupId: group.id,
        startDate,
        endDate,
        force,
      });
      setKpis(res.kpis);
      setMaterials(res.materials || []);
      setCategories(res.categories || []);
    } catch (err: unknown) {
      console.warn(`[RawMaterialAvailabilityPreviewCard] Failed for group ${group.id}:`, err);
      const msg = err instanceof Error ? err.message : "Failed to load raw material data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, startDate, endDate]);

  const filteredMaterials = useMemo(() => {
    if (!selectedCategory) return materials;
    return materials.filter((m) => m.category === selectedCategory);
  }, [materials, selectedCategory]);

  const chartData = useMemo(() => {
    return filteredMaterials.slice(0, 7).map((m) => ({
      name: m.materialCode || m.materialName.slice(0, 10),
      fullName: m.materialName,
      available: m.availableQuantity,
      safetyMin: m.minimumSafetyStock,
      coverage: m.coveragePercentage,
      uom: m.uom,
      status: m.status,
    }));
  }, [filteredMaterials]);

  const activeMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    return materials.find((m) => m.materialId === selectedMaterialId) || null;
  }, [selectedMaterialId, materials]);

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
                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                RAW-MATERIAL AVAILABILITY
              </Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-normal">
                {group.group_name || "Raw-Material Availability"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                · Inventory readiness, stockout risks, safety buffer coverage, and supply bottlenecks
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
            <Link href={`/holdings/executive-dashboard/manufacturing/${group.id}/materials`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs font-bold gap-1 rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
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
              <span className="font-semibold">Failed to fetch raw material data:</span> {error}
            </div>
          </div>
        )}

        {/* Data Content */}
        {kpis && (
          <>
            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Material Readiness Index */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Readiness Index</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {kpis.readinessIndex}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    healthy
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{kpis.sufficientCount} of {kpis.totalMonitoredItems} materials safe</span>
                </div>
              </div>

              {/* Critical Shortages */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Critical Shortages</span>
                  <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    {kpis.criticalShortageCount}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500">
                    items &lt;50%
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Immediate production risk</span>
                </div>
              </div>

              {/* Low Stock Warnings */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock Warnings</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                    {kpis.lowStockCount}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    reorder items
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Approaching minimum threshold</span>
                </div>
              </div>

              {/* Average Days of Supply */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Average Supply</span>
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {kpis.averageDaysOfSupply}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    days
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <span>Coverage run rate</span>
                </div>
              </div>

              {/* Top Supply Bottleneck */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Top Bottleneck</span>
                  <PackageX className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 truncate">
                  <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {kpis.topBottleneckItem}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold truncate">
                  <span>{kpis.topBottleneckCoverage}% safety stock level</span>
                </div>
              </div>
            </div>

            {/* Quick Ledger Pill Row (Categories) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Material Classifications ({categories.length})
                </span>
                {(selectedCategory || selectedMaterialId) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedMaterialId(null);
                    }}
                    className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={`h-7 px-3 text-xs font-bold rounded-lg shrink-0 ${
                    selectedCategory === null
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  All Materials ({materials.length})
                </Button>
                {categories.map((c) => {
                  const isSelected = selectedCategory === c.category;
                  const hasShortage = c.shortageItems > 0;
                  const hasLow = c.lowStockItems > 0;

                  return (
                    <Button
                      key={c.category}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(isSelected ? null : c.category)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg shrink-0 gap-1.5 transition-all ${
                        isSelected
                          ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          : "border-border/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          hasShortage
                            ? "bg-rose-500 animate-pulse"
                            : hasLow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-semibold">{c.categoryLabel}</span>
                      <span className="text-[10px] opacity-75">{c.totalItems} items</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Selected Material Focus Banner */}
            {activeMaterial && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-rose-500" />
                  <span className="font-bold text-foreground">{activeMaterial.materialName}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {activeMaterial.materialCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Available: <strong className="text-foreground">{activeMaterial.availableQuantity.toLocaleString()} {activeMaterial.uom}</strong>
                  </span>
                  <span>
                    Min Safety: <strong className="text-foreground">{activeMaterial.minimumSafetyStock.toLocaleString()} {activeMaterial.uom}</strong>
                  </span>
                  <span>
                    Coverage: <strong className={activeMaterial.coveragePercentage >= 100 ? "text-emerald-500" : activeMaterial.coveragePercentage >= 70 ? "text-amber-500" : "text-rose-500"}>{activeMaterial.coveragePercentage}%</strong>
                  </span>
                  <span>
                    Supply: <strong>{activeMaterial.daysOfSupply} days</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Main Interactive View */}
            {viewMode === "chart" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                      Available Stock vs Minimum Safety Buffer
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Critical Threshold &lt;100%
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Sorted by lowest coverage %
                  </span>
                </div>

                <div className="w-full h-64 sm:h-72">
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
                                  <span>Available On-Hand:</span>
                                  <span>{Number(d.available).toLocaleString()} {d.uom}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-500 border-t border-border/40 pt-1 font-bold">
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
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMaterials.map((m) => {
                  const isCritical = m.status === "CRITICAL_SHORTAGE";
                  const isLow = m.status === "LOW_STOCK";

                  return (
                    <div
                      key={m.materialId}
                      onClick={() =>
                        setSelectedMaterialId(
                          selectedMaterialId === m.materialId ? null : m.materialId
                        )
                      }
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedMaterialId === m.materialId
                          ? "border-rose-500 bg-rose-500/10 shadow-md"
                          : "border-border/40 bg-muted/10 hover:border-border/80 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isCritical
                                  ? "bg-rose-500 animate-pulse"
                                  : isLow
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="font-bold text-foreground text-sm">
                              {m.materialName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {m.materialCode} · {m.category}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-black ${
                            isCritical
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : isLow
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {m.coveragePercentage}% Safe
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40 text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Available
                          </span>
                          <div className="text-xs font-black text-foreground">
                            {m.availableQuantity.toLocaleString()} {m.uom}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Safety Min
                          </span>
                          <div className="text-xs font-black text-muted-foreground">
                            {m.minimumSafetyStock.toLocaleString()} {m.uom}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Supply
                          </span>
                          <div
                            className={`text-xs font-black ${
                              isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {m.daysOfSupply} days
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Material &amp; SKU</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">On-Hand</th>
                        <th className="p-2.5 text-center">Reserved</th>
                        <th className="p-2.5 text-center">Available</th>
                        <th className="p-2.5 text-center">Safety Min</th>
                        <th className="p-2.5 text-center">Days of Supply</th>
                        <th className="p-2.5 text-right">Coverage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredMaterials.map((m) => {
                        const isCritical = m.status === "CRITICAL_SHORTAGE";
                        const isLow = m.status === "LOW_STOCK";

                        return (
                          <tr key={m.materialId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-2.5">
                              <div>
                                <div className="font-bold text-foreground">{m.materialName}</div>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {m.materialCode}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold">
                                {m.category}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground">
                              {m.onHandQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-2.5 text-center font-medium text-muted-foreground">
                              {m.reservedQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-2.5 text-center font-bold text-foreground">
                              {m.availableQuantity.toLocaleString()} {m.uom}
                            </td>
                            <td className="p-2.5 text-center font-medium text-muted-foreground">
                              {m.minimumSafetyStock.toLocaleString()} {m.uom}
                            </td>
                            <td
                              className={`p-2.5 text-center font-bold font-mono ${
                                isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {m.daysOfSupply} days
                            </td>
                            <td
                              className={`p-2.5 text-right font-black ${
                                isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {m.coveragePercentage}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

