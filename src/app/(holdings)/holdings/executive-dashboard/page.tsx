import React from "react";

import { ChevronRight, LayoutDashboard, Truck, Activity, Briefcase } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GroupPreviewCard } from "./sales/GroupPreviewCard";
import { LogisticsPreviewCard } from "./logistics/LogisticsPreviewCard";

async function getDashboardGroups() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/holdings/dashboard-api-groups`, { cache: 'no-store' });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch dashboard groups:", e);
    }
    return [];
}

export default async function ExecutiveDashboardRootPage() {
    const rawGroups = await getDashboardGroups();

    // Group the APIs by category
    const salesGroups = rawGroups.filter((g: { category: string }) => g.category === 'distribution-sales' || g.category === 'sales');
    const logisticsGroups = rawGroups.filter((g: { category: string }) => g.category === 'logistics-fullfillment-rate' || g.category === 'logistics');
    const otherGroups = rawGroups.filter((g: { category: string }) => !['distribution-sales', 'sales', 'logistics-fullfillment-rate', 'logistics'].includes(g.category));

    return (
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background">


            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 md:p-10 text-foreground">
                <div className="max-w-7xl mx-auto space-y-10">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
                                <span>Holdings Intelligence</span> <ChevronRight className="h-3 w-3" /> 
                                <span className="text-primary font-black">Executive Dashboard</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                                HOLDINGS <span className="text-primary">OVERVIEW</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                Centralized monitoring for all subsidiaries and business units
                            </p>
                        </div>
                    </div>

                    {/* SALES CATEGORY */}
                    {salesGroups.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                <Activity className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-black uppercase tracking-tight italic">Distribution & Sales</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {salesGroups.map((group: { id: number, group_name: string, [key: string]: unknown }) => (
                                    <GroupPreviewCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LOGISTICS CATEGORY */}
                    {logisticsGroups.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                <Truck className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-black uppercase tracking-tight italic">Logistics & Fulfillment</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {logisticsGroups.map((group: { id: number, group_name: string, [key: string]: unknown }) => (
                                    <LogisticsPreviewCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* OTHER CATEGORIES */}
                    {otherGroups.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-black uppercase tracking-tight italic">Other Business Units</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {otherGroups.map((group: { id: number, group_name?: string, category?: string }) => (
                                    <Card key={group.id} className="relative overflow-hidden border-border/40 bg-card hover:border-primary/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-[220px]">
                                        <CardHeader className="border-b border-border/40 bg-muted/5 pb-4 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-xl font-black uppercase tracking-tight italic">
                                                    {group.group_name || "Unknown Group"}
                                                </CardTitle>
                                                <div className="p-2 bg-background rounded-xl border border-border/40 shadow-sm">
                                                    <LayoutDashboard className="h-4 w-4 text-primary opacity-80" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1 p-6 flex flex-col gap-2 relative z-10 justify-center items-center">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{group.category}</Badge>
                                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50 mt-2">
                                                Module Pending
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
