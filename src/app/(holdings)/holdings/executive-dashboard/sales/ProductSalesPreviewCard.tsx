"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Shapes, TrendingUp, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductSalesData } from "@/modules/holdings/executive-dashboard/sales-by-product/providers/fetchProvider";
import type { ProductSaleRecord } from "@/modules/holdings/executive-dashboard/sales-by-product/types";

const formatShort = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(2)}M`;
    if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(1)}k`;
    return `${sign}₱${absVal.toFixed(2)}`;
};

interface TopProductSummary {
    name: string;
    revenue: number;
    count: number;
    share: number;
}

interface ProductSalesPreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

// Color palette for product indicators matching sample
const ROW_COLORS = [
    "bg-blue-600",
    "bg-blue-500",
    "bg-slate-500 dark:bg-slate-400",
    "bg-sky-400 dark:bg-sky-500",
    "bg-indigo-400 dark:bg-indigo-500",
];

const ROW_STATUSES = [
    { label: "Top Performer", color: "text-emerald-600 dark:text-emerald-400 font-bold" },
    { label: "High Demand", color: "text-emerald-600 dark:text-emerald-400 font-semibold" },
    { label: "Core Line", color: "text-muted-foreground font-medium" },
    { label: "Steady", color: "text-muted-foreground font-medium" },
    { label: "Long Tail", color: "text-muted-foreground font-medium" },
];

export function ProductSalesPreviewCard({ group, startDate: propStartDate, endDate: propEndDate }: ProductSalesPreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [topProducts, setTopProducts] = useState<TopProductSummary[]>([]);
    const [syncPending, setSyncPending] = useState(false);

    const today = new Date();
    const startDate = propStartDate || format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = propEndDate || format(endOfMonth(today), "yyyy-MM-dd");

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            try {
                const data: ProductSaleRecord[] = await fetchProductSalesData(
                    startDate,
                    endDate,
                    controller.signal,
                    { groupId: group.id }
                );

                if (!isMounted) return;

                if (Array.isArray(data) && data.length > 0) {
                    let sum = 0;
                    const map = new Map<string, { revenue: number; count: number }>();

                    data.forEach((r) => {
                        const amt = Number(r.amount || 0);
                        sum += amt;
                        const name = (r.productName && String(r.productName).trim()) || "Unknown Product";
                        const prev = map.get(name) || { revenue: 0, count: 0 };
                        map.set(name, {
                            revenue: prev.revenue + amt,
                            count: prev.count + 1,
                        });
                    });

                    const sorted = Array.from(map.entries())
                        .map(([name, d]) => ({
                            name,
                            revenue: d.revenue,
                            count: d.count,
                            share: sum > 0 ? (d.revenue / sum) * 100 : 0,
                        }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5);

                    setTotalRevenue(sum);
                    setTopProducts(sorted);
                    setSyncPending(false);
                } else {
                    setTotalRevenue(0);
                    setTopProducts([]);
                    setSyncPending(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.warn(`Product sales pending for group ${group.id}:`, err);
                    setSyncPending(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [group.id, startDate, endDate]);

    const top5TotalRevenue = topProducts.reduce((acc, p) => acc + p.revenue, 0);
    const top5Share = totalRevenue > 0 ? (top5TotalRevenue / totalRevenue) * 100 : 0;

    return (
        <Link 
            href={`/holdings/executive-dashboard/sales/${group.id}/sales-by-product?from=${startDate}&to=${endDate}`} 
            className="block h-full cursor-pointer group"
        >
            <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm">
                
                {/* Header */}
                <CardHeader className="border-b border-border/40 pb-4 pt-5 px-6 bg-muted/10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                                    {group.group_name || "Product Revenue Mix"}
                                </CardTitle>
                                {syncPending && (
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/5 shrink-0">
                                        Sync Pending
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Product line share &amp; revenue contribution
                            </p>
                        </div>
                        <div className="p-2 rounded-lg bg-background border border-border/40 shadow-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                            <Shapes className="h-4 w-4" />
                        </div>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="flex-1 p-6 flex flex-col justify-between gap-5">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            ))}
                            <Skeleton className="h-8 w-full rounded-lg mt-2" />
                        </div>
                    ) : topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((p, idx) => {
                                const colorClass = ROW_COLORS[idx % ROW_COLORS.length];
                                const status = ROW_STATUSES[idx % ROW_STATUSES.length];

                                return (
                                    <div key={p.name} className="space-y-1.5">
                                        {/* Product name & Revenue amount */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className={`h-2.5 w-2.5 rounded-xs shrink-0 ${colorClass}`} />
                                                <span className="font-semibold text-sm text-foreground truncate" title={p.name}>
                                                    {p.name}
                                                </span>
                                            </div>
                                            <span className="font-bold text-sm text-foreground tabular-nums shrink-0">
                                                {formatShort(p.revenue)}
                                            </span>
                                        </div>

                                        {/* Sub-row: Share %, Txns, Status */}
                                        <div className="flex items-center justify-between text-[11px] pl-4.5">
                                            <span className="text-muted-foreground">
                                                {p.share.toFixed(1)}% Share • {p.count} {p.count === 1 ? "Txn" : "Txns"}
                                            </span>
                                            <span className={`text-[11px] ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="pl-4.5">
                                            <div className="relative h-1.5 w-full bg-blue-100/60 dark:bg-muted/40 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                                                    style={{ width: `${Math.min(p.share, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Highlight Banner / Pill Footer */}
                            <div className="mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Top 5 Share %:
                                </span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                    {top5Share.toFixed(1)}% of Total Revenue ({formatShort(totalRevenue)})
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                            <TrendingUp className="h-8 w-8 opacity-30" />
                            <p className="text-xs font-semibold uppercase tracking-wider">No Sales Records Found</p>
                        </div>
                    )}

                    {/* Footer Nav Link */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        <span>View Detailed Product Performance</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
