import { SalesReportItemizedRecord } from "../types";

// In-memory cache & active in-flight promises
const memoryCache = new Map<string, { data: SalesReportItemizedRecord[]; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<SalesReportItemizedRecord[]>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchSalesByCustomerData = async (
  startDate: string,
  endDate: string,
  groupId?: string | number,
): Promise<SalesReportItemizedRecord[]> => {
  const cleanGroupId = groupId != null ? String(groupId) : "";
  const cacheKey = `${cleanGroupId}:${startDate}:${endDate}`;

  // Check client memory cache (valid for 30 seconds)
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Deduplicate in-flight promises
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    const timestamp = Date.now();
    const url = cleanGroupId
      ? `/api/holdings/dashboard/sales/${cleanGroupId}/api/view-sales-report-itemized/filtered?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`
      : `/api/bia/crm/sales-report/sales-by-customer?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`;

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
          // If rate limited, wait and retry
          if (attempts < maxAttempts) {
            console.warn(`[SalesByCustomer] Rate limited (429). Retrying in ${attempts * 1200}ms...`);
            await delay(attempts * 1200);
            continue;
          }
          if (cached?.data) {
            return cached.data;
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const errMsg =
            errJson?.error ||
            `Failed to fetch customer sales performance data (${res.status})`;
          throw new Error(errMsg);
        }

        const data = await res.json();
        let records: SalesReportItemizedRecord[] = [];
        if (Array.isArray(data)) {
          records = data;
        } else if (data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)) {
          records = (data as { data: SalesReportItemizedRecord[] }).data;
        }

        // Save to client cache for 30s
        memoryCache.set(cacheKey, {
          data: records,
          expiresAt: Date.now() + 30_000,
        });

        return records;
      } catch (error) {
        if (attempts >= maxAttempts) {
          if (cached?.data) {
            return cached.data;
          }
          throw error;
        }
        await delay(attempts * 1000);
      }
    }

    return [];
  })();

  inFlightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};
