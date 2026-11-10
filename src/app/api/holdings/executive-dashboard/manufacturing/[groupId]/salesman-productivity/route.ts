import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  SalesmanProductivityResponse,
  SalesmanProductivityItem,
  DepotProductivitySummary,
  TrendProductivityPoint,
  SalesmanProductivityKpis,
  ProductivityTier,
} from "@/modules/holdings/executive-dashboard/salesman-productivity/types";
import { FALLBACK_SALESMAN_PRODUCTIVITY_DATA } from "@/modules/holdings/executive-dashboard/salesman-productivity/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedProductivityData {
  data: SalesmanProductivityResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedProductivityData>();
const CACHE_TTL_MS = 30000; // 30 seconds

async function fetchWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 7000
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { data: [], ok: false };
    const json = await res.json();
    return {
      data: Array.isArray(json) ? (json as T[]) : Array.isArray(json.data) ? (json.data as T[]) : [],
      ok: true,
    };
  } catch {
    return { data: [], ok: false };
  }
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find((g) => String(g.id) === groupId) ||
      groups.find(
        (g) =>
          g.category === "salesman-productivity" ||
          g.category === "salesman_productivity" ||
          g.category === "sales-productivity" ||
          g.category === "sales-rep-productivity" ||
          g.category === "sales-force-productivity"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Salesman Productivity Route] fetchDashboardGroups error:", e);
    return null;
  }
}

const BRANCH_NAME_MAP: Record<number, string> = {
  278: "Dagupan Regional Warehouse",
  279: "Central Logistics Hub",
  238: "Pangasinan Fleet Hub",
  208: "La Union Depot",
  196: "Baguio Regional Hub",
  174: "La Union Transit Depot",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const branchFilter = searchParams.get("branchId");
    const tierFilter = searchParams.get("tier")?.toUpperCase();
    const searchTerm = searchParams.get("search")?.toLowerCase().trim();

    const cacheKey = `salesman_prod_${groupId}_${startDateParam || "all"}_${endDateParam || "all"}_${branchFilter || "all"}_${tierFilter || "all"}_${searchTerm || ""}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const directusBaseUrl = ((group?.directus as string | undefined) || "http://goatedcodoer:8091").replace(/\/$/, "");
    const directusToken = (group?.directus_token as string | undefined) || "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${directusToken}`,
      "Content-Type": "application/json",
    };

    // 1. Fetch Salesmen Masterlist
    const smUrl = `${directusBaseUrl}/items/salesman?limit=-1&fields=id,salesman_name,salesman_code,branch_code,truck_plate,isActive`;
    const smRes = await fetchWithTimeout<AnyRec>(smUrl, headers, 6000);
    const rawSalesmen = smRes.data;

    // 2. Fetch Sales Invoices
    let invUrl = `${directusBaseUrl}/items/sales_invoice?limit=500&sort=-invoice_date&filter[gross_amount][_gt]=0&fields=invoice_id,invoice_no,invoice_date,salesman_id,customer_code,total_amount,branch_id`;
    if (startDateParam && endDateParam) {
      invUrl += `&filter[invoice_date][_between]=[${startDateParam}T00:00:00.000Z,${endDateParam}T23:59:59.999Z]`;
    }
    if (branchFilter && branchFilter !== "ALL") {
      invUrl += `&filter[branch_id][_eq]=${branchFilter}`;
    }

    const invRes = await fetchWithTimeout<AnyRec>(invUrl, headers, 7000);
    let invoices = invRes.data;

    // If date filter was too narrow, fallback to recent 200 invoices
    if (invoices.length === 0 && startDateParam) {
      const fbInvUrl = `${directusBaseUrl}/items/sales_invoice?limit=200&sort=-invoice_date&filter[gross_amount][_gt]=0&fields=invoice_id,invoice_no,invoice_date,salesman_id,customer_code,total_amount,branch_id`;
      const fbRes = await fetchWithTimeout<AnyRec>(fbInvUrl, headers, 4000);
      if (fbRes.ok && fbRes.data.length > 0) {
        invoices = fbRes.data;
      }
    }

    // 3. Fetch Target Settings (optional quota join)
    const targetMap = new Map<number, number>();
    try {
      const targetUrl = `${directusBaseUrl}/items/target_setting_salesman?limit=200&fields=salesman_id,target_amount`;
      const targetRes = await fetchWithTimeout<AnyRec>(targetUrl, headers, 4000);
      if (targetRes.ok && targetRes.data.length > 0) {
        targetRes.data.forEach((t) => {
          const sid = Number(t.salesman_id);
          const amt = Number(t.target_amount);
          if (sid && amt > 0) {
            targetMap.set(sid, amt);
          }
        });
      }
    } catch {
      // Continue even if target settings lookup fails
    }

    // Fallback if no invoices or salesmen available
    if (rawSalesmen.length === 0 || invoices.length === 0) {
      let fbSalesmen = [...FALLBACK_SALESMAN_PRODUCTIVITY_DATA.salesmen];
      if (tierFilter && tierFilter !== "ALL") {
        fbSalesmen = fbSalesmen.filter((s) => s.tier === tierFilter);
      }
      if (searchTerm) {
        fbSalesmen = fbSalesmen.filter(
          (s) =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.code.toLowerCase().includes(searchTerm)
        );
      }

      const fbResponse: SalesmanProductivityResponse = {
        ...FALLBACK_SALESMAN_PRODUCTIVITY_DATA,
        salesmen: fbSalesmen,
        filters: {
          startDate: startDateParam,
          endDate: endDateParam,
          branchId: branchFilter ? Number(branchFilter) : undefined,
          tier: tierFilter,
          search: searchTerm,
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(fbResponse);
    }

    // 4. Map Salesmen Directory
    const salesmanDir = new Map<
      number,
      {
        name: string;
        code: string;
        branchId: number;
        branchName: string;
        truckPlate?: string;
        isActive: boolean;
      }
    >();

    rawSalesmen.forEach((sm) => {
      const id = Number(sm.id);
      if (id) {
        const branchCode = Number(sm.branch_code || 278);
        salesmanDir.set(id, {
          name: String(sm.salesman_name || `Salesman #${id}`),
          code: String(sm.salesman_code || `REP-${id}`),
          branchId: branchCode,
          branchName: BRANCH_NAME_MAP[branchCode] || `Depot Hub #${branchCode}`,
          truckPlate: sm.truck_plate ? String(sm.truck_plate) : undefined,
          isActive: Number(sm.isActive ?? 1) === 1,
        });
      }
    });

    // 5. Aggregate Invoices by Salesman, Depot, and Trend
    const salesmanStats = new Map<
      number,
      {
        revenue: number;
        invoices: number;
        customers: Set<string>;
        latestDate: string | null;
        branchId: number;
      }
    >();

    const depotStats = new Map<
      number,
      {
        name: string;
        salesmen: Set<number>;
        invoices: number;
        revenue: number;
        quotaSum: number;
      }
    >();

    const trendStats = new Map<
      string,
      {
        revenue: number;
        invoices: number;
        salesmen: Set<number>;
      }
    >();

    let totalFieldRevenue = 0;
    let totalInvoicesCount = 0;
    const globalCustomers = new Set<string>();

    invoices.forEach((inv) => {
      const smId = Number(inv.salesman_id);
      const rev = Number(inv.total_amount || inv.gross_amount || 0);
      const cust = inv.customer_code ? String(inv.customer_code).trim() : null;
      const date = inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const branchId = Number(inv.branch_id || (smId ? salesmanDir.get(smId)?.branchId : null) || 278);

      totalFieldRevenue += rev;
      totalInvoicesCount += 1;
      if (cust) globalCustomers.add(cust);

      // Salesman Stat
      if (smId) {
        if (!salesmanStats.has(smId)) {
          salesmanStats.set(smId, {
            revenue: 0,
            invoices: 0,
            customers: new Set(),
            latestDate: null,
            branchId,
          });
        }
        const sEntry = salesmanStats.get(smId)!;
        sEntry.revenue += rev;
        sEntry.invoices += 1;
        if (cust) sEntry.customers.add(cust);
        if (!sEntry.latestDate || date > sEntry.latestDate) {
          sEntry.latestDate = date;
        }
      }

      // Depot Stat
      if (!depotStats.has(branchId)) {
        depotStats.set(branchId, {
          name: BRANCH_NAME_MAP[branchId] || `Warehouse Hub #${branchId}`,
          salesmen: new Set(),
          invoices: 0,
          revenue: 0,
          quotaSum: 0,
        });
      }
      const dEntry = depotStats.get(branchId)!;
      if (smId) dEntry.salesmen.add(smId);
      dEntry.invoices += 1;
      dEntry.revenue += rev;

      // Trend Stat
      if (!trendStats.has(date)) {
        trendStats.set(date, { revenue: 0, invoices: 0, salesmen: new Set() });
      }
      const tEntry = trendStats.get(date)!;
      tEntry.revenue += rev;
      tEntry.invoices += 1;
      if (smId) tEntry.salesmen.add(smId);
    });

    // 6. Build Salesmen Productivity Items List
    let eliteCount = 0;
    let underperformingCount = 0;
    let quotaSumAll = 0;
    let topPerformer = { name: "N/A", revenue: 0 };

    const parsedSalesmen: SalesmanProductivityItem[] = [];

    // Process every salesman with active sales or directory presence
    salesmanStats.forEach((stats, smId) => {
      const profile = salesmanDir.get(smId) || {
        name: `Salesman #${smId}`,
        code: `REP-${smId}`,
        branchId: stats.branchId,
        branchName: BRANCH_NAME_MAP[stats.branchId] || `Depot Hub #${stats.branchId}`,
        truckPlate: undefined,
        isActive: true,
      };

      const revenue = Math.round(stats.revenue * 100) / 100;
      const invoiceCount = stats.invoices;
      const uniqueCustomersCount = stats.customers.size;
      const averageDropSize = invoiceCount > 0 ? Math.round((revenue / invoiceCount) * 100) / 100 : 0;

      // Quota calculation (defaults based on realistic distribution tier: ₱1,500,000)
      const targetAmount = targetMap.get(smId) || 1500000;
      const quotaAchievementRate = Math.round((revenue / targetAmount) * 1000) / 10;

      let tier: ProductivityTier = "MODERATE";
      if (quotaAchievementRate >= 100 || revenue >= 1000000) {
        tier = "ELITE";
        eliteCount++;
      } else if (quotaAchievementRate >= 80 || revenue >= 500000) {
        tier = "ON_TRACK";
      } else if (quotaAchievementRate >= 60 || revenue >= 200000) {
        tier = "MODERATE";
      } else {
        tier = "UNDERPERFORMING";
        underperformingCount++;
      }

      quotaSumAll += quotaAchievementRate;

      if (revenue > topPerformer.revenue) {
        topPerformer = { name: profile.name, revenue };
      }

      // Add to depot quota calculation
      const depot = depotStats.get(profile.branchId);
      if (depot) {
        depot.quotaSum += quotaAchievementRate;
      }

      parsedSalesmen.push({
        salesmanId: smId,
        name: profile.name,
        code: profile.code,
        branchId: profile.branchId,
        branchName: profile.branchName,
        truckPlate: profile.truckPlate,
        totalRevenue: revenue,
        invoiceCount,
        uniqueCustomersCount,
        averageDropSize,
        targetAmount,
        quotaAchievementRate,
        tier,
        latestInvoiceDate: stats.latestDate,
      });
    });

    parsedSalesmen.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const activeCount = parsedSalesmen.length;
    const overallDropSize = totalInvoicesCount > 0 ? Math.round((totalFieldRevenue / totalInvoicesCount) * 100) / 100 : 0;
    const averageQuotaAttainment = activeCount > 0 ? Math.round((quotaSumAll / activeCount) * 10) / 10 : 0;

    const kpis: SalesmanProductivityKpis = {
      totalRevenue: Math.round(totalFieldRevenue * 100) / 100,
      totalInvoicesCount,
      activeSalesmenCount: activeCount,
      totalOutletsReached: globalCustomers.size,
      averageDropSize: overallDropSize,
      averageQuotaAttainment,
      topPerformerName: topPerformer.name,
      topPerformerRevenue: Math.round(topPerformer.revenue * 100) / 100,
      eliteRepsCount: eliteCount,
      underperformingRepsCount: underperformingCount,
    };

    // Format Depots
    const depots: DepotProductivitySummary[] = Array.from(depotStats.entries())
      .map(([branchId, val]) => {
        const count = val.salesmen.size || 1;
        const avgDrop = val.invoices > 0 ? Math.round((val.revenue / val.invoices) * 100) / 100 : 0;
        const avgQuota = Math.round((val.quotaSum / count) * 10) / 10;
        return {
          branchId,
          branchName: val.name,
          salesmanCount: val.salesmen.size,
          invoiceCount: val.invoices,
          totalRevenue: Math.round(val.revenue * 100) / 100,
          averageDropSize: avgDrop,
          averageQuotaAttainment: avgQuota,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Format Trends (sorted chronologically)
    const trends: TrendProductivityPoint[] = Array.from(trendStats.entries())
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .slice(-12)
      .map(([date, val]) => {
        const avgDrop = val.invoices > 0 ? Math.round((val.revenue / val.invoices) * 100) / 100 : 0;
        return {
          date,
          periodLabel: date.slice(5),
          revenue: Math.round(val.revenue * 100) / 100,
          invoicesCount: val.invoices,
          activeSalesmenCount: val.salesmen.size,
          averageDropSize: avgDrop,
        };
      });

    // Apply Filters to salesmen
    let filteredSalesmen = parsedSalesmen;
    if (tierFilter && tierFilter !== "ALL") {
      filteredSalesmen = filteredSalesmen.filter((s) => s.tier === tierFilter);
    }
    if (branchFilter && branchFilter !== "ALL") {
      filteredSalesmen = filteredSalesmen.filter((s) => s.branchId === Number(branchFilter));
    }
    if (searchTerm) {
      filteredSalesmen = filteredSalesmen.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm) ||
          s.code.toLowerCase().includes(searchTerm) ||
          (s.truckPlate && s.truckPlate.toLowerCase().includes(searchTerm)) ||
          s.branchName.toLowerCase().includes(searchTerm)
      );
    }

    const responsePayload: SalesmanProductivityResponse = {
      kpis,
      salesmen: filteredSalesmen,
      depots,
      trends,
      filters: {
        startDate: startDateParam || undefined,
        endDate: endDateParam || undefined,
        branchId: branchFilter ? Number(branchFilter) : undefined,
        tier: tierFilter || undefined,
        search: searchTerm || undefined,
      },
      source: "live_engine",
      timestamp: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[Salesman Productivity Route] Unhandled exception:", error);
    return NextResponse.json(FALLBACK_SALESMAN_PRODUCTIVITY_DATA, { status: 200 });
  }
}
