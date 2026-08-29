"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, DollarSign, Truck, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { fetchDriverCustomerVisits } from "@/modules/holdings/logistics/driver-kpi-tab/providers/fetchprovider";
import { calculateKPIs, isFulfilled } from "@/modules/holdings/logistics/driver-kpi-tab/utils/calculations";
import { formatCurrency } from "@/modules/holdings/logistics/driver-kpi-tab/utils/formatters";
import type { VisitRecord } from "@/modules/holdings/logistics/driver-kpi-tab/types";

function computeFulfillmentRate(
  data: VisitRecord[] | null | undefined,
): number {
  if (!data || data.length === 0) return 0;
  const fulfilled = data.filter((r) => isFulfilled(r.fulfillmentStatus)).length;
  return Math.round((fulfilled / data.length) * 100);
}

export function LogisticsPreviewCard({ group }: { group: { id: number; group_name: string; [key: string]: unknown } }) {
    const [loading, setLoading] = useState(true);
    const [avgDispatchVarianceHours, setAvgDispatchVarianceHours] = useState(0);
    const [avgArrivalVarianceHours, setAvgArrivalVarianceHours] = useState(0);
    const [totalFulfilledAmount, setTotalFulfilledAmount] = useState(0);
    const [fulfillmentRate, setFulfillmentRate] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const today = new Date();
                const startDate = format(startOfMonth(today), "yyyy-MM-dd");
                const endDate = format(endOfMonth(today), "yyyy-MM-dd");

                const data = await fetchDriverCustomerVisits({ startDate, endDate, limit: 10000 });
                const rows = data.rows || [];
                const kpis = calculateKPIs(rows);
                
                setAvgDispatchVarianceHours(kpis.avgDispatchVarianceHours);
                setAvgArrivalVarianceHours(kpis.avgArrivalVarianceHours);
                setTotalFulfilledAmount(kpis.totalFulfilledAmount);
                setFulfillmentRate(computeFulfillmentRate(rows as VisitRecord[]));
            } catch (err) {
                console.error(`Failed to load logistics metrics:`, err);
            } finally {
                setLoading(false);
            }
        };
        
        load();
    }, [group.id]);

    const isExcellent = fulfillmentRate >= 90;

    return (
        <Link href={`/holdings/logistics-performance/driver-kpi`} className="block h-full cursor-pointer group">
            <Card className="relative overflow-hidden border-border/40 bg-card hover:border-emerald-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full min-h-[260px]">
                
                {/* Premium Background Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
                
                {/* Decorative background icon */}
                <div className="absolute -right-6 -bottom-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                    <Truck className="h-48 w-48 -rotate-12 text-foreground" />
                </div>
                
                <CardHeader className="border-b border-border/40 bg-muted/5 pb-4 relative z-10 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-foreground">
                                {group.group_name || "Logistics Hub"}
                            </CardTitle>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                Live Performance
                            </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-xl border border-border/40 shadow-sm group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-300">
                            <Truck className="h-4 w-4 text-emerald-500 opacity-90" />
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-5 sm:p-6 flex flex-col relative z-10 justify-center gap-4">
                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            <Skeleton className="h-20 w-full rounded-xl bg-muted/40" />
                            <div className="grid grid-cols-2 gap-3">
                                <Skeleton className="h-20 w-full rounded-xl bg-muted/40" />
                                <div className="flex flex-col gap-2 justify-between">
                                    <Skeleton className="h-[36px] w-full rounded-lg bg-muted/40" />
                                    <Skeleton className="h-[36px] w-full rounded-lg bg-muted/40" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            
                            {/* Fulfillment Rate Banner (Primary Focus) */}
                            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-5 relative overflow-hidden group/rate hover:bg-emerald-500/10 transition-colors duration-300 shadow-sm">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover/rate:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                
                                <div className="flex justify-between items-end mb-3 relative z-10">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fulfillment Rate</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black italic text-emerald-600 dark:text-emerald-400 leading-none">
                                                {fulfillmentRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className={`px-2 py-1 text-[9px] uppercase tracking-widest border font-black ${isExcellent ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'}`} variant="outline">
                                        {isExcellent ? "Excellent" : "Needs Attention"}
                                    </Badge>
                                </div>

                                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden relative z-10 border border-border/20">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${isExcellent ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} 
                                        style={{ width: `${Math.min(fulfillmentRate, 100)}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Secondary Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Revenue / Value */}
                                <div className="bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-xl p-4 flex flex-col justify-center gap-2.5 transition-colors duration-300 group/item shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground group-hover/item:text-foreground transition-colors">
                                        <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Fulfilled Value</span>
                                    </div>
                                    <span className="text-lg sm:text-xl font-black italic text-foreground tracking-tight truncate">
                                        {formatCurrency(totalFulfilledAmount)}
                                    </span>
                                </div>
                                
                                {/* Timeliness Stats */}
                                <div className="flex flex-col gap-2 justify-between">
                                    <div className="bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-lg p-2.5 px-3 flex justify-between items-center transition-colors duration-300 shadow-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-[8.5px] font-black uppercase tracking-widest">Dispatch</span>
                                        </div>
                                        <span className="text-sm font-black italic text-foreground">{avgDispatchVarianceHours}h</span>
                                    </div>
                                    <div className="bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-lg p-2.5 px-3 flex justify-between items-center transition-colors duration-300 shadow-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[8.5px] font-black uppercase tracking-widest">Arrival</span>
                                        </div>
                                        <span className="text-sm font-black italic text-foreground">{avgArrivalVarianceHours}h</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
