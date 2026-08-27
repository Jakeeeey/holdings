import React from "react";
import { ChevronRight } from "lucide-react";


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
                        {rawGroups.map((group: { id: number, group_name: string, [key: string]: unknown }) => (
                            <GroupPreviewCard key={group.id} group={group} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
