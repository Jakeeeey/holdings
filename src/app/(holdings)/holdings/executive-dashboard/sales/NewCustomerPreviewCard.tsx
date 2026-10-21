"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, CheckCircle2, MapPin, Store, ChevronRight, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNewCustomerData } from "@/modules/holdings/executive-dashboard/new-customer/providers/fetchProvider";
import type { NewCustomerReportData } from "@/modules/holdings/executive-dashboard/new-customer/types";

interface NewCustomerPreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

const STORE_TYPE_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
];

export function NewCustomerPreviewCard({
    group,
    startDate: propStartDate,
    endDate: propEndDate,
}: NewCustomerPreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<NewCustomerReportData | null>(null);
    const [syncPending, setSyncPending] = useState(false);

    const today = new Date();
    const startDate = propStartDate || format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = propEndDate || format(endOfMonth(today), "yyyy-MM-dd");

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchNewCustomerData(startDate, endDate, group.id);
                if (!isMounted) return;
                setData(res);
                setSyncPending(false);
            } catch (err) {
                if (isMounted) {
                    console.warn(`New customer metrics pending for group ${group.id}:`, err);
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
    const storeTypes = (data?.storeTypes || []).slice(0, 3);

    return (
        <Link
            href={`/holdings/executive-dashboard/sales/${group.id}/new-customer?from=${startDate}&to=${endDate}`}
            className="block h-full cursor-pointer group"
        >
            <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-blue-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm min-h-[290px]">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                    <UserPlus className="h-36 w-36 text-foreground" />
                </div>

                {/* Header */}
                <CardHeader className="border-b border-border/40 pb-3 pt-5 px-6 bg-muted/10 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                                    {group.group_name || "New Customer Growth"}
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
                                Account acquisitions &amp; onboarding registry
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-6 flex flex-col justify-between flex-1 relative z-10 gap-4">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-9 w-32" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-4/5" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Headline Stats */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 block">
                                            New Accounts
                                        </span>
                                        <div className="text-3xl font-black italic tracking-tight text-foreground flex items-baseline gap-1.5 mt-0.5">
                                            <span>{(kpis?.totalNewCustomers ?? 0).toLocaleString()}</span>
                                            <span className="text-xs font-semibold not-italic text-muted-foreground">
                                                stores
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5"
                                        variant="outline"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                                        {(kpis?.activePercentage ?? 0).toFixed(1)}% Active
                                    </Badge>
                                </div>

                                {/* Active Progress Bar */}
                                <div className="space-y-1 pt-1">
                                    <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${Math.min(100, kpis?.activePercentage ?? 0)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium pt-0.5">
                                        <span>{(kpis?.activeCount ?? 0).toLocaleString()} active stores</span>
                                        <span>{(kpis?.totalCities ?? 0)} cities reached</span>
                                    </div>
                                </div>
                            </div>

                            {/* Store Type & Regional Pill Highlights */}
                            <div className="space-y-2.5 pt-1 border-t border-border/30">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Store className="h-3 w-3 text-primary" /> Store Segments
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-amber-500" /> {kpis?.topProvince || "Regional"}
                                    </span>
                                </div>

                                {/* Store Type Distribution Bars */}
                                <div className="space-y-1.5">
                                    {storeTypes.length > 0 ? (
                                        storeTypes.map((st, idx) => (
                                            <div key={st.name} className="space-y-0.5">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                                                        {st.name}
                                                    </span>
                                                    <span className="text-muted-foreground text-[10px] font-medium">
                                                        {st.count} ({st.share.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${STORE_TYPE_COLORS[idx % STORE_TYPE_COLORS.length]} transition-all duration-500`}
                                                        style={{ width: `${Math.min(100, st.share)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground/70 italic text-center py-2">
                                            No store classifications found in range
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer CTA */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 group-hover:text-blue-500 transition-colors">
                        <span className="flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3" />
                            View New Customer Report
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
