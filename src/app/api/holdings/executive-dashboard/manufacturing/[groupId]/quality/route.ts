import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  QualityRejectRateResponse,
  ProductQualitySummary,
  BatchQualityInspection,
  DefectCategoryBreakdown,
  QualityRejectRateKpis,
  QualityDisposition,
  DefectCategory,
} from "@/modules/holdings/executive-dashboard/quality-reject-rate/types";
import { FALLBACK_QUALITY_REJECT_DATA } from "@/modules/holdings/executive-dashboard/quality-reject-rate/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedQualityData {
  data: QualityRejectRateResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedQualityData>();
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
          g.category === "quality-reject-rate" ||
          g.category === "quality_reject_rate" ||
          g.category === "quality" ||
          g.category === "reject-rate" ||
          g.category === "reject_rate" ||
          g.category === "quality-rate" ||
          g.category === "manufacturing-quality" ||
          g.category === "qa-reject-rate" ||
          g.category === "qa-rate"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Quality Reject Rate Route] fetchDashboardGroups error:", e);
    return null;
  }
}

function normalizeDefectCategory(remarks?: string): { category: DefectCategory; label: string } {
  const s = (remarks || "").toUpperCase();
  if (s.includes("SEAL") || s.includes("CAP") || s.includes("LEAK") || s.includes("POUCH")) {
    return { category: "PACKAGING_SEAL", label: "Packaging & Seal Defects" };
  }
  if (s.includes("MOISTURE") || s.includes("WATER") || s.includes("DRY") || s.includes("WET")) {
    return { category: "MOISTURE_EXCURSION", label: "Moisture Content Out of Spec" };
  }
  if (s.includes("ACID") || s.includes("PH") || s.includes("PEROXIDE") || s.includes("CHEMICAL")) {
    return { category: "CHEMICAL_ACIDITY", label: "Chemical / Acidity Parameters" };
  }
  if (s.includes("LABEL") || s.includes("BARCODE") || s.includes("CODE") || s.includes("PRINT") || s.includes("SMUDGE")) {
    return { category: "LABEL_COMPLIANCE", label: "Label & Coding Compliance" };
  }
  if (s.includes("FOREIGN") || s.includes("DIRT") || s.includes("PARTICLE") || s.includes("SCREEN")) {
    return { category: "FOREIGN_PARTICLE", label: "Foreign Matter & Sieve Residue" };
  }
  return { category: "PHYSICAL_SENSORY", label: "Sensory & Color Deviations" };
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
    const categoryFilter = searchParams.get("category");
    const dispositionFilter = searchParams.get("disposition");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");

    const startDate =
      searchParams.get("startDate")?.trim() || `${currentYear}-01-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `mfg_quality_${groupId}_${startDate}_${endDate}_${categoryFilter || "all"}_${dispositionFilter || "all"}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryBaseUrl = (
      (group?.directus as string | undefined) ||
      process.env.MANUFACTURING_DIRECTUS_URL ||
      "http://100.66.3.70:8074"
    ).replace(/\/$/, "");

    const token =
      (group?.directus_token as string | undefined) ||
      process.env.MANUFACTURING_DIRECTUS_TOKEN ||
      "test";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const hostVariants = [
      primaryBaseUrl,
      "http://100.66.3.70:8074",
      "http://vtc:8074",
      "http://127.0.0.1:8074",
    ];

    let finalQaRecords: AnyRec[] = [];
    let jobOrderRecords: AnyRec[] = [];
    let productRecords: AnyRec[] = [];

    for (const host of hostVariants) {
      try {
        const [qaRes, joRes, prodRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/manufacturing_final_qa_releases?limit=200&sort=-approved_at`,
            headers,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/manufacturing_job_orders?limit=200`,
            headers,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/products?limit=200&fields=product_id,product_name,product_code`,
            headers,
            3000
          ),
        ]);

        if (qaRes.ok && qaRes.data.length > 0) {
          finalQaRecords = qaRes.data;
          jobOrderRecords = joRes.data;
          productRecords = prodRes.data;
          break;
        } else if (prodRes.ok && prodRes.data.length > 0 && productRecords.length === 0) {
          jobOrderRecords = joRes.data;
          productRecords = prodRes.data;
        }
      } catch {
        // continue
      }
    }

    // If no QA records exist in directus, return realistic fallback
    if (finalQaRecords.length === 0) {
      const products = FALLBACK_QUALITY_REJECT_DATA.products;
      let inspections = FALLBACK_QUALITY_REJECT_DATA.inspections;

      if (categoryFilter) {
        inspections = inspections.filter((i) => i.defectCategory === categoryFilter);
      }
      if (dispositionFilter) {
        inspections = inspections.filter((i) => i.disposition === dispositionFilter);
      }

      const responseData: QualityRejectRateResponse = {
        ...FALLBACK_QUALITY_REJECT_DATA,
        products,
        inspections,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        isFallback: true,
      };

      memoryCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      return NextResponse.json(responseData);
    }

    // Process live QA data
    const joMap = new Map<number, AnyRec>();
    for (const jo of jobOrderRecords) {
      const id = Number(jo.id || jo.job_order_id || 0);
      if (id > 0) joMap.set(id, jo);
    }

    const prodMap = new Map<number, AnyRec>();
    for (const p of productRecords) {
      const id = Number(p.product_id || p.id || 0);
      if (id > 0) prodMap.set(id, p);
    }

    const inspections: BatchQualityInspection[] = [];
    const productAggMap = new Map<
      number,
      {
        name: string;
        code: string;
        inspected: number;
        passed: number;
        rejected: number;
        defects: Map<string, number>;
      }
    >();

    const defectAggMap = new Map<
      DefectCategory,
      { label: string; count: number; units: number }
    >();

    let totalInspected = 0;
    let totalRejected = 0;
    let quarantinedCount = 0;

    finalQaRecords.forEach((qa, idx) => {
      const id = Number(qa.final_release_id || qa.id || idx + 1);
      const jobOrderId = Number(qa.job_order_id || 101);
      const jo = joMap.get(jobOrderId);
      const productId = Number(jo?.product_id || 25812);
      const prod = prodMap.get(productId);

      const productName = (prod?.product_name as string) || `Product #${productId}`;
      const productCode = (prod?.product_code as string) || `PRD-${productId}`;
      const jobOrderNo = (jo?.job_order_no as string) || `JO-2026-${String(jobOrderId).padStart(4, "0")}`;
      const lotNumber = (qa.coa_reference_no as string) ? `LOT-${id}` : `LOT-QA-${id}`;
      const coaReferenceNo = (qa.coa_reference_no as string) || `COA-2026-QA-${id}`;

      const inspectedQuantity = Number(qa.inspected_quantity || 1000);
      const rejectedQuantity = Number(qa.defect_quantity || 0);
      const passedQuantity = Math.max(0, inspectedQuantity - rejectedQuantity);
      const rejectRate = inspectedQuantity > 0 ? Number(((rejectedQuantity / inspectedQuantity) * 100).toFixed(2)) : 0;

      const rawDisp = (qa.overall_disposition as string || "APPROVED").toUpperCase();
      let disposition: QualityDisposition = "APPROVED";
      if (rawDisp.includes("REJECT")) disposition = "REJECTED";
      else if (rawDisp.includes("CONDITIONAL")) disposition = "CONDITIONAL_RELEASE";
      else if (rawDisp.includes("QUARANTINE") || rawDisp.includes("HOLD") || rawDisp.includes("PENDING")) {
        disposition = "UNDER_QUARANTINE";
        quarantinedCount++;
      }

      const { category, label } = normalizeDefectCategory(qa.remarks as string);
      const defectDescription = (qa.remarks as string) || "General QA disposition evaluation";

      totalInspected += inspectedQuantity;
      totalRejected += rejectedQuantity;

      inspections.push({
        id,
        jobOrderId,
        jobOrderNo,
        productId,
        productName,
        productCode,
        lotNumber,
        coaReferenceNo,
        inspectedQuantity,
        passedQuantity,
        rejectedQuantity,
        rejectRate,
        uom: productCode.includes("BOX") ? "BOX" : productCode.includes("CSE") ? "CASE" : "PCS",
        disposition,
        defectCategory: category,
        defectDescription,
        inspectorName: "Quality Assurance Unit",
        inspectedAt: (qa.approved_at as string) || new Date().toISOString(),
        labParameters: {
          packagingSealPassed: Boolean(qa.packaging_seal_passed ?? true),
          labelCompliancePassed: Boolean(qa.label_compliance_passed ?? true),
          microbiologicalStatus: (qa.microbiological_status as "PASSED" | "PENDING" | "FAILED") || "PASSED",
        },
      });

      // Product Aggregation
      if (!productAggMap.has(productId)) {
        productAggMap.set(productId, {
          name: productName,
          code: productCode,
          inspected: 0,
          passed: 0,
          rejected: 0,
          defects: new Map<string, number>(),
        });
      }
      const pa = productAggMap.get(productId)!;
      pa.inspected += inspectedQuantity;
      pa.passed += passedQuantity;
      pa.rejected += rejectedQuantity;
      pa.defects.set(defectDescription, (pa.defects.get(defectDescription) || 0) + 1);

      // Defect Category Aggregation
      if (!defectAggMap.has(category)) {
        defectAggMap.set(category, { label, count: 0, units: 0 });
      }
      const da = defectAggMap.get(category)!;
      da.count += 1;
      da.units += rejectedQuantity;
    });

    const products: ProductQualitySummary[] = Array.from(productAggMap.entries()).map(
      ([productId, data]) => {
        const rate = data.inspected > 0 ? Number(((data.rejected / data.inspected) * 100).toFixed(2)) : 0;
        const pass = Number((100 - rate).toFixed(2));

        let topDefect = "General Specification Variance";
        let maxCnt = 0;
        data.defects.forEach((cnt, d) => {
          if (cnt > maxCnt) {
            maxCnt = cnt;
            topDefect = d;
          }
        });

        let status: "EXCELLENT" | "ACCEPTABLE" | "HIGH_RISK" | "CRITICAL" = "EXCELLENT";
        if (rate > 3.0) status = "CRITICAL";
        else if (rate > 2.0) status = "HIGH_RISK";
        else if (rate > 1.0) status = "ACCEPTABLE";

        return {
          productId,
          productName: data.name,
          productCode: data.code,
          totalInspectedUnits: data.inspected,
          totalPassedUnits: data.passed,
          totalRejectedUnits: data.rejected,
          rejectRate: rate,
          passRate: pass,
          primaryDefect: topDefect,
          status,
        };
      }
    ).sort((a, b) => b.rejectRate - a.rejectRate);

    const defectCategories: DefectCategoryBreakdown[] = Array.from(defectAggMap.entries()).map(
      ([cat, data]) => ({
        category: cat,
        label: data.label,
        incidentCount: data.count,
        rejectedUnits: data.units,
        percentageOfTotalRejects: totalRejected > 0 ? Number(((data.units / totalRejected) * 100).toFixed(1)) : 0,
      })
    ).sort((a, b) => b.rejectedUnits - a.rejectedUnits);

    const overallRejectRate = totalInspected > 0 ? Number(((totalRejected / totalInspected) * 100).toFixed(2)) : 0;
    const overallPassRate = Number((100 - overallRejectRate).toFixed(2));
    const toleranceTarget = 2.0;

    const topProduct = products[0];
    const topDefect = defectCategories[0];

    const kpis: QualityRejectRateKpis = {
      overallPassRate,
      overallRejectRate,
      toleranceTarget,
      isWithinTolerance: overallRejectRate <= toleranceTarget,
      totalInspectedUnits: totalInspected,
      totalRejectedUnits: totalRejected,
      totalBatchesInspected: inspections.length,
      batchesQuarantined: quarantinedCount,
      topRejectSku: topProduct?.productName || "None",
      topRejectSkuRate: topProduct?.rejectRate || 0,
      primaryDefectReason: topDefect?.label || "General Parameter Deviation",
    };

    const responseData: QualityRejectRateResponse = {
      kpis,
      products,
      inspections,
      defectCategories,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    memoryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Quality Reject Rate Route] Handler failed:", error);
    return NextResponse.json(FALLBACK_QUALITY_REJECT_DATA, { status: 200 });
  }
}

