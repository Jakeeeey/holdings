"use client";

import React, { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { ChevronRight, ChevronLeft, LayoutDashboard, Layers, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GroupPreviewCard } from "./sales/GroupPreviewCard";
import { ProductSalesPreviewCard } from "./sales/ProductSalesPreviewCard";
import { LogisticsPreviewCard } from "./logistics/LogisticsPreviewCard";

export interface DashboardGroup {
    id: number;
    category: string;
    group_name: string;
    container_id?: number | { id: number; name: string; description?: string | null } | null;
    container?: {
        id: number | string;
        name: string;
        description?: string | null;
    } | null;
    [key: string]: unknown;
}

interface ContainerSection {
    id: string | number;
    name: string;
    description?: string | null;
    groups: DashboardGroup[];
}

export function ExecutiveDashboardView({ initialGroups }: { initialGroups: DashboardGroup[] }) {
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    // Compute exact weekly boundaries (Monday to Sunday)
    const { startDate, endDate, startLabel, endLabel, weekNumber, isCurrentWeek, isLastWeek } = useMemo(() => {
        const today = new Date();
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

        return {
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd"),
            startLabel: format(start, "MMM d"),
            endLabel: format(end, "MMM d, yyyy"),
            weekNumber: format(currentDate, "w"),
            isCurrentWeek: format(start, "yyyy-MM-dd") === format(thisWeekStart, "yyyy-MM-dd"),
            isLastWeek: format(start, "yyyy-MM-dd") === format(lastWeekStart, "yyyy-MM-dd"),
        };
    }, [currentDate]);

    // Group the APIs based on the dashboard container
    const containerSections = useMemo(() => {
        const containerMap = new Map<string | number, ContainerSection>();

        initialGroups.forEach((group) => {
            let containerObj: { id: number | string; name: string; description?: string | null } | null = null;
            if (group.container) {
                containerObj = group.container;
            } else if (group.container_id && typeof group.container_id === "object") {
                containerObj = group.container_id;
            }

            const containerId: string | number = containerObj?.id != null
                ? containerObj.id
                : (typeof group.container_id === "number" || typeof group.container_id === "string" ? group.container_id : "unassigned");
            const containerName = containerObj?.name ?? (containerId === "unassigned" ? "General Business Units" : `Container ${containerId}`);
            const containerDescription = containerObj?.description ?? null;

            if (!containerMap.has(containerId)) {
                containerMap.set(containerId, {
                    id: containerId,
                    name: containerName,
                    description: containerDescription,
                    groups: []
                });
            }

            containerMap.get(containerId)!.groups.push(group);
        });

        return Array.from(containerMap.values());
    }, [initialGroups]);

    return (
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 md:p-10 text-foreground">
                <div className="max-w-7xl mx-auto space-y-10">
                    
                    {/* --- HEADER WITH WEEKLY DATE FILTER --- */}
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
                                Centralized monitoring grouped by business containers
                            </p>
                        </div>

                        {/* WEEKLY DATE FILTER CONTROLS */}
                        <div className="flex flex-wrap items-center gap-2 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-2 shadow-xl">
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1 border-r border-border/40 pr-2">
                                <Button
                                    variant={isCurrentWeek ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setCurrentDate(new Date())}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5"
                                >
                                    This Week
                                </Button>
                                <Button
                                    variant={isLastWeek ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setCurrentDate(subWeeks(new Date(), 1))}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5"
                                >
                                    Last Week
                                </Button>
                            </div>

                            {/* Week Stepper */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentDate((prev) => subWeeks(prev, 1))}
                                    className="h-7 w-7 rounded-lg"
                                    title="Previous Week"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-2 px-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground whitespace-nowrap">
                                        {startLabel} – {endLabel}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] font-black tracking-wider px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                                        W{weekNumber}
                                    </Badge>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentDate((prev) => addWeeks(prev, 1))}
                                    className="h-7 w-7 rounded-lg"
                                    title="Next Week"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC CONTAINER SECTIONS */}
                    {containerSections.map((section) => (
                        <div key={section.id} className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-3 gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight italic text-foreground">
                                            {section.name}
                                        </h3>
                                        {section.description && (
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {section.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 border-border/60">
                                    {section.groups.length} {section.groups.length === 1 ? "Module" : "Modules"}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                                {section.groups.map((group) => {
                                    const cat = (group.category || "").toLowerCase();
                                    if (cat === "distribution-sales" || cat === "sales") {
                                        return (
                                            <GroupPreviewCard 
                                                key={group.id} 
                                                group={group} 
                                                startDate={startDate} 
                                                endDate={endDate} 
                                            />
                                        );
                                    }
                                    if (cat === "sales-by-product" || cat === "product-sales-performance" || cat === "product-sales") {
                                        return (
                                            <ProductSalesPreviewCard 
                                                key={group.id} 
                                                group={group} 
                                                startDate={startDate} 
                                                endDate={endDate} 
                                            />
                                        );
                                    }
                                    if (cat === "logistics-fullfillment-rate" || cat === "logistics") {
                                        return (
                                            <LogisticsPreviewCard 
                                                key={group.id} 
                                                group={group} 
                                                startDate={startDate} 
                                                endDate={endDate} 
                                            />
                                        );
                                    }
                                    return (
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
                                                    Module Active
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {containerSections.length === 0 && (
                        <div className="py-16 text-center text-muted-foreground border border-dashed rounded-xl border-border/60">
                            <LayoutDashboard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold uppercase tracking-wider text-sm">No Dashboard Containers Found</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Configure dashboard API groups and containers to view executive performance.</p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
