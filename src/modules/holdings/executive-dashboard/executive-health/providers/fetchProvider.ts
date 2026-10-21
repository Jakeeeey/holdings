import { VSalesPerformanceDataDto, TargetSettingExecutive, TargetSettingDivision } from "../types";

// In-memory cache store with TTL
interface CacheItem<T> {
    data: T;
    expiresAt: number;
}

const memoryCache = new Map<string, CacheItem<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const SALES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        memoryCache.delete(key);
        return null;
    }
    return item.data as T;
}

function setCached<T>(key: string, data: T, ttl: number): void {
    memoryCache.set(key, { data, expiresAt: Date.now() + ttl });
}

export const fetchExecutiveHealthData = async (startDate: string, endDate: string, groupId: string): Promise<VSalesPerformanceDataDto[]> => {
    const cacheKey = `sales:${groupId}:${startDate}:${endDate}`;

    // Check in-memory cache
    const cached = getCached<VSalesPerformanceDataDto[]>(cacheKey);
    if (cached) return cached;

    // Deduplicate in-flight requests
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey) as Promise<VSalesPerformanceDataDto[]>;
    }

    const request = (async () => {
        try {
            const url = `/api/holdings/dashboard/sales/${groupId}/api/view-sales-performance/all?startDate=${startDate}&endDate=${endDate}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("API Failed");

            const data: VSalesPerformanceDataDto[] = await res.json();
            const result = Array.isArray(data) ? data : [];
            setCached(cacheKey, result, SALES_CACHE_TTL);
            return result;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
};

export const fetchCompanyTargets = async (startDate: string, endDate: string, groupId: string): Promise<TargetSettingExecutive[]> => {
    const cacheKey = `targets:${groupId}:${startDate}:${endDate}`;
    const cached = getCached<TargetSettingExecutive[]>(cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey) as Promise<TargetSettingExecutive[]>;
    }

    const request = (async () => {
        try {
            const filter = JSON.stringify({ fiscal_period: { _between: [startDate, endDate] } });
            const url = `/api/holdings/dashboard/directus/${groupId}/items/target_setting_executive?filter=${filter}&sort=fiscal_period`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Target Fetch Failed");

            const data = await res.json();
            const result = Array.isArray(data?.data) ? data.data : [];
            setCached(cacheKey, result, METADATA_CACHE_TTL);
            return result;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
};

export const fetchDivisionTargets = async (tseIds: number[], groupId: string): Promise<TargetSettingDivision[]> => {
    if (tseIds.length === 0) return [];
    const cacheKey = `div_targets:${groupId}:${tseIds.slice().sort().join(",")}`;
    const cached = getCached<TargetSettingDivision[]>(cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey) as Promise<TargetSettingDivision[]>;
    }

    const request = (async () => {
        try {
            const filter = JSON.stringify({ tse_id: { _in: tseIds } });
            const url = `/api/holdings/dashboard/directus/${groupId}/items/target_setting_division?filter=${filter}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Division Target Fetch Failed");

            const data = await res.json();
            const result = Array.isArray(data?.data) ? data.data : [];
            setCached(cacheKey, result, METADATA_CACHE_TTL);
            return result;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
};

export const getDivisions = async (groupId: string): Promise<Record<string, unknown>[]> => {
    const cacheKey = `divisions:${groupId}`;
    const cached = getCached<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey) as Promise<Record<string, unknown>[]>;
    }

    const request = (async () => {
        try {
            const res = await fetch(`/api/holdings/dashboard/directus/${groupId}/items/division?filter[is_bia][_eq]=1`, {
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const json = await res.json();
            const result = (json?.data ?? []) as Record<string, unknown>[];
            setCached(cacheKey, result, METADATA_CACHE_TTL);
            return result;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
};

export const clearExecutiveHealthCache = () => {
    memoryCache.clear();
};
