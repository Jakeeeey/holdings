import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, LayoutDashboard, Target, Activity, Trophy, Truck } from "lucide-react";
import { 
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Formatting helpers
const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
const formatShort = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
    return `${sign}₱${absVal.toFixed(0)}`;
};

import { GroupPreviewCard } from "./GroupPreviewCard";

async function getSalesGroups() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/holdings/dashboard-api-groups`, { cache: 'no-store' });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error(e);
    }
    return [
        { 
            id: 1, 
            category: "distribution-sales", 
            group_name: "Men2 Marketing",
            directus: "http://goatedcodoer:8091/",
            directus_token: "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn",
            springboot: "http://goatedcodoer:8083/"
        }
    ];
}

export default async function SalesGroupListPage() {
    const rawGroups = await getSalesGroups();

    return (
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 px-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/holdings/executive-dashboard">Holdings</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/holdings/executive-dashboard">Executive Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Sales Vs Target</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 md:p-10 text-foreground">
                <div className="max-w-7xl mx-auto space-y-10">
                    
                    {/* --- HEADER STYLED LIKE EXECUTIVE HEALTH --- */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
                                <span>Holdings Intelligence</span> <ChevronRight className="h-3 w-3" /> 
                                <span>Executive Dashboard</span> <ChevronRight className="h-3 w-3" /> 
                                <span className="text-primary font-black">Sales vs Target</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                                SALES <span className="text-primary">GROUPS</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                Select a division below to view its Executive Health and Supplier Analytics
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {rawGroups.map((group: any) => (
                            <GroupPreviewCard key={group.id} group={group} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
