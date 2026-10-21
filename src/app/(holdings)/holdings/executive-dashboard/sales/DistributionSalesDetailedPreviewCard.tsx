"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    Trophy, 
    ChevronRight, 
    TrendingUp, 
    Building2, 
    ArrowUpRight,
    Search,
    Layers,
    Target,
    BarChart3,
    LayoutGrid
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    LabelList,
    Scatter,
} from "recharts";
import {
    fetchExecutiveHealthData,
    fetchCompanyTargets,
    fetchDivisionTargets,
    getDivisions,
} from "@/modules/holdings/executive-dashboard/executive-health/providers/fetchProvider";
import type { 
    VSalesPerformanceDataDto, 
    TargetSettingExecutive, 
    TargetSettingDivision 
} from "@/modules/holdings/executive-dashboard/executive-health/types";

export interface DistributionSalesDetailedPreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

export interface DivisionDetailedItem {
    id?: number;
    name: string;
    sales: number;
    target: number;
    achievement: number;
    gap: number;
}

const formatPHP = (val: number) => 
    new Intl.NumberFormat("en-PH", { 
        style: "currency", 
        currency: "PHP", 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);

const formatShort = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000000) return `${sign}₱${(absVal / 1000000000).toFixed(1)}B`;
    if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}K`;
    return `${sign}₱${absVal.toFixed(0)}`;
};

export function DistributionSalesDetailedPreviewCard({
    group,
    startDate: propStartDate,
    endDate: propEndDate,
}: DistributionSalesDetailedPreviewCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [targets, setTargets] = useState<TargetSettingExecutive[]>([]);
    const [allocations, setAllocations] = useState<TargetSettingDivision[]>([]);
    const [divisions, setDivisions] = useState<Array<{ division_id: number; division_name: string }>>([]);
    const [viewMode, setViewMode] = useState<"chart" | "grid">("chart");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"sales" | "target" | "achievement" | "name">("sales");
    const [syncPending, setSyncPending] = useState(false);

    const today = new Date();
    const startDate = propStartDate || format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = propEndDate || format(endOfMonth(today), "yyyy-MM-dd");

    const fromMonth = startDate.slice(0, 7);
    const toMonth = endDate.slice(0, 7);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const targetStart = format(startOfMonth(parseISO(startDate)), "yyyy-MM-dd");
                const targetEnd = format(endOfMonth(parseISO(endDate)), "yyyy-MM-dd");

                const [dataRes, companyTargetsRes, divisionsRes] = await Promise.allSettled([
                    fetchExecutiveHealthData(startDate, endDate, String(group.id)),
                    fetchCompanyTargets(targetStart, targetEnd, String(group.id)),
                    getDivisions(String(group.id)),
                ]);

                if (!isMounted) return;

                if (dataRes.status === "fulfilled" && Array.isArray(dataRes.value)) {
                    setRawData(dataRes.value);
                    setSyncPending(false);
                } else {
                    setRawData([]);
                    setSyncPending(true);
                }

                const companyTargets = 
                    companyTargetsRes.status === "fulfilled" && Array.isArray(companyTargetsRes.value)
                        ? (companyTargetsRes.value as TargetSettingExecutive[])
                        : [];
                setTargets(companyTargets);

                const metadataDivs = 
                    divisionsRes.status === "fulfilled" && Array.isArray(divisionsRes.value)
                        ? (divisionsRes.value as Array<{ division_id: number; division_name: string }>)
                        : [];
                setDivisions(metadataDivs);

                if (companyTargets.length > 0) {
                    const tseIds = companyTargets.map((t) => t.id).filter(Boolean);
                    const divTargets = await fetchDivisionTargets(tseIds, String(group.id));
                    if (isMounted) setAllocations(divTargets);
                } else {
                    if (isMounted) setAllocations([]);
                }
            } catch (err) {
                if (isMounted) {
                    console.warn(`[DistributionSalesDetailedPreviewCard] Failed for group ${group.id}:`, err);
                    setSyncPending(true);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [group.id, startDate, endDate]);

    // Compute Company Total & Division-Level Metrics matching Executive Health
    const { companyHealth, divisionList } = useMemo(() => {
        const daysDiff = Math.max(1, Math.round((parseISO(endDate).getTime() - parseISO(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const isWeekly = daysDiff <= 10;

        const rawCompanyTarget = targets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
        const totalTarget = isWeekly ? (rawCompanyTarget > 0 ? rawCompanyTarget / 4 : 0) : rawCompanyTarget;

        const activeDivisionIds = new Set(divisions.map((d) => d.division_id));
        const activeDivisionNames = new Set(divisions.map((d) => (d.division_name || "").toUpperCase()));

        let totalActual = 0;
        const divisionMap = new Map<string, { name: string; sales: number }>();

        rawData.forEach((item) => {
            const isBiaDivision = 
                activeDivisionIds.has(item.divisionId) || 
                activeDivisionNames.has((item.divisionName || "").toUpperCase());

            if (isBiaDivision || divisions.length === 0) {
                const divName = item.divisionName || "Unknown";
                const net = item.netAmount || 0;
                totalActual += net;
                const cur = divisionMap.get(divName) || { name: divName, sales: 0 };
                cur.sales += net;
                divisionMap.set(divName, cur);
            }
        });

        // Add divisions that have targets/metadata but 0 sales
        divisions.forEach((d) => {
            if (!divisionMap.has(d.division_name)) {
                divisionMap.set(d.division_name, { name: d.division_name, sales: 0 });
            }
        });

        const processed: DivisionDetailedItem[] = Array.from(divisionMap.values()).map((div) => {
            const divId = divisions.find((d) => d.division_name.toUpperCase() === div.name.toUpperCase())?.division_id;
            const rawDivTarget = allocations
                .filter((a) => a.division_id === divId)
                .reduce((sum, a) => sum + (a.target_amount || 0), 0);

            const divTarget = isWeekly ? (rawDivTarget > 0 ? rawDivTarget / 4 : 0) : rawDivTarget;
            const achievement = divTarget > 0 ? (div.sales / divTarget) * 100 : 0;
            const gap = div.sales - divTarget;

            return {
                id: divId,
                name: div.name.toUpperCase(),
                sales: div.sales,
                target: divTarget,
                achievement,
                gap,
            };
        }).sort((a, b) => b.sales - a.sales);

        return {
            companyHealth: {
                actual: totalActual,
                target: totalTarget,
                achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
                gap: totalActual - totalTarget,
            },
            divisionList: processed,
        };
    }, [rawData, targets, allocations, divisions, startDate, endDate]);

    // Filter & sort divisions for grid / table
    const filteredDivisions = useMemo(() => {
        let list = divisionList;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((d) => d.name.toLowerCase().includes(q));
        }

        return [...list].sort((a, b) => {
            if (sortBy === "sales") return b.sales - a.sales;
            if (sortBy === "target") return b.target - a.target;
            if (sortBy === "achievement") return b.achievement - a.achievement;
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return 0;
        });
    }, [divisionList, searchQuery, sortBy]);

    const targetUrl = `/holdings/executive-dashboard/sales/${group.id}/executive-health?from=${fromMonth}&to=${toMonth}`;

    const handleDivisionClick = (divisionName: string, divisionId?: number) => {
        const params = new URLSearchParams({ from: fromMonth, to: toMonth, division: divisionName });
        if (divisionId) params.append("divisionId", String(divisionId));
        router.push(`/holdings/executive-dashboard/sales/${group.id}/managerial-supplier?${params.toString()}`);
    };

    return (
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 w-full">
            <Card className="relative overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 sm:p-4 space-y-3">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-emerald-500/5 via-primary/5 to-amber-500/5 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Commercial Distribution
                                </p>
                                {syncPending && (
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/5 py-0 px-1.5 h-4">
                                        Sync Pending
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                                    {group.group_name || "Sales VS. Target Detailed"}
                                </h3>
                                <span className="text-[11px] text-muted-foreground truncate hidden md:inline font-medium">
                                    • Division sales performance vs target quota matrix
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {!loading && (
                                <div className="text-right border-r border-border/60 pr-3 hidden sm:flex items-center gap-3.5">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Total Sales
                                        </p>
                                        <p className="text-base sm:text-lg font-black font-mono text-primary leading-tight">
                                            {formatShort(companyHealth.actual)}
                                        </p>
                                    </div>
                                    <div className="border-l border-border/50 pl-3.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Target Quota
                                        </p>
                                        <p className="text-base sm:text-lg font-black font-mono text-foreground leading-tight">
                                            {formatShort(companyHealth.target)}
                                        </p>
                                    </div>
                                    <div className="border-l border-border/50 pl-3.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Hit Rate
                                        </p>
                                        <p className={`text-base sm:text-lg font-black font-mono leading-tight ${companyHealth.achievement >= 100 ? "text-emerald-500" : companyHealth.achievement >= 80 ? "text-primary" : "text-amber-500"}`}>
                                            {companyHealth.achievement.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5">
                                <div className="border border-border/60 rounded-lg p-0.5 bg-muted/20 flex items-center">
                                    <Button
                                        variant={viewMode === "chart" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("chart")}
                                        className="h-6 px-2 text-[10px] gap-1 font-bold shadow-none"
                                    >
                                        <BarChart3 className="h-3 w-3" />
                                        Chart
                                    </Button>
                                    <Button
                                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className="h-6 px-2 text-[10px] gap-1 font-bold shadow-none"
                                    >
                                        <LayoutGrid className="h-3 w-3" />
                                        Grid
                                    </Button>
                                </div>

                                <Button asChild size="sm" className="h-7 px-3 text-[11px] gap-1 font-bold shadow-2xs">
                                    <Link href={targetUrl}>
                                        View Full Report
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3 pt-0.5">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 rounded-xl" />
                                ))}
                            </div>
                            <Skeleton className="h-[480px] rounded-xl" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Summary KPI Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Company Sales</span>
                                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-lg sm:text-xl font-black font-mono text-foreground leading-tight">
                                            {formatShort(companyHealth.actual)}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground truncate">
                                            {formatPHP(companyHealth.actual)}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Target</span>
                                        <Target className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-lg sm:text-xl font-black font-mono text-foreground leading-tight">
                                            {formatShort(companyHealth.target)}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground truncate">
                                            {formatPHP(companyHealth.target)}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Achievement Rate</span>
                                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                    </div>
                                    <div className="mt-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className={`text-lg sm:text-xl font-black font-mono leading-tight ${companyHealth.achievement >= 100 ? "text-emerald-500" : companyHealth.achievement >= 80 ? "text-primary" : "text-amber-500"}`}>
                                                {companyHealth.achievement.toFixed(1)}%
                                            </p>
                                            <Badge variant="outline" className={`text-[9px] font-bold tracking-wider py-0 px-1.5 h-4 ${companyHealth.achievement >= 100 ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"}`}>
                                                {companyHealth.achievement >= 100 ? "Achieved" : "In Progress"}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] font-medium text-muted-foreground">
                                            {divisionList.filter((d) => d.achievement >= 100).length} of {divisionList.length} divisions hitting quota
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Quota Gap</span>
                                        <Layers className="h-3.5 w-3.5 text-purple-500" />
                                    </div>
                                    <div className="mt-1">
                                        <p className={`text-lg sm:text-xl font-black font-mono leading-tight ${companyHealth.gap >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                            {companyHealth.gap >= 0 ? `+${formatShort(companyHealth.gap)}` : formatShort(companyHealth.gap)}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground">
                                            {companyHealth.gap >= 0 ? "Surplus over quota" : "Remaining to hit quota"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Body: Exact Executive Health Chart or Grid */}
                            {viewMode === "chart" ? (
                                <div className="rounded-xl border border-border/60 bg-muted/5 p-3 sm:p-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                                Division Sales vs Quota Benchmark
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">
                                                Click any bar to drill down into salesmen and customer performance
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold">
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
                                                <span className="text-muted-foreground">Actual (Achieved)</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
                                                <span className="text-muted-foreground">Actual (Behind)</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-2.5 w-2.5 rounded-sm bg-[#fef3c7] border border-[#d97706]/50" />
                                                <span className="text-muted-foreground">Target Quota</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-[460px] sm:h-[500px] w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart
                                                data={divisionList}
                                                layout="vertical"
                                                margin={{ left: 10, right: 65, top: 10, bottom: 10 }}
                                                onClick={(e) => {
                                                    if (e && e.activePayload && e.activePayload.length > 0) {
                                                        const p = e.activePayload[0].payload as DivisionDetailedItem;
                                                        handleDivisionClick(p.name, p.id);
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={155}
                                                    fontSize={10}
                                                    tick={{ fill: "hsl(var(--foreground))", fontWeight: 900, fontSize: 10 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload as DivisionDetailedItem;
                                                            const isAchieved = data.achievement >= 100;
                                                            return (
                                                                <div className="bg-background/95 backdrop-blur-xl border border-border/60 p-3.5 rounded-xl shadow-2xl min-w-[220px]">
                                                                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1.5 border-b border-border/40 pb-1">
                                                                        {label}
                                                                    </p>
                                                                    <div className="space-y-1.5 text-xs">
                                                                        <div className="flex justify-between items-center gap-4">
                                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Actual Sales</span>
                                                                            <span className="font-black font-mono text-primary italic">{formatPHP(data.sales)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center gap-4">
                                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Target Quota</span>
                                                                            <span className="font-black font-mono text-foreground italic">{formatPHP(data.target)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center gap-4">
                                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Variance Gap</span>
                                                                            <span className={`font-black font-mono italic ${data.gap >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                                                {data.gap >= 0 ? `+${formatPHP(data.gap)}` : formatPHP(data.gap)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Hit Rate</span>
                                                                            <span className={`text-base font-black italic font-mono ${isAchieved ? "text-emerald-500" : "text-amber-500"}`}>
                                                                                {data.achievement.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="sales" name="Actual" barSize={26} radius={[0, 8, 8, 0]} minPointSize={2}>
                                                    {divisionList.map((e, i) => (
                                                        <Cell key={i} fill={e.sales >= e.target && e.target > 0 ? "#10b981" : "#f59e0b"} fillOpacity={0.9} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="sales"
                                                        position="right"
                                                        formatter={(v: unknown) => formatShort(Number(v) || 0)}
                                                        style={{ fontSize: "10px", fontWeight: 900, fill: "hsl(var(--foreground))", textTransform: "uppercase" }}
                                                        offset={10}
                                                    />
                                                </Bar>
                                                <Bar
                                                    dataKey="target"
                                                    name="Target"
                                                    barSize={12}
                                                    fill="#fef3c7"
                                                    fillOpacity={0.8}
                                                    stroke="#d97706"
                                                    strokeWidth={1}
                                                    strokeOpacity={0.6}
                                                    radius={[0, 4, 4, 0]}
                                                />
                                                <Scatter
                                                    dataKey="target"
                                                    tooltipType="none"
                                                    shape={(props: unknown) => {
                                                        const p = props as { cx?: number; cy?: number; payload?: { target?: number } };
                                                        const { cx, cy, payload } = p;
                                                        if (!payload || !payload.target || cx === undefined || cy === undefined) return <g />;
                                                        return (
                                                            <line
                                                                x1={cx}
                                                                y1={cy - 18}
                                                                x2={cx}
                                                                y2={cy + 18}
                                                                stroke="#6b7280"
                                                                strokeWidth={2.5}
                                                                strokeLinecap="round"
                                                                opacity={0.6}
                                                            />
                                                        );
                                                    }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Filter & Sort Bar */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <div className="relative flex-1 sm:w-64">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search division..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-7 pl-8 text-xs bg-muted/10 border-border/50"
                                                />
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground px-2 h-7 shrink-0">
                                                {filteredDivisions.length} {filteredDivisions.length === 1 ? "Division" : "Divisions"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                                                Sort By:
                                            </span>
                                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                                                <SelectTrigger className="h-7 text-xs w-36 bg-muted/10 border-border/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sales">Highest Sales</SelectItem>
                                                    <SelectItem value="achievement">Achievement %</SelectItem>
                                                    <SelectItem value="target">Target Quota</SelectItem>
                                                    <SelectItem value="name">Division Name</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Division Detail Grid */}
                                    {filteredDivisions.length === 0 ? (
                                        <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl border-border/60">
                                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-semibold uppercase tracking-wider">No divisions found</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Try clearing your search query</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filteredDivisions.map((div, i) => {
                                                const isAchieved = div.achievement >= 100;
                                                const isOnTrack = div.achievement >= 80 && div.achievement < 100;
                                                const isCritical = div.achievement < 50;

                                                const drilldownUrl = `/holdings/executive-dashboard/sales/${group.id}/managerial-supplier?from=${fromMonth}&to=${toMonth}&division=${encodeURIComponent(div.name)}${div.id ? `&divisionId=${div.id}` : ""}`;

                                                return (
                                                    <Link
                                                        key={div.name}
                                                        href={drilldownUrl}
                                                        className="group/card block p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/10 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2.5">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] font-black text-muted-foreground/60 font-mono">
                                                                        #{i + 1}
                                                                    </span>
                                                                    <h4 className="text-xs font-black uppercase tracking-tight text-foreground truncate group-hover/card:text-primary transition-colors">
                                                                        {div.name}
                                                                    </h4>
                                                                </div>
                                                                <p className="text-[9px] font-semibold text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                    <span>Target: {formatShort(div.target)}</span>
                                                                    <span>•</span>
                                                                    <span className={div.gap >= 0 ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                                                                        {div.gap >= 0 ? `+${formatShort(div.gap)}` : formatShort(div.gap)}
                                                                    </span>
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-col items-end shrink-0">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] font-black font-mono px-1.5 py-0 h-5 ${
                                                                        isAchieved
                                                                            ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                                                                            : isOnTrack
                                                                            ? "border-sky-500/40 text-sky-500 bg-sky-500/10"
                                                                            : isCritical
                                                                            ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                                                                            : "border-amber-500/40 text-amber-500 bg-amber-500/10"
                                                                    }`}
                                                                >
                                                                    {div.achievement.toFixed(1)}%
                                                                </Badge>
                                                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                                    {isAchieved ? "Achieved" : isOnTrack ? "On Track" : isCritical ? "Critical" : "Behind"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-1.5">
                                                            <div className="relative h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        isAchieved
                                                                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                                            : isOnTrack
                                                                            ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]"
                                                                            : isCritical
                                                                            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                                                            : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                                                    }`}
                                                                    style={{ width: `${Math.min(div.achievement, 100)}%` }}
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                                                                <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">
                                                                    Actual Sales
                                                                </span>
                                                                <span className="font-black font-mono text-foreground text-xs">
                                                                    {formatPHP(div.sales)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground group-hover/card:text-primary transition-colors">
                                                            <span className="font-semibold text-[9px] uppercase tracking-wider">
                                                                View Division Breakdown
                                                            </span>
                                                            <ArrowUpRight className="h-3 w-3 opacity-60 group-hover/card:opacity-100 transition-opacity" />
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
