"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { NewCustomerItem, RegistrationTrendItem, SalesmanOnboardingItem } from "../types";

interface NewCustomerChartsProps {
    items: NewCustomerItem[];
    trends: RegistrationTrendItem[];
    leaderboard?: SalesmanOnboardingItem[];
}

const PALETTE = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
    "#14b8a6", // teal
];

export const NewCustomerCharts: React.FC<NewCustomerChartsProps> = ({
    items,
    trends,
    leaderboard = [],
}) => {
    // Province Distribution (Top 10)
    const provinceData = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach((i) => {
            const p = i.province || "Other Areas";
            map.set(p, (map.get(p) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([name, count]) => ({
                name: name.length > 16 ? name.slice(0, 16) + "..." : name,
                fullName: name,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [items]);

    // Store Type Distribution
    const storeTypeData = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach((i) => {
            const st = i.storeType || "General";
            map.set(st, (map.get(st) || 0) + 1);
        });

        const total = items.length;
        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value,
                share: total > 0 ? (value / total) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Row 1: Registration Timeline Trend */}
            {trends.length > 1 && (
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Registration Growth Timeline
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Daily / chronological onboarding trend of new customer accounts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={trends}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11 }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload as RegistrationTrendItem;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-popover-foreground text-xs space-y-1.5">
                                                        <p className="font-bold text-foreground">{d.date}</p>
                                                        <p className="text-blue-500 font-semibold">
                                                            Registered: {d.count} accounts
                                                        </p>
                                                        <p className="text-emerald-500 font-semibold">
                                                            Active: {d.activeCount} accounts
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Total"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#totalGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="activeCount"
                                        name="Active"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#activeGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 2: Province Ranking & Store Type Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Province Distribution */}
                <Card className="lg:col-span-2 border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Top Provinces by Registrations
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Regional concentration of newly acquired outlets
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={provinceData}
                                    margin={{ top: 10, right: 15, left: 0, bottom: 25 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                        className="text-muted-foreground"
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.fullName}</p>
                                                        <p className="text-muted-foreground">
                                                            New Accounts:{" "}
                                                            <span className="font-bold text-foreground">
                                                                {d.count.toLocaleString()}
                                                            </span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {provinceData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Store Type Donut */}
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">
                            Store Classification
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Account breakdown by category
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex-1 flex flex-col justify-between">
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={storeTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {storeTypeData.map((_, index) => (
                                            <Cell
                                                key={`pie-cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-popover-foreground text-xs space-y-1">
                                                        <p className="font-bold text-foreground">{d.name}</p>
                                                        <p className="text-muted-foreground">
                                                            Count:{" "}
                                                            <strong className="text-foreground">{d.value}</strong> (
                                                            {d.share.toFixed(1)}%)
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                            {storeTypeData.slice(0, 4).map((st, i) => (
                                <div key={st.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                                        />
                                        <span className="truncate text-foreground font-medium">{st.name}</span>
                                    </div>
                                    <span className="text-muted-foreground text-[11px] font-mono">
                                        {st.share.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Salesman Leaderboard */}
            {leaderboard.length > 0 && (
                <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                    <span>Salesman Onboarding Leaderboard</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Top team members by new account registrations &amp; activation
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs font-semibold">
                                {leaderboard.length} Onboarders
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {leaderboard.map((sm, index) => {
                                const rank = index + 1;
                                return (
                                    <div
                                        key={sm.salesmanName}
                                        className="p-3 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-between space-y-2 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 truncate">
                                                <div
                                                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                                        rank === 1
                                                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                                            : rank === 2
                                                            ? "bg-slate-300/30 text-slate-700 dark:text-slate-300 border border-slate-400/30"
                                                            : rank === 3
                                                            ? "bg-amber-700/20 text-amber-800 dark:text-amber-600 border border-amber-700/30"
                                                            : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {rank}
                                                </div>
                                                <span className="font-bold text-xs text-foreground truncate">
                                                    {sm.salesmanName}
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold text-foreground">
                                                    {sm.totalOnboarded}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-1">
                                                    ({sm.activeCount} active)
                                                </span>
                                            </div>
                                        </div>

                                        <Progress value={sm.percentage} className="h-1.5" />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
