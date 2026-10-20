import {
  LostCustomerFilters,
  LostCustomerRecord,
  LostCustomerReportData,
  LostCustomerKpis,
  TaggingDistributionItem,
  InactivityRangeDistribution,
} from "../types";

function toNumber(val: unknown): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/,/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function normalizeLostCustomerRecord(
  raw: Record<string, unknown>,
  index: number
): LostCustomerRecord {
  const customerCode =
    toString(raw.customerCode) ||
    toString(raw.customer_code) ||
    toString(raw.code) ||
    `CUST-${index + 1}`;

  const customerName =
    toString(raw.customerName) ||
    toString(raw.customer_name) ||
    toString(raw.name) ||
    "Unknown Customer";

  const tagging =
    toString(raw.tagging) ||
    toString(raw.customerTagging) ||
    toString(raw.customer_tagging) ||
    toString(raw.tag) ||
    "Unassigned";

  const minDaysNoSales =
    toNumber(raw.minDaysNoSales) ||
    toNumber(raw.daysNoSales) ||
    toNumber(raw.days_no_sales) ||
    toNumber(raw.daysInactive) ||
    toNumber(raw.days_inactive) ||
    toNumber(raw.daysSinceLastOrder) ||
    toNumber(raw.days_since_last_order) ||
    0;

  const lastSalesDate =
    toString(raw.lastSalesDate) ||
    toString(raw.last_sales_date) ||
    toString(raw.lastOrderDate) ||
    toString(raw.last_order_date) ||
    toString(raw.date) ||
    null;

  const totalHistoricalSales =
    toNumber(raw.totalHistoricalSales) ||
    toNumber(raw.total_historical_sales) ||
    toNumber(raw.historicalSales) ||
    toNumber(raw.historical_sales) ||
    toNumber(raw.totalSales) ||
    toNumber(raw.total_sales) ||
    toNumber(raw.sales) ||
    toNumber(raw.totalRevenue) ||
    toNumber(raw.total_revenue) ||
    toNumber(raw.revenue) ||
    toNumber(raw.netSales) ||
    toNumber(raw.net_sales) ||
    toNumber(raw.grossSales) ||
    toNumber(raw.gross_sales) ||
    toNumber(raw.salesAmount) ||
    toNumber(raw.sales_amount) ||
    toNumber(raw.soAmount) ||
    toNumber(raw.so_amount) ||
    toNumber(raw.totalSoAmount) ||
    toNumber(raw.total_so_amount) ||
    toNumber(raw.siAmount) ||
    toNumber(raw.si_amount) ||
    toNumber(raw.totalSiAmount) ||
    toNumber(raw.total_si_amount) ||
    toNumber(raw.invoiceAmount) ||
    toNumber(raw.invoice_amount) ||
    toNumber(raw.totalInvoiceAmount) ||
    toNumber(raw.total_invoice_amount) ||
    toNumber(raw.orderAmount) ||
    toNumber(raw.order_amount) ||
    toNumber(raw.totalOrderAmount) ||
    toNumber(raw.total_order_amount) ||
    toNumber(raw.purchasedAmount) ||
    toNumber(raw.purchased_amount) ||
    toNumber(raw.totalPurchased) ||
    toNumber(raw.total_purchased) ||
    toNumber(raw.amount) ||
    toNumber(raw.totalAmount) ||
    toNumber(raw.total_amount) ||
    toNumber(raw.totalValue) ||
    toNumber(raw.total_value) ||
    0;

  const salesmanName =
    toString(raw.salesmanName) ||
    toString(raw.salesman_name) ||
    toString(raw.salesman) ||
    null;

  const branchName =
    toString(raw.branchName) ||
    toString(raw.branch_name) ||
    toString(raw.branch) ||
    null;

  const contactNumber =
    toString(raw.contactNumber) ||
    toString(raw.contact_number) ||
    toString(raw.contact) ||
    toString(raw.phone) ||
    null;

  const email = toString(raw.email) || null;

  return {
    id: raw.id !== undefined ? String(raw.id) : `${customerCode}-${index}`,
    customerCode,
    customerName,
    tagging,
    minDaysNoSales,
    lastSalesDate,
    totalHistoricalSales,
    salesmanName,
    branchName,
    contactNumber,
    email,
    raw,
  };
}

const memoryCache = new Map<string, { data: LostCustomerReportData; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<LostCustomerReportData>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchLostCustomerData(
  groupId?: string | number,
  filters?: Partial<LostCustomerFilters>
): Promise<LostCustomerReportData> {
  const cleanGroupId = groupId != null ? String(groupId) : "1";
  const queryTag = filters?.tagging || "all";
  const queryMinDays = filters?.minDaysNoSales || "all";
  const cacheKey = `${cleanGroupId}:${queryTag}:${queryMinDays}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async (): Promise<LostCustomerReportData> => {
    const timestamp = Date.now();
    const query = new URLSearchParams();
    if (filters?.customerCode) query.append("customerCode", filters.customerCode);
    if (filters?.customerName) query.append("customerName", filters.customerName);
    if (filters?.tagging && filters.tagging !== "ALL") query.append("tagging", filters.tagging);
    if (filters?.minDaysNoSales) query.append("minDaysNoSales", filters.minDaysNoSales);
    query.append("_t", String(timestamp));

    const qs = query.toString();
    const url = `/api/holdings/dashboard/sales/${cleanGroupId}/api/view-lost-customer-list${qs ? `?${qs}` : ""}`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 429) {
          if (attempts < maxAttempts) {
            await delay(attempts * 1000);
            continue;
          }
          if (cached?.data) return cached.data;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Failed to fetch lost customers (${res.status})`);
        }

        const json = await res.json();
        let rawList: Record<string, unknown>[] = [];
        if (Array.isArray(json)) {
          rawList = json;
        } else if (json && Array.isArray(json.data)) {
          rawList = json.data;
        } else if (json && Array.isArray(json.items)) {
          rawList = json.items;
        } else if (json && typeof json === "object") {
          rawList = [json];
        }

        const records = rawList.map((item, idx) => normalizeLostCustomerRecord(item, idx));

        // Calculate KPIs
        const totalCustomers = records.length;
        let atRiskCount = 0;
        let dormantCount = 0;
        let lostCount = 0;
        let totalDaysInactive = 0;
        let totalValueAtRisk = 0;

        const tagMap = new Map<string, { count: number; totalSales: number }>();
        const rangeBuckets: Record<string, { count: number; totalSales: number }> = {
          "30-60 Days": { count: 0, totalSales: 0 },
          "61-90 Days": { count: 0, totalSales: 0 },
          "91-180 Days": { count: 0, totalSales: 0 },
          "180+ Days": { count: 0, totalSales: 0 },
        };

        records.forEach((r) => {
          const lowerTag = r.tagging.toLowerCase();
          if (lowerTag.includes("risk")) atRiskCount++;
          else if (lowerTag.includes("dormant")) dormantCount++;
          else if (lowerTag.includes("lost")) lostCount++;

          totalDaysInactive += r.minDaysNoSales;
          totalValueAtRisk += r.totalHistoricalSales;

          // Tagging map
          const t = r.tagging || "Unassigned";
          const currTag = tagMap.get(t) || { count: 0, totalSales: 0 };
          tagMap.set(t, {
            count: currTag.count + 1,
            totalSales: currTag.totalSales + r.totalHistoricalSales,
          });

          // Inactivity range
          if (r.minDaysNoSales >= 180) {
            rangeBuckets["180+ Days"].count++;
            rangeBuckets["180+ Days"].totalSales += r.totalHistoricalSales;
          } else if (r.minDaysNoSales >= 91) {
            rangeBuckets["91-180 Days"].count++;
            rangeBuckets["91-180 Days"].totalSales += r.totalHistoricalSales;
          } else if (r.minDaysNoSales >= 61) {
            rangeBuckets["61-90 Days"].count++;
            rangeBuckets["61-90 Days"].totalSales += r.totalHistoricalSales;
          } else {
            rangeBuckets["30-60 Days"].count++;
            rangeBuckets["30-60 Days"].totalSales += r.totalHistoricalSales;
          }
        });

        const avgDaysInactive = totalCustomers > 0 ? Math.round(totalDaysInactive / totalCustomers) : 0;

        const kpis: LostCustomerKpis = {
          totalCustomers,
          atRiskCount,
          dormantCount,
          lostCount,
          avgDaysInactive,
          totalValueAtRisk,
        };

        const taggingDistribution: TaggingDistributionItem[] = Array.from(tagMap.entries())
          .map(([tag, val]) => ({
            tag,
            count: val.count,
            totalSales: val.totalSales,
            share: totalCustomers > 0 ? (val.count / totalCustomers) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        const inactivityDistribution: InactivityRangeDistribution[] = Object.entries(rangeBuckets).map(
          ([range, val]) => ({
            range,
            count: val.count,
            totalSales: val.totalSales,
          })
        );

        const topAtRiskCustomers = [...records]
          .sort((a, b) => b.totalHistoricalSales - a.totalHistoricalSales)
          .slice(0, 5);

        const reportData: LostCustomerReportData = {
          records,
          kpis,
          taggingDistribution,
          inactivityDistribution,
          topAtRiskCustomers,
        };

        memoryCache.set(cacheKey, {
          data: reportData,
          expiresAt: Date.now() + 30_000,
        });

        return reportData;
      } catch (err) {
        if (attempts >= maxAttempts) {
          if (cached?.data) return cached.data;
          throw err;
        }
        await delay(attempts * 800);
      }
    }

    const emptyData: LostCustomerReportData = {
      records: [],
      kpis: {
        totalCustomers: 0,
        atRiskCount: 0,
        dormantCount: 0,
        lostCount: 0,
        avgDaysInactive: 0,
        totalValueAtRisk: 0,
      },
      taggingDistribution: [],
      inactivityDistribution: [],
      topAtRiskCustomers: [],
    };
    return emptyData;
  })();

  inFlightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
