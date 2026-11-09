import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  InventoryAgingResponse,
  InventoryAgingItem,
  AgingBracketSummary,
  WarehouseAgingSummary,
  InventoryAgingKpis,
  AgingBracket,
  AgingStatus,
} from "@/modules/holdings/executive-dashboard/inventory-aging/types";
import { FALLBACK_INVENTORY_AGING_DATA } from "@/modules/holdings/executive-dashboard/inventory-aging/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedAgingData {
  data: InventoryAgingResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedAgingData>();
const CACHE_TTL_MS = 30000; // 30 seconds

async function fetchWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 6000
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
          g.category === "inventory-aging" ||
          g.category === "inventory_aging" ||
          g.category === "stock-aging" ||
          g.category === "aging-inventory" ||
          g.category === "slob-aging" ||
          g.category === "aging-and-slob-inventory"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Inventory Aging Route] fetchDashboardGroups error:", e);
    return null;
  }
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
    const bracketFilter = searchParams.get("bracket");
    const statusFilter = searchParams.get("status")?.toUpperCase();
    const branchFilter = searchParams.get("branchId");
    const searchTerm = searchParams.get("search")?.toLowerCase().trim();

    const cacheKey = `aging_${groupId}_${bracketFilter || "all"}_${statusFilter || "all"}_${branchFilter || "all"}_${searchTerm || ""}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const springUrl = ((group?.springboot as string | undefined) || "http://goatedcodoer:8083").replace(/\/$/, "");
    const directusBaseUrl = ((group?.directus as string | undefined) || "http://goatedcodoer:8091").replace(/\/$/, "");
    const directusToken = (group?.directus_token as string | undefined) || "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";
    const username = (group?.username as string | undefined) || "dev@men2corp.com";

    // 1. Authenticate with Spring Boot
    let springToken: string | null = null;
    try {
      const loginRes = await fetch(`${springUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, hashPassword: "Vertex81617" }),
        signal: AbortSignal.timeout(4000),
      });
      if (loginRes.ok) {
        const lJson = await loginRes.json();
        springToken = lJson.token || null;
      }
    } catch (e) {
      console.warn("[Inventory Aging Route] Spring boot login failed:", e);
    }

    // 2. Fetch SLOB aging view from Spring Boot
    let rawSlobRows: AnyRec[] = [];
    if (springToken) {
      try {
        const slobRes = await fetch(`${springUrl}/api/view-slob-aging/all`, {
          headers: { Authorization: `Bearer ${springToken}` },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (slobRes.ok) {
          const slobJson = await slobRes.json();
          if (Array.isArray(slobJson)) {
            rawSlobRows = slobJson;
          }
        }
      } catch (e) {
        console.warn("[Inventory Aging Route] SLOB view query failed:", e);
      }
    }

    // 3. Optional Directus Products Enrichment
    const productMetaMap = new Map<number, { code?: string; brand?: string; category?: string }>();
    try {
      const pUrl = `${directusBaseUrl}/items/products?limit=250&fields=product_id,product_code,product_brand,product_category`;
      const pRes = await fetchWithTimeout<AnyRec>(pUrl, { Authorization: `Bearer ${directusToken}` }, 3000);
      if (pRes.ok && pRes.data.length > 0) {
        pRes.data.forEach((p) => {
          const pid = Number(p.product_id);
          if (pid) {
            productMetaMap.set(pid, {
              code: p.product_code ? String(p.product_code) : undefined,
              brand: p.product_brand ? String(p.product_brand) : undefined,
              category: p.product_category ? String(p.product_category) : undefined,
            });
          }
        });
      }
    } catch {
      // Continue even if Directus product metadata lookup times out
    }

    // Fallback if engine is completely offline or returned empty
    if (rawSlobRows.length === 0) {
      let fallbackItems = [...FALLBACK_INVENTORY_AGING_DATA.items];
      if (bracketFilter && bracketFilter !== "ALL") {
        fallbackItems = fallbackItems.filter((i) => i.bracket === bracketFilter);
      }
      if (statusFilter && statusFilter !== "ALL") {
        fallbackItems = fallbackItems.filter((i) => i.status === statusFilter);
      }
      if (branchFilter && branchFilter !== "ALL") {
        fallbackItems = fallbackItems.filter((i) => i.branchId === Number(branchFilter));
      }
      if (searchTerm) {
        fallbackItems = fallbackItems.filter(
          (i) =>
            i.productName.toLowerCase().includes(searchTerm) ||
            (i.productCode && i.productCode.toLowerCase().includes(searchTerm))
        );
      }

      const response: InventoryAgingResponse = {
        ...FALLBACK_INVENTORY_AGING_DATA,
        items: fallbackItems,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    // 4. Process and categorize every live row
    const now = Date.now();
    const parsedItems: InventoryAgingItem[] = [];

    // Bracket aggregations
    const bracketMap = new Map<
      AgingBracket,
      { label: string; skuCount: number; totalUnits: number; totalValuation: number; color: string }
    >([
      ["0-30", { label: "0-30 Days (Fresh)", skuCount: 0, totalUnits: 0, totalValuation: 0, color: "#10b981" }],
      ["31-60", { label: "31-60 Days (Normal)", skuCount: 0, totalUnits: 0, totalValuation: 0, color: "#06b6d4" }],
      ["61-90", { label: "61-90 Days (Slow Moving)", skuCount: 0, totalUnits: 0, totalValuation: 0, color: "#f59e0b" }],
      ["91-120", { label: "91-120 Days (At Risk)", skuCount: 0, totalUnits: 0, totalValuation: 0, color: "#f97316" }],
      ["120+", { label: "120+ Days (SLOB / Obsolete)", skuCount: 0, totalUnits: 0, totalValuation: 0, color: "#ef4444" }],
    ]);

    // Warehouse aggregations
    const warehouseMap = new Map<
      number,
      { name: string; skuCount: number; totalUnits: number; totalValuation: number; slobValuation: number; slobUnits: number }
    >();

    let totalValuation = 0;
    let totalSlobValue = 0;
    let totalStockUnits = 0;
    let slobUnits = 0;
    let criticalSlobSkuCount = 0;
    let atRiskSkuCount = 0;
    let totalDaysSum = 0;

    let topAgedProduct = { name: "N/A", value: 0 };

    rawSlobRows.forEach((row, idx) => {
      const branchId = Number(row.branchId || 279);
      const branchName = String(row.branchName || "Central Warehouse");
      const productId = Number(row.productId || 0);
      const productName = String(row.productName || `Product #${productId}`);
      const currentStock = Math.max(0, Number(row.currentStock || 0));
      const costPerUnit = Number(row.costPerUnit || 0);
      const isSlob = Number(row.isSlob || 0);
      const slobThreshold = Number(row.slobDaysThreshold || 60);
      const stockVal = Math.max(0, Number(row.stockValue || currentStock * costPerUnit));

      // Calculate days since last outbound
      let days = 0;
      const lastOutbound = row.lastOutboundDate ? String(row.lastOutboundDate) : null;
      if (lastOutbound) {
        const outboundTime = new Date(lastOutbound).getTime();
        if (!isNaN(outboundTime)) {
          days = Math.max(0, Math.floor((now - outboundTime) / (1000 * 60 * 60 * 24)));
        } else {
          days = isSlob === 1 ? 125 : 45;
        }
      } else {
        days = isSlob === 1 ? 130 : 25;
      }

      // Assign bracket and status
      let bracket: AgingBracket = "0-30";
      let status: AgingStatus = "FRESH";

      if (isSlob === 1 || days > 120) {
        bracket = "120+";
        status = "SLOB";
      } else if (days > 90) {
        bracket = "91-120";
        status = "AT_RISK";
      } else if (days > 60) {
        bracket = "61-90";
        status = "SLOW_MOVING";
      } else if (days > 30) {
        bracket = "31-60";
        status = "NORMAL";
      } else {
        bracket = "0-30";
        status = "FRESH";
      }

      // Metadata lookup
      const meta = productMetaMap.get(productId);
      const productCode = meta?.code || `SKU-${productId}`;
      const productBrand = meta?.brand || "Mama Pina's";
      const productCategory = meta?.category || (productName.toLowerCase().includes("oil") ? "Edible Oils" : "Spices & Seasonings");

      const item: InventoryAgingItem = {
        id: String(row.id || `SLOB:${branchId}:${productId}:${idx}`),
        branchId,
        branchName,
        productId,
        productName,
        productCode,
        productBrand,
        productCategory,
        supplierId: row.supplierId ? Number(row.supplierId) : undefined,
        supplierShortcut: row.supplierShortcut ? String(row.supplierShortcut) : undefined,
        currentStock,
        costPerUnit: Math.round(costPerUnit * 100) / 100,
        stockValue: Math.round(stockVal * 100) / 100,
        lastOutboundDate: lastOutbound ? lastOutbound.slice(0, 10) : null,
        daysSinceLastOutbound: days,
        isSlob,
        slobDaysThreshold: slobThreshold,
        bracket,
        status,
      };

      parsedItems.push(item);

      // KPI Accumulations
      totalValuation += stockVal;
      totalStockUnits += currentStock;
      totalDaysSum += days;

      if (status === "SLOB") {
        totalSlobValue += stockVal;
        slobUnits += currentStock;
        criticalSlobSkuCount++;
        if (stockVal > topAgedProduct.value) {
          topAgedProduct = { name: productName, value: stockVal };
        }
      } else if (status === "AT_RISK" || status === "SLOW_MOVING") {
        atRiskSkuCount++;
      }

      // Bracket aggregation
      const bEntry = bracketMap.get(bracket)!;
      bEntry.skuCount++;
      bEntry.totalUnits += currentStock;
      bEntry.totalValuation += stockVal;

      // Warehouse aggregation
      if (!warehouseMap.has(branchId)) {
        warehouseMap.set(branchId, {
          name: branchName,
          skuCount: 0,
          totalUnits: 0,
          totalValuation: 0,
          slobValuation: 0,
          slobUnits: 0,
        });
      }
      const wEntry = warehouseMap.get(branchId)!;
      wEntry.skuCount++;
      wEntry.totalUnits += currentStock;
      wEntry.totalValuation += stockVal;
      if (status === "SLOB") {
        wEntry.slobValuation += stockVal;
        wEntry.slobUnits += currentStock;
      }
    });

    const totalSkus = parsedItems.length;
    const slobRiskRatio = totalValuation > 0 ? Math.round((totalSlobValue / totalValuation) * 1000) / 10 : 0;
    const averageAgingDays = totalSkus > 0 ? Math.round((totalDaysSum / totalSkus) * 10) / 10 : 0;

    const kpis: InventoryAgingKpis = {
      totalValuation: Math.round(totalValuation * 100) / 100,
      totalSlobValue: Math.round(totalSlobValue * 100) / 100,
      slobRiskRatio,
      totalStockUnits,
      slobUnits,
      totalSkuCount: totalSkus,
      criticalSlobSkuCount,
      atRiskSkuCount,
      topAgedProductName: topAgedProduct.name,
      topAgedProductValue: Math.round(topAgedProduct.value * 100) / 100,
      averageAgingDays,
    };

    // Format brackets
    const brackets: AgingBracketSummary[] = Array.from(bracketMap.entries()).map(([bracket, val]) => ({
      bracket,
      label: val.label,
      skuCount: val.skuCount,
      totalUnits: val.totalUnits,
      totalValuation: Math.round(val.totalValuation * 100) / 100,
      sharePercentage:
        totalValuation > 0 ? Math.round((val.totalValuation / totalValuation) * 1000) / 10 : 0,
      color: val.color,
    }));

    // Format warehouses
    const warehouses: WarehouseAgingSummary[] = Array.from(warehouseMap.entries())
      .map(([branchId, val]) => ({
        branchId,
        branchName: val.name,
        skuCount: val.skuCount,
        totalUnits: val.totalUnits,
        totalValuation: Math.round(val.totalValuation * 100) / 100,
        slobValuation: Math.round(val.slobValuation * 100) / 100,
        slobUnits: val.slobUnits,
        slobRatio:
          val.totalValuation > 0 ? Math.round((val.slobValuation / val.totalValuation) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.slobValuation - a.slobValuation);

    // Apply Filters to items payload
    let filteredItems = parsedItems;
    if (bracketFilter && bracketFilter !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.bracket === bracketFilter);
    }
    if (statusFilter && statusFilter !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.status === statusFilter);
    }
    if (branchFilter && branchFilter !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.branchId === Number(branchFilter));
    }
    if (searchTerm) {
      filteredItems = filteredItems.filter(
        (i) =>
          i.productName.toLowerCase().includes(searchTerm) ||
          (i.productCode && i.productCode.toLowerCase().includes(searchTerm)) ||
          i.branchName.toLowerCase().includes(searchTerm)
      );
    }

    const responsePayload: InventoryAgingResponse = {
      kpis,
      brackets,
      warehouses,
      items: filteredItems,
      filters: {
        bracket: bracketFilter || undefined,
        status: statusFilter || undefined,
        branchId: branchFilter ? Number(branchFilter) : undefined,
        search: searchTerm || undefined,
      },
      source: "live_engine",
      timestamp: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[Inventory Aging Route] Unhandled exception:", error);
    return NextResponse.json(FALLBACK_INVENTORY_AGING_DATA, { status: 200 });
  }
}

