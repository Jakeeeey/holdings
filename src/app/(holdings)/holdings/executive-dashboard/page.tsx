import React from "react";
import { ExecutiveDashboardView } from "./ExecutiveDashboardView";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";

export default async function ExecutiveDashboardRootPage() {
    const rawGroups = await fetchDashboardGroups();

    return <ExecutiveDashboardView initialGroups={rawGroups} />;
}

