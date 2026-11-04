import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  FinishedGoodsItem,
  FinishedGoodsCategorySummary,
  FinishedGoodsInventoryKpis,
  FinishedGoodsInventoryResponse,
  FinishedGoodsCategory,
  FinishedGoodsStockStatus,
} from "@/modules/holdings/executive-dashboard/finished-goods-inventory/types";
import { FALLBACK_FINISHED_GOODS_DATA } from "@/modules/holdings/executive-dashboard/finished-goods-inventory/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedInventoryData {
  data: FinishedGoodsInventoryResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedInventoryData>();
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
          g.category === "finished-goods-inventory" ||
          g.category === "finished_goods_inventory" ||
          g.category === "finished-goods" ||
          g.category === "finished_goods" ||
          g.category === "fg-inventory" ||
          g.category === "fg_inventory" ||
          g.category === "fg-stock" ||
          g.category === "finished-product-inventory"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Finished Goods Inventory Route] fetchDashboardGroups error:", e);
    return null;
  }
}

function classifyCategory(name: string, code: string): { category: FinishedGoodsCategory; label: string } {
  const s = `${name} ${code}`.toUpperCase();
  if (s.includes("BIHON") || s.includes("NOODLE") || s.includes("BHN") || s.includes("CANTON")) {
    return { category: "NOODLES_AND_BIHON", label: "Noodles & Bihon" };
  }
  if (s.includes("COCONUT MILK") || s.includes("COCO") || s.includes("MPCM")) {
    return { category: "COCONUT_PRODUCTS", label: "Coconut Products" };
  }
  if (s.includes("MARGARINE") || s.includes("SHORTENING") || s.includes("FAT") || s.includes("SHRT")) {
    return { category: "SPECIALTY_FATS", label: "Specialty Fats & Margarine" };
  }
  if (s.includes("OIL") || s.includes("PALM") || s.includes("CANOLA") || s.includes("SOYA") || s.includes("OL-")) {
    return { category: "COOKING_OILS", label: "Cooking Oils" };
  }
  return { category: "OTHER", label: "Other Finished Goods" };
}

function determineStockStatus(available: number, reorder: number, safety: number): FinishedGoodsStockStatus {
  if (available <= 0) return "OUT_OF_STOCK";
  if (available < reorder || available < safety) return "LOW_STOCK";
  if (available > reorder * 3) return "OVERSTOCKED";
  return "OPTIMAL";
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
    const statusFilter = searchParams.get("status");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");

    const startDate =
      searchParams.get("startDate")?.trim() || `${currentYear}-01-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `mfg_fg_inv_${groupId}_${startDate}_${endDate}_${categoryFilter || "all"}_${statusFilter || "all"}`;
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

    let inventoryRecords: AnyRec[] = [];
    let productRecords: AnyRec[] = [];
    let branchRecords: AnyRec[] = [];

    for (const host of hostVariants) {
      try {
        const [invRes, prodRes, branchRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/inventory?limit=500`,
            headers,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/products?limit=500&fields=product_id,product_name,product_code,barcode,product_category,unit_price,standard_cost`,
            headers,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/branches?limit=50&fields=id,name`,
            headers,
            3000
          ),
        ]);

        if (invRes.ok && invRes.data.length > 0) {
          inventoryRecords = invRes.data;
          productRecords = prodRes.data;
          branchRecords = branchRes.data;
          break;
        } else if (prodRes.ok && prodRes.data.length > 0 && productRecords.length === 0) {
          productRecords = prodRes.data;
          branchRecords = branchRes.data;
        }
      } catch {
        // continue
      }
    }

    // If no live inventory rows in directus table, return realistic fallback
    if (inventoryRecords.length === 0) {
      let items = FALLBACK_FINISHED_GOODS_DATA.items;

      if (categoryFilter) {
        items = items.filter((it) => it.category === categoryFilter);
      }
      if (statusFilter) {
        items = items.filter((it) => it.status === statusFilter);
      }

      const totalValuation = items.reduce((acc, it) => acc + it.totalValuation, 0);
      const totalOnHand = items.reduce((acc, it) => acc + it.onHandQuantity, 0);
      const totalReserved = items.reduce((acc, it) => acc + it.reservedQuantity, 0);
      const totalAvailable = items.reduce((acc, it) => acc + it.availableQuantity, 0);

      const responseData: FinishedGoodsInventoryResponse = {
        ...FALLBACK_FINISHED_GOODS_DATA,
        items,
        kpis: {
          ...FALLBACK_FINISHED_GOODS_DATA.kpis,
          totalInventoryValuation: totalValuation,
          totalOnHandUnits: totalOnHand,
          totalReservedUnits: totalReserved,
          totalAvailableUnits: totalAvailable,
        },
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

    // Build product map
    const prodMap = new Map<number, AnyRec>();
    for (const p of productRecords) {
      const pId = typeof p.product_id === "number" ? p.product_id : typeof p.id === "number" ? p.id : 0;
      if (pId > 0) prodMap.set(pId, p);
    }

    // Build branch map
    const branchMap = new Map<number, string>();
    for (const b of branchRecords) {
      if (typeof b.id === "number") branchMap.set(b.id, (b.name as string) || `Branch #${b.id}`);
    }

    // Aggregate inventory by product
    const itemsMap = new Map<
      number,
      {
        productName: string;
        productCode: string;
        category: FinishedGoodsCategory;
        categoryLabel: string;
        unitValue: number;
        onHand: number;
        reserved: number;
        branchNames: Set<string>;
      }
    >();

    for (const inv of inventoryRecords) {
      const productId = Number(inv.product_id || 0);
      if (!productId) continue;

      const p = prodMap.get(productId);
      const productName = (p?.product_name as string) || (p?.name as string) || `Product #${productId}`;
      const productCode = (p?.product_code as string) || (p?.code as string) || `PRD-${productId}`;
      const { category, label } = classifyCategory(productName, productCode);

      const qty = Number(inv.quantity || 0);
      const resv = Number(inv.reserved_quantity || 0);
      const unitValue = Number(p?.unit_price || p?.standard_cost || 650);

      const branchId = Number(inv.branch_id || 1);
      const branchName = branchMap.get(branchId) || "Main WH";

      if (!itemsMap.has(productId)) {
        itemsMap.set(productId, {
          productName,
          productCode,
          category,
          categoryLabel: label,
          unitValue,
          onHand: 0,
          reserved: 0,
          branchNames: new Set<string>(),
        });
      }

      const entry = itemsMap.get(productId)!;
      entry.onHand += qty;
      entry.reserved += resv;
      entry.branchNames.add(branchName);
    }

    const items: FinishedGoodsItem[] = [];
    const catMap = new Map<
      FinishedGoodsCategory,
      {
        label: string;
        skus: number;
        onHand: number;
        available: number;
        valuation: number;
        dosTotal: number;
        optimal: number;
        low: number;
      }
    >();

    let totalValuation = 0;
    let totalOnHandUnits = 0;
    let totalReservedUnits = 0;
    let totalAvailableUnits = 0;
    let optimalCount = 0;
    let lowCount = 0;
    let overstockedCount = 0;
    let outOfStockCount = 0;

    let index = 1;
    for (const [productId, data] of itemsMap.entries()) {
      const available = Math.max(0, data.onHand - data.reserved);
      const reorderPoint = Math.round(data.onHand * 0.35) || 200;
      const safetyStock = Math.round(data.onHand * 0.25) || 150;
      const status = determineStockStatus(available, reorderPoint, safetyStock);

      const dailyConsumption = Math.max(1, Math.round(data.onHand / 25));
      const daysOfSupply = Number((available / dailyConsumption).toFixed(1));
      const valuation = data.onHand * data.unitValue;

      if (status === "OPTIMAL") optimalCount++;
      else if (status === "LOW_STOCK") lowCount++;
      else if (status === "OVERSTOCKED") overstockedCount++;
      else if (status === "OUT_OF_STOCK") outOfStockCount++;

      totalValuation += valuation;
      totalOnHandUnits += data.onHand;
      totalReservedUnits += data.reserved;
      totalAvailableUnits += available;

      const itemObj: FinishedGoodsItem = {
        id: index++,
        productId,
        productName: data.productName,
        productCode: data.productCode,
        category: data.category,
        categoryLabel: data.categoryLabel,
        uom: data.productCode.includes("BOX") ? "BOX" : data.productCode.includes("CSE") ? "CASE" : "PCS",
        unitValue: data.unitValue,
        onHandQuantity: data.onHand,
        reservedQuantity: data.reserved,
        availableQuantity: available,
        reorderPoint,
        safetyStock,
        daysOfSupply,
        totalValuation: valuation,
        warehouseLocation: Array.from(data.branchNames).join(", "),
        status,
        batchCount: 3,
      };

      items.push(itemObj);

      // Aggregate Category Summary
      if (!catMap.has(data.category)) {
        catMap.set(data.category, {
          label: data.categoryLabel,
          skus: 0,
          onHand: 0,
          available: 0,
          valuation: 0,
          dosTotal: 0,
          optimal: 0,
          low: 0,
        });
      }
      const c = catMap.get(data.category)!;
      c.skus += 1;
      c.onHand += data.onHand;
      c.available += available;
      c.valuation += valuation;
      c.dosTotal += daysOfSupply;
      if (status === "OPTIMAL") c.optimal += 1;
      if (status === "LOW_STOCK") c.low += 1;
    }

    const categories: FinishedGoodsCategorySummary[] = Array.from(catMap.entries()).map(
      ([catKey, c]) => ({
        category: catKey,
        categoryLabel: c.label,
        totalSkus: c.skus,
        totalOnHandUnits: c.onHand,
        totalAvailableUnits: c.available,
        totalValuation: c.valuation,
        averageDaysOfSupply: c.skus > 0 ? Number((c.dosTotal / c.skus).toFixed(1)) : 0,
        optimalCount: c.optimal,
        lowStockCount: c.low,
      })
    ).sort((a, b) => b.totalValuation - a.totalValuation);

    items.sort((a, b) => b.totalValuation - a.totalValuation);

    const fulfillmentReadinessRate =
      totalOnHandUnits > 0
        ? Number(((totalAvailableUnits / totalOnHandUnits) * 100).toFixed(1))
        : 100;

    const totalMonitoredSkus = items.length;
    const avgDos =
      totalMonitoredSkus > 0
        ? Number(
            (items.reduce((acc, it) => acc + it.daysOfSupply, 0) / totalMonitoredSkus).toFixed(1)
          )
        : 0;

    const topItem = items[0];

    const kpis: FinishedGoodsInventoryKpis = {
      totalInventoryValuation: Math.round(totalValuation),
      totalOnHandUnits,
      totalReservedUnits,
      totalAvailableUnits,
      fulfillmentReadinessRate,
      averageDaysOfSupply: avgDos,
      totalMonitoredSkus,
      optimalStockSkus: optimalCount,
      lowStockSkus: lowCount,
      overstockedSkus: overstockedCount,
      outOfStockSkus: outOfStockCount,
      topValuationProduct: topItem?.productName || "None",
      topValuationAmount: topItem?.totalValuation || 0,
    };

    const responseData: FinishedGoodsInventoryResponse = {
      kpis,
      items,
      categories,
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
    console.error("[Finished Goods Inventory Route] Handler failed:", error);
    return NextResponse.json(FALLBACK_FINISHED_GOODS_DATA, { status: 200 });
  }
}

