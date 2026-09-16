import { SlobAging } from "../types";

// In-memory cache for fast display & reduced backend load
const memoryCache = new Map<string, { data: SlobAging[]; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<SlobAging[]>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAgingSlobData(groupId?: string | number): Promise<SlobAging[]> {
  const cleanGroupId = groupId != null ? String(groupId) : "1";
  const cacheKey = `aging-slob:${cleanGroupId}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    const timestamp = Date.now();
    const url = cleanGroupId
      ? `/api/holdings/dashboard/sales/${cleanGroupId}/api/view-slob-aging/all?_t=${timestamp}`
      : `/api/bia/scm/stock-health-monitor/aging-and-slob?_t=${timestamp}`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (res.status === 429) {
          if (attempts < maxAttempts) {
            await delay(attempts * 1000);
            continue;
          }
          if (cached?.data) return cached.data;
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch Aging & SLOB: ${res.statusText}`,
          );
        }

        const raw = await res.json();
        let records: SlobAging[] = [];
        if (Array.isArray(raw)) {
          records = raw;
        } else if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)) {
          records = (raw as { data: SlobAging[] }).data;
        }

        memoryCache.set(cacheKey, {
          data: records,
          expiresAt: Date.now() + 60_000,
        });

        return records;
      } catch (error) {
        if (attempts >= maxAttempts) {
          if (cached?.data) return cached.data;
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
}
