"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Trophy } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


import { fetchExecutiveHealthData, fetchCompanyTargets } from "@/modules/holdings/executive-dashboard/executive-health/providers/fetchProvider";

const formatShort = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
    return `${sign}₱${absVal.toFixed(0)}`;
};

export function GroupPreviewCard({ group }: { group: { id: number; group_name: string; [key: string]: unknown } }) {
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState(0);
    const [target, setTarget] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const today = new Date();
                const startDate = format(startOfMonth(today), "yyyy-MM-dd");
                const endDate = format(endOfMonth(today), "yyyy-MM-dd");

                const [data, companyTargets] = await Promise.all([
                    fetchExecutiveHealthData(startDate, endDate, String(group.id)),
                    fetchCompanyTargets(startDate, endDate, String(group.id))
                ]);

                let totalSales = 0;
                if (Array.isArray(data)) {
                    totalSales = data.reduce((sum, item) => sum + (item.netAmount || 0), 0);
                }

                let totalTarget = 0;
                if (Array.isArray(companyTargets)) {
                    totalTarget = companyTargets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
                }

                setSales(totalSales);
                setTarget(totalTarget);
            } catch (err) {
                console.error(`Failed to load metrics for group ${group.id}:`, err);
            } finally {
                setLoading(false);
            }
        };
        
        load();
    }, [group.id]);

    const achievement = target > 0 ? (sales / target) * 100 : 0;
    const isAchieved = achievement >= 100;

    return (
        <Link href={`/holdings/executive-dashboard/sales/${group.id}/executive-health`} className="block h-full cursor-pointer">
            <Card className="relative overflow-hidden border-border/40 bg-card hover:border-primary/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full min-h-[220px] group">
            {/* Decorative background icon */}
                <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
                    <Trophy className="h-40 w-40 rotate-12" />
                </div>
                
                <CardHeader className="border-b border-border/40 bg-muted/5 pb-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black uppercase tracking-tight italic">
                            {group.group_name || "Unknown Group"}
                        </CardTitle>
                        <div className="p-2 bg-background rounded-xl border border-border/40 shadow-sm group-hover:bg-primary/5 transition-colors">
                            <LayoutDashboard className="h-4 w-4 text-primary opacity-80" />
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-6 flex flex-col gap-6 relative z-10 justify-center">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-2 w-full rounded-full" />
                                <div className="flex justify-between items-center pt-1">
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-2 w-12" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Skeleton className="h-2 w-12" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Achievement</p>
                                    <span className={`text-3xl font-black italic leading-none ${isAchieved ? "text-emerald-500" : "text-amber-500"}`}>
                                        {achievement.toFixed(1)}%
                                    </span>
                                </div>
                                <Badge className={`font-black text-[9px] uppercase px-2 py-0.5 tracking-widest ${isAchieved ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" : "bg-amber-500/20 text-amber-500 border-amber-500/20"}`} variant="outline">
                                    {isAchieved ? "On Track" : "Lagging"}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="relative h-2 bg-muted/20 rounded-full border border-border/10 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${
                                            isAchieved ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                        }`} 
                                        style={{ width: `${Math.min(achievement, 100)}%` }} 
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Actual Sales</span>
                                        <span className="text-sm font-black italic text-foreground leading-none">{formatShort(sales)}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Target Quota</span>
                                        <span className="text-sm font-black italic text-foreground leading-none">{formatShort(target)}</span>
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
