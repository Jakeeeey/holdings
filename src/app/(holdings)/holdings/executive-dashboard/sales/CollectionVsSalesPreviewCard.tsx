"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, TrendingUp, ChevronRight, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { fetchCollectionVsSalesReport } from "@/modules/holdings/executive-dashboard/collection-vs-sales/providers/fetchProvider";
import type { CollectionVsSalesResponse } from "@/modules/holdings/executive-dashboard/collection-vs-sales/types";

interface CollectionVsSalesPreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

function formatPhpShort(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
    }
    if (amount >= 1_000_000) {
        return `₱${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (amount >= 1_000) {
        return `₱${(amount / 1_000).toFixed(1)}k`;
    }
    return `₱${amount.toFixed(0)}`;
}

export function CollectionVsSalesPreviewCard({
    group,
    startDate: propStartDate,
    endDate: propEndDate,
}: CollectionVsSalesPreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CollectionVsSalesResponse | null>(null);
    const [syncPending, setSyncPending] = useState(false);

    const today = new Date();
    const startDate = propStartDate || format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = propEndDate || format(endOfMonth(today), "yyyy-MM-dd");

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchCollectionVsSalesReport(
                    {
                        startDate,
                        endDate,
                        salesmanId: "ALL",
                        paymentMethod: "ALL",
                        searchQuery: "",
                    },
                    group.id
                );
                if (!isMounted) return;
                setData(res);
                setSyncPending(false);
            } catch (err) {
                if (isMounted) {
                    console.warn(`Collection vs sales metrics pending for group ${group.id}:`, err);
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
        };
    }, [group.id, startDate, endDate]);

    const kpis = data?.kpis;
    const isSurplus = (kpis?.variance ?? 0) >= 0;
    const eff = Math.min(100, Math.max(0, kpis?.collectionEfficiency ?? 0));

    return (
        <Link
            href={`/holdings/executive-dashboard/sales/${group.id}/collection-vs-sales?from=${startDate}&to=${endDate}`}
            className="block h-full cursor-pointer group"
        >
            <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-emerald-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm min-h-[290px]">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none" />
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                    <Receipt className="h-36 w-36 text-foreground" />
                </div>

                {/* Header */}
                <CardHeader className="border-b border-border/40 pb-3 pt-5 px-6 bg-muted/10 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                                    {group.group_name || "Collection vs Sales"}
                                </CardTitle>
                                {syncPending && (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] uppercase font-bold tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/5 shrink-0"
                                    >
                                        Sync Pending
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Invoiced revenue vs real collections &amp; efficiency
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <Receipt className="h-5 w-5" />
                        </div>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-6 flex-1 flex flex-col justify-between gap-5 relative z-10">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-14 rounded-xl" />
                                <Skeleton className="h-14 rounded-xl" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                            <Skeleton className="h-10 rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-blue-500" /> Invoiced Sales
                                    </span>
                                    <p className="text-2xl font-black tracking-tight text-foreground font-mono">
                                        {formatPhpShort(kpis?.totalSales ?? 0)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Receipt className="h-3 w-3 text-emerald-500" /> Collected
                                    </span>
                                    <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatPhpShort(kpis?.totalCollected ?? 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Collection Efficiency Progress */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/30">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Collection Efficiency</span>
                                    <span className="font-mono font-bold text-foreground">
                                        {(kpis?.collectionEfficiency ?? 0).toFixed(1)}%
                                    </span>
                                </div>
                                <Progress value={eff} className="h-2" />
                            </div>

                            {/* Secondary stats row: Variance & Payment Mode */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 ${
                                            isSurplus
                                                ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                                                : "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5"
                                        }`}
                                    >
                                        {isSurplus ? (
                                            <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3 mr-0.5 inline" />
                                        )}
                                        {isSurplus ? "Surplus " : "Gap "}
                                        {formatPhpShort(Math.abs(kpis?.variance ?? 0))}
                                    </Badge>
                                </div>

                                {kpis?.topPaymentMethod && kpis.topPaymentMethod !== "N/A" && (
                                    <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[150px]">
                                        <CreditCard className="h-3 w-3 shrink-0 text-amber-500" />
                                        <span className="truncate text-[11px] font-medium">
                                            {kpis.topPaymentMethod}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Footer link cue */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        <span>View Detailed Collections &amp; Salesmen</span>
                        <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default CollectionVsSalesPreviewCard;
