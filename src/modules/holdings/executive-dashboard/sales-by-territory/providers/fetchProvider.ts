import { AreaDrilldownDto } from "../types";

export const fetchAreaDrilldownData = async (
    startDate: string,
    endDate: string,
    groupId?: string | number
): Promise<AreaDrilldownDto[]> => {
    const timestamp = new Date().getTime();
    const gId = groupId != null ? String(groupId) : "1";
    const url = `/api/holdings/dashboard/sales/${gId}/api/view-sales-performance/all?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API Failed: ${res.status}`);

        const rawData = await res.json();

        if (Array.isArray(rawData)) {
            return rawData.map((item: Record<string, unknown>) => ({
                divisionName: (item.divisionName as string) || "Unassigned",
                province: (item.province as string) || (item.provinceName as string) || "Unknown Province",
                city: (item.city as string) || (item.cityName as string) || "Unknown City",
                supplierName: (item.supplierName as string) || "Unknown Supplier",
                salesmanName: (item.salesmanName as string) || "Unknown Salesman",
                netAmount: Number(item.netAmount) || 0
            }));
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch territory drill-down data:", error);
        return [];
    }
};
