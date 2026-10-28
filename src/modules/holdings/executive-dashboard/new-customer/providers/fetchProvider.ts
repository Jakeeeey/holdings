import {
    CustomerRawRecord,
    StoreTypeRecord,
    UserRecord,
    NewCustomerItem,
    NewCustomerReportData,
    NewCustomerKpis,
    StoreTypeSummary,
    ProvinceSummary
} from "../types";
import { parseISO, format, differenceInDays } from "date-fns";

const memoryCache = new Map<string, { data: NewCustomerReportData; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<NewCustomerReportData>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromEndpoint<T>(url: string): Promise<T[]> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const res = await fetch(url, {
                cache: "no-store",
                credentials: "include",
            });

            if (res.status === 429) {
                if (attempts < maxAttempts) {
                    await delay(attempts * 1000);
                    continue;
                }
            }

            if (!res.ok) {
                throw new Error(`Failed to fetch (${res.status}): ${res.statusText}`);
            }

            const json = await res.json();
            if (Array.isArray(json)) return json;
            if (json && Array.isArray(json.data)) return json.data;
            return [];
        } catch (err) {
            if (attempts >= maxAttempts) throw err;
            await delay(attempts * 800);
        }
    }
    return [];
}

export async function fetchNewCustomerData(
    startDate?: string,
    endDate?: string,
    groupId?: string | number
): Promise<NewCustomerReportData> {
    const cleanGroupId = groupId != null ? String(groupId) : "8";
    const cacheKey = `${cleanGroupId}:${startDate || "all"}:${endDate || "all"}`;

    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<NewCustomerReportData> => {
        const timestamp = Date.now();
        const baseProxy = `/api/holdings/dashboard/directus/${cleanGroupId}/items`;

        // Parallel fetch for customers, store_type, and user records
        const [rawCustomers, rawStoreTypes, rawUsers] = await Promise.all([
            fetchFromEndpoint<CustomerRawRecord>(
                `${baseProxy}/customer?limit=10000&sort=-date_entered&_t=${timestamp}`
            ).catch((err) => {
                console.warn("Directus customer fetch warning:", err);
                return [] as CustomerRawRecord[];
            }),
            fetchFromEndpoint<StoreTypeRecord>(
                `${baseProxy}/store_type?limit=1000&_t=${timestamp}`
            ).catch(() => [] as StoreTypeRecord[]),
            fetchFromEndpoint<UserRecord>(
                `${baseProxy}/user?limit=1000&_t=${timestamp}`
            ).catch(() => [] as UserRecord[]),
        ]);

        // Build lookup maps
        const storeTypeMap = new Map<string | number, string>();
        rawStoreTypes.forEach((st) => {
            storeTypeMap.set(st.id, st.store_type);
            storeTypeMap.set(String(st.id), st.store_type);
        });

        const userMap = new Map<number, string>();
        rawUsers.forEach((u) => {
            const uid = u.user_id || u.id;
            if (uid) {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || `User #${uid}`;
                userMap.set(uid, name);
            }
        });

        const now = new Date();

        // Filter by date range if provided
        const filteredCustomers = rawCustomers.filter((c) => {
            if (!c.date_entered) return false;
            const datePart = c.date_entered.slice(0, 10);
            if (startDate && datePart < startDate) return false;
            if (endDate && datePart > endDate) return false;
            return true;
        });

        // Normalize customer items
        const normalizedItems: NewCustomerItem[] = filteredCustomers.map((c) => {
            const stId = c.store_type;
            const stName = stId ? storeTypeMap.get(stId) || `Store Type #${stId}` : "General";
            const salesman = c.user_id ? userMap.get(c.user_id) || `User #${c.user_id}` : "Unassigned";

            const locationParts = [c.brgy, c.city, c.province].filter(Boolean);
            const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Not Specified";

            let formattedDate = "";
            let recencyLabel = "-";
            let isRecent = false;

            if (c.date_entered) {
                try {
                    const parsed = parseISO(c.date_entered);
                    formattedDate = format(parsed, "yyyy-MM-dd HH:mm");
                    const daysDiff = differenceInDays(now, parsed);

                    if (daysDiff === 0) {
                        recencyLabel = "Today";
                        isRecent = true;
                    } else if (daysDiff === 1) {
                        recencyLabel = "Yesterday";
                        isRecent = true;
                    } else if (daysDiff <= 7) {
                        recencyLabel = `${daysDiff}d ago`;
                        isRecent = true;
                    } else if (daysDiff <= 30) {
                        recencyLabel = `${Math.floor(daysDiff / 7)}w ago`;
                    } else {
                        recencyLabel = format(parsed, "MMM d, yyyy");
                    }
                } catch {
                    formattedDate = c.date_entered;
                }
            }

            return {
                id: c.id,
                customerCode: c.customer_code || "-",
                customerName: (c.customer_name || "Unnamed Customer").trim(),
                storeName: (c.store_name || c.customer_name || "Unnamed Store").trim(),
                storeSignage: c.store_signage || "",
                storeType: stName,
                storeTypeId: stId,
                type: c.type || "Regular",
                location: locationStr,
                brgy: c.brgy || "",
                city: c.city || "",
                province: c.province || "",
                contactNumber: c.contact_number || c.tel_number || "-",
                customerEmail: c.customer_email || "-",
                dateEntered: formattedDate,
                rawDate: c.date_entered || "",
                recencyLabel,
                isRecent,
                isActive: c.isActive === 1 || c.isActive === true,
                isVAT: c.isVAT === 1 || c.isVAT === true,
                isEWT: c.isEWT === 1 || c.isEWT === true,
                prospectStatus: c.prospect_status || "Registered",
                priceType: c.price_type || "-",
                salesmanName: salesman,
                customerTin: c.customer_tin || "-",
            };
        });

        // Compute KPIs
        const totalNewCustomers = normalizedItems.length;
        const activeCount = normalizedItems.filter((i) => i.isActive).length;
        const activePercentage = totalNewCustomers > 0 ? (activeCount / totalNewCustomers) * 100 : 0;
        const recentCount = normalizedItems.filter((i) => i.isRecent).length;

        // Group store types
        const storeTypeCountMap = new Map<string, number>();
        normalizedItems.forEach((i) => {
            const st = i.storeType || "General";
            storeTypeCountMap.set(st, (storeTypeCountMap.get(st) || 0) + 1);
        });

        const storeTypes: StoreTypeSummary[] = Array.from(storeTypeCountMap.entries())
            .map(([name, count]) => ({
                name,
                count,
                share: totalNewCustomers > 0 ? (count / totalNewCustomers) * 100 : 0,
            }))
            .sort((a, b) => b.count - a.count);

        // Group provinces
        const provinceCountMap = new Map<
            string,
            { count: number; activeCount: number; cities: Set<string>; storeTypes: Map<string, number> }
        >();
        const citiesSet = new Set<string>();

        normalizedItems.forEach((i) => {
            const prov = i.province || "Other Regions";
            if (i.city) citiesSet.add(i.city);

            const curr = provinceCountMap.get(prov) || {
                count: 0,
                activeCount: 0,
                cities: new Set<string>(),
                storeTypes: new Map<string, number>(),
            };
            curr.count++;
            if (i.isActive) curr.activeCount++;
            if (i.city) curr.cities.add(i.city);
            curr.storeTypes.set(i.storeType, (curr.storeTypes.get(i.storeType) || 0) + 1);
            provinceCountMap.set(prov, curr);
        });

        const provinces: ProvinceSummary[] = Array.from(provinceCountMap.entries())
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
                    totalAccounts: d.count,
                    activeAccounts: d.activeCount,
                    citiesCount: d.cities.size,
                    topStoreType: topSt,
                    count: d.count,
                    share: totalNewCustomers > 0 ? (d.count / totalNewCustomers) * 100 : 0,
                };
            })
            .sort((a, b) => b.totalAccounts - a.totalAccounts);

        const topProvince = provinces[0]?.province || "N/A";
        const topProvinceCount = provinces[0]?.totalAccounts || 0;

        const topStoreType = storeTypes[0]?.name || "N/A";
        const topStoreTypeCount = storeTypes[0]?.count || 0;

        const kpis: NewCustomerKpis = {
            totalNewCustomers,
            activeCount,
            activePercentage,
            topProvince,
            topProvinceCount,
            topStoreType,
            topStoreTypeCount,
            totalCities: citiesSet.size,
            recentCount,
        };

        const result: NewCustomerReportData = {
            kpis,
            items: normalizedItems,
            storeTypes,
            provinces,
            recentItems: normalizedItems.slice(0, 5),
        };

        memoryCache.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + 30_000,
        });

        return result;
    })();

    inFlightRequests.set(cacheKey, fetchPromise);

    try {
        return await fetchPromise;
    } finally {
        inFlightRequests.delete(cacheKey);
    }
}
