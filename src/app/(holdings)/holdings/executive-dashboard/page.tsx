import React from "react";
import { ExecutiveDashboardView, DashboardGroup } from "./ExecutiveDashboardView";

async function getDashboardGroups(): Promise<DashboardGroup[]> {
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

    return <ExecutiveDashboardView initialGroups={rawGroups} />;
}

