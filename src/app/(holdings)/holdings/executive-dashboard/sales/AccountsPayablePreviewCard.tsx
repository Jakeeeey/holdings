"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingDown, ChevronRight, Briefcase, PhilippinePeso, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { transformAPRows, deriveMetrics, buildCategoryBreakdown } from "@/modules/holdings/executive-dashboard/accounts-payable/utils";
import type { RawAPRow, APMetrics, APCategoryBreakdown } from "@/modules/holdings/executive-dashboard/accounts-payable/types";

interface AccountsPayablePreviewCardProps {
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

export function AccountsPayablePreviewCard({
    group,
    startDate,
    endDate,
}: AccountsPayablePreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<APMetrics | null>(null);
    const [breakdowns, setBreakdowns] = useState<APCategoryBreakdown[]>([]);
    const [overdueCount, setOverdueCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    startDate: startDate || '2020-01-01',
                    endDate: endDate || new Date().toISOString().split('T')[0],
                });

                const res = await fetch(
                    `/api/holdings/executive-dashboard/sales/${group.id}/accounts-payable?${params}`,
                    { credentials: 'include' }
                );
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);

                const result = await res.json();
                const rows: RawAPRow[] = Array.isArray(result)
                    ? result
                    : (result.rows ?? result.data ?? result.content ?? result.transactions ?? []);

                const records = transformAPRows(rows);
                if (!isMounted) return;

                const derived = deriveMetrics(records);
                const cats = buildCategoryBreakdown(records);
                const overdue = records.filter(
                    (r) => r.aging !== null && r.aging >= 0 && r.outstandingBalance > 0
                ).length;

                setMetrics(derived);
                setBreakdowns(cats);
                setOverdueCount(overdue);
            } catch (err) {
                if (isMounted) {
                    console.warn(`AP metrics pending for group ${group.id}:`, err);
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

    const totalPayable = metrics?.totalPayable ?? 0;
    const totalPaid = metrics?.totalPaid ?? 0;
    const totalOutstanding = metrics?.totalOutstanding ?? 0;
    const settlementRate = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;
    const safeSettlementRate = Math.min(100, Math.max(0, settlementRate));

    const tradeCat = breakdowns.find((b) => b.category === "Trade");
    const nonTradeCat = breakdowns.find((b) => b.category === "Non-Trade");

    return (
        <Link
            href={`/holdings/executive-dashboard/sales/${group.id}/accounts-payable`}
            className="block h-full cursor-pointer group"
        >
            <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-amber-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm min-h-[290px]">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-amber-500/10 transition-colors duration-500 pointer-events-none" />
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                    <Wallet className="h-36 w-36 text-foreground" />
                </div>

                {/* Header */}
                <CardHeader className="border-b border-border/40 pb-3 pt-5 px-6 bg-muted/10 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                                    {group.group_name || "Accounts Payable"}
                                </CardTitle>
                                {overdueCount > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] uppercase font-bold tracking-wider text-rose-500 border-rose-500/30 bg-rose-500/5 shrink-0"
                                    >
                                        {overdueCount} Overdue
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Trade vs Non-Trade payables, aging, and supplier exposure
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <Wallet className="h-5 w-5" />
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
                                        <TrendingDown className="h-3 w-3 text-rose-500" /> Outstanding
                                    </span>
                                    <p className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                                        {formatPhpShort(totalOutstanding)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <PhilippinePeso className="h-3 w-3 text-emerald-500" /> Total Paid
                                    </span>
                                    <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatPhpShort(totalPaid)}
                                    </p>
                                </div>
                            </div>

                            {/* Settlement Progress */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/30">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Settlement Rate</span>
                                    <span className="font-mono font-bold text-foreground">
                                        {settlementRate.toFixed(1)}%
                                    </span>
                                </div>
                                <Progress value={safeSettlementRate} className="h-2" />
                            </div>

                            {/* Secondary stats row: Trade vs Non-Trade Breakdown */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3 text-sky-500" />
                                        <span className="text-[11px] text-muted-foreground">Trade:</span>
                                        <span className="font-mono font-semibold text-foreground text-[11px]">
                                            {formatPhpShort(tradeCat?.totalOutstanding ?? 0)}
                                        </span>
                                    </div>
                                    <span className="text-border">|</span>
                                    <div className="flex items-center gap-1">
                                        <Wallet className="h-3 w-3 text-amber-500" />
                                        <span className="text-[11px] text-muted-foreground">Non-Trade:</span>
                                        <span className="font-mono font-semibold text-foreground text-[11px]">
                                            {formatPhpShort(nonTradeCat?.totalOutstanding ?? 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[11px] font-medium font-mono">
                                        {metrics?.totalRecords ?? 0} bills
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer link cue */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        <span>View Detailed Accounts Payable</span>
                        <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default AccountsPayablePreviewCard;
