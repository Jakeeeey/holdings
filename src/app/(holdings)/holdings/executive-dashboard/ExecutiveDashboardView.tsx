"use client";

import React, { useState, useMemo } from "react";
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    subWeeks, 
    addWeeks,
    startOfMonth,
    endOfMonth,
    subMonths,
    addMonths,
    startOfYear,
    endOfYear,
    subYears,
    addYears,
    setMonth,
    isSameMonth,
    isSameYear
} from "date-fns";
import { ChevronRight, ChevronLeft, LayoutDashboard, Layers, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GroupPreviewCard } from "./sales/GroupPreviewCard";
import { ProductSalesPreviewCard } from "./sales/ProductSalesPreviewCard";
import { SalesByTerritoryPreviewCard } from "./sales/SalesByTerritoryPreviewCard";
import { CustomerSalesPreviewCard } from "./sales/CustomerSalesPreviewCard";
import { AgingSlobPreviewCard } from "./sales/AgingSlobPreviewCard";
import { LogisticsPreviewCard } from "./logistics/LogisticsPreviewCard";
import { NewCustomerPreviewCard } from "./sales/NewCustomerPreviewCard";

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

type FilterMode = "weekly" | "monthly" | "ytd";

const MONTHS = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
];

export function ExecutiveDashboardView({ initialGroups }: { initialGroups: DashboardGroup[] }) {
    const [filterMode, setFilterMode] = useState<FilterMode>("weekly");
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    // Compute date boundaries based on selected filter mode
    const { 
        startDate, 
        endDate, 
        dateLabel, 
        badgeText, 
        isCurrentPeriod, 
        isPreviousPeriod 
    } = useMemo(() => {
        const today = new Date();

        if (filterMode === "monthly") {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const thisMonth = startOfMonth(today);
            const lastMonth = startOfMonth(subMonths(today, 1));

            return {
                startDate: format(start, "yyyy-MM-dd"),
                endDate: format(end, "yyyy-MM-dd"),
                dateLabel: format(currentDate, "MMMM yyyy"),
                badgeText: format(currentDate, "MMM"),
                isCurrentPeriod: isSameMonth(currentDate, thisMonth),
                isPreviousPeriod: isSameMonth(currentDate, lastMonth),
            };
        }

        if (filterMode === "ytd") {
            const start = startOfYear(currentDate);
            const isCurrentYr = isSameYear(currentDate, today);
            const end = isCurrentYr ? today : endOfYear(currentDate);
            const lastYear = subYears(today, 1);

            return {
                startDate: format(start, "yyyy-MM-dd"),
                endDate: format(end, "yyyy-MM-dd"),
                dateLabel: `Jan 1 – ${format(end, "MMM d, yyyy")}`,
                badgeText: `YTD ${format(currentDate, "yyyy")}`,
                isCurrentPeriod: isCurrentYr,
                isPreviousPeriod: isSameYear(currentDate, lastYear),
            };
        }

        // Default: weekly (Monday to Sunday)
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

        return {
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd"),
            dateLabel: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
            badgeText: `W${format(currentDate, "w")}`,
            isCurrentPeriod: format(start, "yyyy-MM-dd") === format(thisWeekStart, "yyyy-MM-dd"),
            isPreviousPeriod: format(start, "yyyy-MM-dd") === format(lastWeekStart, "yyyy-MM-dd"),
        };
    }, [currentDate, filterMode]);

    const handlePrevious = () => {
        setCurrentDate((prev) => {
            if (filterMode === "monthly") return subMonths(prev, 1);
            if (filterMode === "ytd") return subYears(prev, 1);
            return subWeeks(prev, 1);
        });
    };

    const handleNext = () => {
        setCurrentDate((prev) => {
            if (filterMode === "monthly") return addMonths(prev, 1);
            if (filterMode === "ytd") return addYears(prev, 1);
            return addWeeks(prev, 1);
        });
    };

    const handleSetCurrentPeriod = () => {
        setCurrentDate(new Date());
    };

    const handleSetPreviousPeriod = () => {
        const today = new Date();
        if (filterMode === "monthly") {
            setCurrentDate(subMonths(today, 1));
        } else if (filterMode === "ytd") {
            setCurrentDate(subYears(today, 1));
        } else {
            setCurrentDate(subWeeks(today, 1));
        }
    };

    const handleMonthChange = (monthIndexStr: string) => {
        const monthIndex = parseInt(monthIndexStr, 10);
        setCurrentDate((prev) => setMonth(prev, monthIndex));
    };

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

                        {/* DATE FILTER CONTROLS */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-2 shadow-xl">
                            {/* Mode Selector */}
                            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
                                <Button
                                    variant={filterMode === "weekly" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilterMode("weekly")}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5 rounded-lg"
                                >
                                    Weekly
                                </Button>
                                <Button
                                    variant={filterMode === "monthly" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilterMode("monthly")}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5 rounded-lg"
                                >
                                    Monthly
                                </Button>
                                <Button
                                    variant={filterMode === "ytd" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilterMode("ytd")}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5 rounded-lg"
                                >
                                    YTD
                                </Button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1 border-r border-border/40 pr-2">
                                <Button
                                    variant={isCurrentPeriod ? "default" : "ghost"}
                                    size="sm"
                                    onClick={handleSetCurrentPeriod}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5"
                                >
                                    {filterMode === "monthly" ? "This Month" : filterMode === "ytd" ? "This Year" : "This Week"}
                                </Button>
                                <Button
                                    variant={isPreviousPeriod ? "default" : "ghost"}
                                    size="sm"
                                    onClick={handleSetPreviousPeriod}
                                    className="h-7 text-[10px] font-black uppercase tracking-wider px-2.5"
                                >
                                    {filterMode === "monthly" ? "Last Month" : filterMode === "ytd" ? "Last Year" : "Last Week"}
                                </Button>
                            </div>

                            {/* Month Dropdown (Monthly mode only) */}
                            {filterMode === "monthly" && (
                                <div className="border-r border-border/40 pr-2">
                                    <Select
                                        value={String(currentDate.getMonth())}
                                        onValueChange={handleMonthChange}
                                    >
                                        <SelectTrigger className="h-7 w-[125px] text-[10px] font-black uppercase tracking-wider bg-background/50 border-border/60">
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((m) => (
                                                <SelectItem key={m.value} value={m.value} className="text-xs">
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Stepper & Date Display */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevious}
                                    className="h-7 w-7 rounded-lg"
                                    title="Previous"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-2 px-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground whitespace-nowrap">
                                        {dateLabel}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] font-black tracking-wider px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                                        {badgeText}
                                    </Badge>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleNext}
                                    className="h-7 w-7 rounded-lg"
                                    title="Next"
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
                                    if (cat === "sales-by-territory" || cat === "sales-by-area" || cat === "area") {
                                        return (
                                            <SalesByTerritoryPreviewCard 
                                                key={group.id} 
                                                group={group} 
                                                startDate={startDate} 
                                                endDate={endDate} 
                                            />
                                        );
                                    }
                                    if (cat === "sales-by-customer" || cat === "customer-sales" || cat === "sales-by-customers") {
                                        return (
                                            <CustomerSalesPreviewCard 
                                                key={group.id} 
                                                group={group} 
                                                startDate={startDate} 
                                                endDate={endDate} 
                                            />
                                        );
                                    }
                                    if (cat === "aging-and-slob" || cat === "slob-aging" || cat === "aging-slob" || cat === "stock-health-monitor") {
                                        return (
                                            <AgingSlobPreviewCard 
                                                key={group.id} 
                                                group={group} 
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
                                    if (cat === "new-customer" || cat === "new-customers" || cat === "new customer") {
                                        return (
                                            <NewCustomerPreviewCard 
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
