"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    subDays,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    parseISO,
    isWithinInterval,
} from "date-fns";
import { fetchNewCustomerData } from "../providers/fetchProvider";
import {
    NewCustomerItem,
    NewCustomerFilters,
    NewCustomerKpis,
    DatePreset,
    ProvinceSummary,
    RegistrationTrendItem,
    SalesmanOnboardingItem,
} from "../types";

interface UseNewCustomerReportOptions {
    groupId?: string | number;
    initialStartDate?: string;
    initialEndDate?: string;
}

export function useNewCustomerReport(options: UseNewCustomerReportOptions = {}) {
    const { groupId, initialStartDate, initialEndDate } = options;

    const today = new Date();
    const defaultStart = initialStartDate || format(startOfMonth(today), "yyyy-MM-dd");
    const defaultEnd = initialEndDate || format(endOfMonth(today), "yyyy-MM-dd");

    const [filters, setFilters] = useState<NewCustomerFilters>({
        preset: initialStartDate ? "custom" : "this-month",
        startDate: defaultStart,
        endDate: defaultEnd,
        search: "",
        province: "ALL",
        city: "ALL",
        storeType: "ALL",
        status: "ALL",
        type: "ALL",
    });

    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [activeTab, setActiveTab] = useState("registry");

    const [allItems, setAllItems] = useState<NewCustomerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Selected customer for modal
    const [selectedCustomer, setSelectedCustomer] = useState<NewCustomerItem | null>(null);

    // Sorting & Pagination
    const [sortField, setSortField] = useState<keyof NewCustomerItem>("rawDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const setDatePreset = useCallback((preset: DatePreset) => {
        const now = new Date();
        let s = "";
        let e = "";

        if (preset === "this-month") {
            s = format(startOfMonth(now), "yyyy-MM-dd");
            e = format(endOfMonth(now), "yyyy-MM-dd");
        } else if (preset === "last-30-days") {
            s = format(subDays(now, 30), "yyyy-MM-dd");
            e = format(now, "yyyy-MM-dd");
        } else if (preset === "this-quarter") {
            s = format(startOfQuarter(now), "yyyy-MM-dd");
            e = format(endOfQuarter(now), "yyyy-MM-dd");
        } else if (preset === "this-year") {
            s = format(startOfYear(now), "yyyy-MM-dd");
            e = format(endOfYear(now), "yyyy-MM-dd");
        } else if (preset === "all-time") {
            s = "";
            e = "";
        }

        setFilters((prev) => ({
            ...prev,
            preset,
            startDate: s,
            endDate: e,
        }));
        setCurrentPage(1);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNewCustomerData(filters.startDate, filters.endDate, groupId);
            setAllItems(data.items);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load customers";
            setError(msg);
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, groupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Unique options for filter dropdowns
    const filterOptions = useMemo(() => {
        const provinces = new Set<string>();
        const cities = new Set<string>();
        const types = new Set<string>();
        const customerTypes = new Set<string>();

        allItems.forEach((item) => {
            if (item.province) provinces.add(item.province);
            if (item.city) cities.add(item.city);
            if (item.storeType) types.add(item.storeType);
            if (item.type) customerTypes.add(item.type);
        });

        return {
            provinces: Array.from(provinces).sort(),
            cities: Array.from(cities).sort(),
            storeTypes: Array.from(types).sort(),
            customerTypes: Array.from(customerTypes).sort(),
        };
    }, [allItems]);

    // Filter Items
    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            if (filters.startDate && filters.endDate && item.rawDate) {
                try {
                    const itemDate = parseISO(item.rawDate.slice(0, 10));
                    const start = parseISO(filters.startDate);
                    const end = parseISO(filters.endDate);
                    if (!isWithinInterval(itemDate, { start, end })) return false;
                } catch {
                    // ignore
                }
            }

            if (filters.province !== "ALL" && item.province !== filters.province) {
                return false;
            }

            if (filters.city !== "ALL" && item.city !== filters.city) {
                return false;
            }

            if (filters.storeType !== "ALL" && item.storeType !== filters.storeType) {
                return false;
            }

            if (filters.status === "ACTIVE" && !item.isActive) {
                return false;
            }
            if (filters.status === "INACTIVE" && item.isActive) {
                return false;
            }

            if (filters.type !== "ALL" && item.type !== filters.type) {
                return false;
            }

            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                const matchName = item.customerName.toLowerCase().includes(q);
                const matchStore = item.storeName.toLowerCase().includes(q);
                const matchCode = item.customerCode.toLowerCase().includes(q);
                const matchLoc = item.location.toLowerCase().includes(q);
                const matchSalesman = item.salesmanName.toLowerCase().includes(q);
                if (!matchName && !matchStore && !matchCode && !matchLoc && !matchSalesman) {
                    return false;
                }
            }

            return true;
        });
    }, [allItems, filters]);

    // Sorting
    const sortedItems = useMemo(() => {
        const sorted = [...filteredItems];
        sorted.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (sortOrder === "asc") {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
        return sorted;
    }, [filteredItems, sortField, sortOrder]);

    // Pagination
    const totalCount = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedItems.slice(start, start + pageSize);
    }, [sortedItems, currentPage, pageSize]);

    // KPIs based on filtered items
    const kpis = useMemo<NewCustomerKpis>(() => {
        const total = filteredItems.length;
        const active = filteredItems.filter((i) => i.isActive).length;
        const activePct = total > 0 ? (active / total) * 100 : 0;
        const recent = filteredItems.filter((i) => i.isRecent).length;

        // Top Province
        const provMap = new Map<string, number>();
        const cities = new Set<string>();
        filteredItems.forEach((i) => {
            if (i.province) provMap.set(i.province, (provMap.get(i.province) || 0) + 1);
            if (i.city) cities.add(i.city);
        });
        let topP = "N/A";
        let topPC = 0;
        provMap.forEach((count, name) => {
            if (count > topPC) {
                topPC = count;
                topP = name;
            }
        });

        // Top Store Type
        const stMap = new Map<string, number>();
        filteredItems.forEach((i) => {
            if (i.storeType) stMap.set(i.storeType, (stMap.get(i.storeType) || 0) + 1);
        });
        let topSt = "N/A";
        let topStC = 0;
        stMap.forEach((count, name) => {
            if (count > topStC) {
                topStC = count;
                topSt = name;
            }
        });

        return {
            totalNewCustomers: total,
            activeCount: active,
            activePercentage: activePct,
            topProvince: topP,
            topProvinceCount: topPC,
            topStoreType: topSt,
            topStoreTypeCount: topStC,
            totalCities: cities.size,
            recentCount: recent,
        };
    }, [filteredItems]);

    // Province summaries for Geographic tab
    const provinceSummaries = useMemo<ProvinceSummary[]>(() => {
        const map = new Map<
            string,
            { total: number; active: number; cities: Set<string>; storeTypes: Map<string, number> }
        >();

        filteredItems.forEach((i) => {
            const p = i.province || "Other Areas";
            if (!map.has(p)) {
                map.set(p, { total: 0, active: 0, cities: new Set(), storeTypes: new Map() });
            }
            const cur = map.get(p)!;
            cur.total++;
            if (i.isActive) cur.active++;
            if (i.city) cur.cities.add(i.city);
            cur.storeTypes.set(i.storeType, (cur.storeTypes.get(i.storeType) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([province, d]) => {
                let topSt = "-";
                let topStC = 0;
                d.storeTypes.forEach((c, n) => {
                    if (c > topStC) {
                        topStC = c;
                        topSt = n;
                    }
                });

                return {
                    province,
                    totalAccounts: d.total,
                    activeAccounts: d.active,
                    citiesCount: d.cities.size,
                    topStoreType: topSt,
                };
            })
            .sort((a, b) => b.totalAccounts - a.totalAccounts);
    }, [filteredItems]);

    // Registration timeline trends for Analytics tab
    const registrationTrends = useMemo<RegistrationTrendItem[]>(() => {
        const dateMap = new Map<string, { count: number; active: number; parsedDate: Date }>();

        filteredItems.forEach((i) => {
            if (!i.rawDate) return;
            const dayKey = i.rawDate.slice(0, 10);
            if (!dateMap.has(dayKey)) {
                try {
                    dateMap.set(dayKey, { count: 0, active: 0, parsedDate: parseISO(dayKey) });
                } catch {
                    return;
                }
            }
            const cur = dateMap.get(dayKey)!;
            cur.count++;
            if (i.isActive) cur.active++;
        });

        const sortedKeys = Array.from(dateMap.keys()).sort();
        return sortedKeys.map((k) => {
            const d = dateMap.get(k)!;
            return {
                date: k,
                label: format(d.parsedDate, "MMM d"),
                count: d.count,
                activeCount: d.active,
            };
        });
    }, [filteredItems]);

    // Salesman Onboarding Leaderboard
    const salesmanLeaderboard = useMemo<SalesmanOnboardingItem[]>(() => {
        const map = new Map<string, { total: number; active: number }>();
        filteredItems.forEach((i) => {
            const s = i.salesmanName || "Unassigned";
            if (!map.has(s)) map.set(s, { total: 0, active: 0 });
            const cur = map.get(s)!;
            cur.total++;
            if (i.isActive) cur.active++;
        });

        const totalAccounts = filteredItems.length;
        return Array.from(map.entries())
            .map(([salesmanName, d]) => ({
                salesmanName,
                totalOnboarded: d.total,
                activeCount: d.active,
                percentage: totalAccounts > 0 ? (d.total / totalAccounts) * 100 : 0,
            }))
            .sort((a, b) => b.totalOnboarded - a.totalOnboarded)
            .slice(0, 10);
    }, [filteredItems]);

    const handleSort = (field: keyof NewCustomerItem) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setDatePreset("this-month");
        setFilters((prev) => ({
            ...prev,
            search: "",
            province: "ALL",
            city: "ALL",
            storeType: "ALL",
            status: "ALL",
            type: "ALL",
        }));
        setCurrentPage(1);
    };

    return {
        filters,
        setFilters,
        setDatePreset,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        loading,
        error,
        kpis,
        filterOptions,
        filteredItems,
        paginatedItems,
        totalCount,
        provinceSummaries,
        registrationTrends,
        salesmanLeaderboard,
        sortField,
        sortOrder,
        handleSort,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        selectedCustomer,
        setSelectedCustomer,
        loadData,
        resetFilters,
    };
}
