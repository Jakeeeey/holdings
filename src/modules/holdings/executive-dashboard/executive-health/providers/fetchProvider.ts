import { VSalesPerformanceDataDto, TargetSettingExecutive, TargetSettingDivision } from "../types";

export const fetchExecutiveHealthData = async (startDate: string, endDate: string, groupId: string) => {
    // CACHE BUSTER: Add timestamp to force fresh data
    const timestamp = new Date().getTime();
    const url = `/api/holdings/dashboard/sales/${groupId}/api/view-sales-performance/all?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    console.log(`[Executive Fetch] ${startDate} -> ${endDate} for Group ${groupId}`);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("API Failed");

    const data: VSalesPerformanceDataDto[] = await res.json();
    return Array.isArray(data) ? data : [];
};

export const fetchCompanyTargets = async (startDate: string, endDate: string, groupId: string): Promise<TargetSettingExecutive[]> => {
    const filter = JSON.stringify({ fiscal_period: { _between: [startDate, endDate] } });
    const url = `/api/holdings/dashboard/directus/${groupId}/items/target_setting_executive?filter=${filter}&sort=fiscal_period`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Target Fetch Failed");

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
};

export const fetchDivisionTargets = async (tseIds: number[], groupId: string): Promise<TargetSettingDivision[]> => {
    if (tseIds.length === 0) return [];
    const filter = JSON.stringify({ tse_id: { _in: tseIds } });
    const url = `/api/holdings/dashboard/directus/${groupId}/items/target_setting_division?filter=${filter}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Division Target Fetch Failed");

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
};

export const getDivisions = async (groupId: string): Promise<any[]> => {
    const res = await fetch(`/api/holdings/dashboard/directus/${groupId}/items/division?filter[is_bia][_eq]=1`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return (json?.data ?? []) as any[];
};
