import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  ProductionPlanVsActualJobOrder,
  ProductPlanSummary,
  ProductionPlanVsActualKpis,
  ProductionPlanVsActualResponse,
} from "@/modules/holdings/executive-dashboard/production-plan-vs-actual/types";
import { FALLBACK_PRODUCTION_PLAN_DATA } from "@/modules/holdings/executive-dashboard/production-plan-vs-actual/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedPlanData {
  data: ProductionPlanVsActualResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedPlanData>();
const CACHE_TTL_MS = 30000; // 30s

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
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
      data: Array.isArray(json.data) ? (json.data as T[]) : [],
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
          g.category === "production-plan-vs-actual" ||
          g.category === "plan-vs-actual" ||
          g.category === "production-variance" ||
          g.category === "production_plan_vs_actual" ||
          g.category === "production-output-variance" ||
          g.category === "product-plan-vs-actual" ||
          g.category === "manufacturing-plan-vs-actual"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Production Plan vs Actual Route] fetchDashboardGroups error:", e);
    return null;
  }
}

function calculateVarianceDays(plannedDate?: string | null, actualDate?: string | null): number | null {
  if (!plannedDate || !actualDate) return null;
  const p = new Date(plannedDate.slice(0, 10)).getTime();
  const a = new Date(actualDate.slice(0, 10)).getTime();
  if (isNaN(p) || isNaN(a)) return null;
  return Math.round((a - p) / (1000 * 60 * 60 * 24));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const branchIdFilter = searchParams.get("branchId");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");

    const startDate =
      searchParams.get("startDate")?.trim() || `${currentYear}-01-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `mfg_plan_vs_actual_${groupId}_${startDate}_${endDate}_${branchIdFilter || "all"}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryBaseUrl = (
      (group?.directus as string | undefined) ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://goatedcodoer:8091"
    ).replace(/\/+$/, "");

    const staticToken =
      (group?.directus_token as string | undefined) ||
      process.env.DIRECTUS_STATIC_TOKEN ||
      "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";

    const primaryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staticToken}`,
    };

    // 1. Fetch company_list to find the manufacturing directus instance
    let mfgDirectusUrl = "http://100.66.3.70:8074";
    let mfgToken = "test";

    const companiesRes = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,directus,directus_token`,
      primaryHeaders,
      5000
    );

    if (companiesRes.ok && companiesRes.data.length > 0) {
      const mfgCompany = companiesRes.data.find(
        (c) =>
          String(c.company_name || "").toLowerCase().includes("manufacturing") ||
          Number(c.company_id) === 6
      );
      if (mfgCompany && mfgCompany.directus) {
        mfgDirectusUrl = String(mfgCompany.directus).replace(/\/+$/, "");
        if (mfgCompany.directus_token) {
          mfgToken = String(mfgCompany.directus_token);
        }
      }
    }

    const mfgHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mfgToken}`,
    };

    // 2. Fetch Job Orders from manufacturing directus
    const joFields = [
      "job_order_id",
      "job_order_no",
      "product_id.product_id",
      "product_id.product_name",
      "product_id.product_code",
      "product_id.unit_of_measurement",
      "branch_id.id",
      "branch_id.branch_name",
      "target_quantity",
      "completed_quantity",
      "rejected_quantity",
      "status",
      "start_date",
      "end_date",
      "production_completed_at",
    ].join(",");

    let joRes = await fetchDirectusWithTimeout<AnyRec>(
      `${mfgDirectusUrl}/items/manufacturing_job_orders?limit=-1&fields=${joFields}&sort=-job_order_id`,
      mfgHeaders,
      5000
    );

    // If mfg directus returned no rows or failed, attempt primary group directus
    if (!joRes.ok || joRes.data.length === 0) {
      const altRes = await fetchDirectusWithTimeout<AnyRec>(
        `${primaryBaseUrl}/items/manufacturing_job_orders?limit=-1&fields=${joFields}&sort=-job_order_id`,
        primaryHeaders,
        5000
      );
      if (altRes.ok && altRes.data.length > 0) {
        joRes = altRes;
      }
    }

    if (!joRes.ok || joRes.data.length === 0) {
      console.warn("[Production Plan vs Actual] No job orders found, returning fallback data");
      return NextResponse.json(FALLBACK_PRODUCTION_PLAN_DATA);
    }

    // 3. Process and map Job Orders
    const jobOrders: ProductionPlanVsActualJobOrder[] = [];
    const productMap = new Map<number, ProductPlanSummary>();

    let totalPlanned = 0;
    let totalActualGood = 0;
    let totalRejected = 0;
    let completedJobsCount = 0;
    let inProductionJobsCount = 0;
    let onTimeJobsCount = 0;

    for (const jo of joRes.data) {
      const jobOrderId = Number(jo.job_order_id || 0);
      const jobOrderNo = String(jo.job_order_no || `JO-${jobOrderId}`);

      const prodObj = (jo.product_id as AnyRec) || null;
      const productId = Number(prodObj?.product_id || jo.product_id || 0);
      const productName = String(prodObj?.product_name || "Industrial Production Item");
      const productCode = String(prodObj?.product_code || `PRD-${productId}`);
      const uom = String(prodObj?.unit_of_measurement || "Units");

      const branchObj = (jo.branch_id as AnyRec) || null;
      const branchId = branchObj?.id ? Number(branchObj.id) : (jo.branch_id ? Number(jo.branch_id) : null);
      const branchName = String(branchObj?.branch_name || "Main Production Facility");

      if (branchIdFilter && branchIdFilter !== "all" && String(branchId) !== branchIdFilter) {
        continue;
      }

      const status = String(jo.status || "DRAFT").toUpperCase();
      const plannedQuantity = Number(jo.target_quantity || 0);
      const actualGoodQuantity = Number(jo.completed_quantity || 0);
      const rejectedQuantity = Number(jo.rejected_quantity || 0);
      const quantityVariance = actualGoodQuantity - plannedQuantity;
      const quantityVariancePercent = plannedQuantity > 0
        ? Math.round(((actualGoodQuantity - plannedQuantity) / plannedQuantity) * 1000) / 10
        : 0;
      const fulfillmentRate = plannedQuantity > 0
        ? Math.round((actualGoodQuantity / plannedQuantity) * 1000) / 10
        : 0;

      const plannedCompletionDate = jo.end_date ? String(jo.end_date).slice(0, 10) : null;
      const actualCompletionDate = jo.production_completed_at ? String(jo.production_completed_at).slice(0, 10) : null;
      const completionVarianceDays = calculateVarianceDays(plannedCompletionDate, actualCompletionDate);

      if (status.includes("COMPLETE") || status === "CLOSED") {
        completedJobsCount++;
        if (completionVarianceDays !== null && completionVarianceDays <= 0) {
          onTimeJobsCount++;
        }
      } else if (status.includes("PROD") || status.includes("PROGRESS")) {
        inProductionJobsCount++;
      }

      totalPlanned += plannedQuantity;
      totalActualGood += actualGoodQuantity;
      totalRejected += rejectedQuantity;

      jobOrders.push({
        jobOrderId,
        jobOrderNo,
        productId,
        productName,
        productCode,
        uom,
        branchId,
        branchName,
        status,
        plannedQuantity,
        actualGoodQuantity,
        rejectedQuantity,
        quantityVariance,
        quantityVariancePercent,
        fulfillmentRate,
        plannedCompletionDate,
        actualCompletionDate,
        completionVarianceDays,
      });

      // Product grouping
      const curProduct = productMap.get(productId) || {
        productId,
        productName,
        productCode,
        uom,
        jobOrdersCount: 0,
        plannedQuantity: 0,
        actualGoodQuantity: 0,
        rejectedQuantity: 0,
        quantityVariance: 0,
        fulfillmentRate: 0,
      };

      curProduct.jobOrdersCount++;
      curProduct.plannedQuantity += plannedQuantity;
      curProduct.actualGoodQuantity += actualGoodQuantity;
      curProduct.rejectedQuantity += rejectedQuantity;
      curProduct.quantityVariance += quantityVariance;
      curProduct.fulfillmentRate = curProduct.plannedQuantity > 0
        ? Math.round((curProduct.actualGoodQuantity / curProduct.plannedQuantity) * 1000) / 10
        : 0;

      productMap.set(productId, curProduct);
    }

    if (jobOrders.length === 0) {
      return NextResponse.json(FALLBACK_PRODUCTION_PLAN_DATA);
    }

    const productSummaries = Array.from(productMap.values()).sort(
      (a, b) => b.plannedQuantity - a.plannedQuantity
    );

    const overallFulfillmentRate = totalPlanned > 0
      ? Math.round((totalActualGood / totalPlanned) * 1000) / 10
      : 100;

    const totalOutput = totalActualGood + totalRejected;
    const scrapRate = totalOutput > 0
      ? Math.round((totalRejected / totalOutput) * 1000) / 10
      : 0;

    const onTimeCompletionRate = completedJobsCount > 0
      ? Math.round((onTimeJobsCount / completedJobsCount) * 1000) / 10
      : 100;

    const topProduct = productSummaries[0];

    const kpis: ProductionPlanVsActualKpis = {
      totalJobOrders: jobOrders.length,
      completedJobsCount,
      inProductionJobsCount,
      totalPlannedQuantity: totalPlanned,
      totalActualGoodQuantity: totalActualGood,
      totalRejectedQuantity: totalRejected,
      netQuantityVariance: totalActualGood - totalPlanned,
      overallFulfillmentRate,
      scrapRate,
      onTimeCompletionRate,
      topProductByVolume: topProduct ? topProduct.productName : "Standard Line",
      topProductFulfillmentRate: topProduct ? topProduct.fulfillmentRate : 100,
    };

    const responsePayload: ProductionPlanVsActualResponse = {
      kpis,
      jobOrders,
      productSummaries,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    memoryCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[Production Plan vs Actual Route] Unexpected error:", error);
    return NextResponse.json(FALLBACK_PRODUCTION_PLAN_DATA);
  }
}

