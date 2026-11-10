import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  PurchaseOrderResponse,
  PurchaseOrderRecord,
  PurchaseOrderKpis,
  SupplierSpendSummary,
  MonthlySpendTrend,
  PurchaseInventoryStatus,
  PurchasePaymentStatus,
} from "@/modules/holdings/executive-dashboard/purchases/types";
import { FALLBACK_PURCHASES_DATA } from "@/modules/holdings/executive-dashboard/purchases/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedPurchasesData {
  data: PurchaseOrderResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedPurchasesData>();
const CACHE_TTL_MS = 30000; // 30s

const INVENTORY_STATUS_MAP: Record<number, { text: string; key: PurchaseInventoryStatus }> = {
  1: { text: "Requested", key: "REQUESTED" },
  3: { text: "Approved", key: "APPROVED" },
  6: { text: "Received", key: "RECEIVED" },
  7: { text: "Cancelled", key: "CANCELLED" },
  8: { text: "Rejected", key: "REJECTED" },
  9: { text: "Partially Received", key: "PARTIALLY_RECEIVED" },
  11: { text: "For Pickup", key: "FOR_PICKUP" },
  12: { text: "En Route", key: "FOR_DELIVERY" },
  13: { text: "For Receiving", key: "FOR_RECEIVING" },
  16: { text: "For Delivery", key: "FOR_DELIVERY" },
};

const PAYMENT_STATUS_MAP: Record<number, { text: string; key: PurchasePaymentStatus }> = {
  1: { text: "Pending Payment", key: "PENDING_PAYMENT" },
  2: { text: "Awaiting Payment", key: "AWAITING_PAYMENT" },
  3: { text: "Partially Paid", key: "PARTIALLY_PAID" },
  4: { text: "Paid", key: "PAID" },
  5: { text: "Payment Overdue", key: "OVERDUE" },
  6: { text: "On-hold", key: "ON_HOLD" },
  7: { text: "Cancelled", key: "CANCELLED" },
};

async function fetchDirectusWithTimeout<T>(
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
          g.category === "purchases" ||
          g.category === "purchase" ||
          g.category === "purchasing" ||
          g.category === "procurement" ||
          g.category === "purchase-orders" ||
          g.category === "po-summary"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Purchases Route] fetchDashboardGroups error:", e);
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
    const statusFilter = searchParams.get("status")?.toUpperCase();
    const supplierIdFilter = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate")?.trim();
    const endDate = searchParams.get("endDate")?.trim();

    const cacheKey = `purchases_${groupId}_${startDate || "all"}_${endDate || "all"}_${supplierIdFilter || "all"}_${statusFilter || "all"}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryBaseUrl = (
      (group?.directus as string | undefined) ||
      process.env.PURCHASES_DIRECTUS_URL ||
      "http://goatedcodoer:8091"
    ).replace(/\/$/, "");

    const token =
      (group?.directus_token as string | undefined) ||
      process.env.PURCHASES_DIRECTUS_TOKEN ||
      "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const hostVariants = [
      primaryBaseUrl,
      "http://goatedcodoer:8091",
      "http://100.66.3.70:8074",
      "http://goatedcodoer:8056",
    ];

    let poRecords: AnyRec[] = [];
    let supplierRecords: AnyRec[] = [];
    let receivingRecords: AnyRec[] = [];

    for (const host of hostVariants) {
      try {
        const poUrl = `${host}/items/purchase_order?sort=-purchase_order_id&limit=300&fields=purchase_order_id,purchase_order_no,date,date_encoded,date_received,supplier_name,gross_amount,discounted_amount,vat_amount,total_amount,inventory_status,payment_status,branch_id,is_posted,price_type`;
        const suppUrl = `${host}/items/suppliers?limit=400&fields=id,supplier_name,supplier_shortcut,supplier_type,payment_terms,city`;
        const recUrl = `${host}/items/purchase_order_receiving?sort=-purchase_order_product_id&limit=800&fields=purchase_order_id,total_amount,received_quantity,unit_price,received_date`;

        const [poRes, suppRes, recRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(poUrl, headers, 4000),
          fetchDirectusWithTimeout<AnyRec>(suppUrl, headers, 4000),
          fetchDirectusWithTimeout<AnyRec>(recUrl, headers, 4000),
        ]);

        if (poRes.ok && poRes.data.length > 0) {
          poRecords = poRes.data;
          supplierRecords = suppRes.data;
          receivingRecords = recRes.data;
          break;
        }
      } catch {
        // continue
      }
    }

    if (poRecords.length === 0) {
      let orders = FALLBACK_PURCHASES_DATA.orders;
      if (statusFilter && statusFilter !== "ALL") {
        orders = orders.filter((o) => o.inventoryStatusKey === statusFilter);
      }
      if (supplierIdFilter) {
        orders = orders.filter((o) => String(o.supplierId) === supplierIdFilter);
      }

      const responseData: PurchaseOrderResponse = {
        ...FALLBACK_PURCHASES_DATA,
        orders,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(responseData);
    }

    // Build receiving map (purchase_order_id -> sum of total_amount)
    const receivingMap = new Map<number, number>();
    receivingRecords.forEach((r) => {
      const pId = Number(r.purchase_order_id);
      const amt = parseFloat(String(r.total_amount || "0")) || 0;
      if (pId && !isNaN(amt)) {
        receivingMap.set(pId, (receivingMap.get(pId) || 0) + amt);
      }
    });

    // Build suppliers map
    const supplierMap = new Map<number, { name: string; type?: string }>();
    supplierRecords.forEach((s) => {
      const id = Number(s.id);
      if (!isNaN(id)) {
        supplierMap.set(id, {
          name: String(s.supplier_name || `Supplier #${id}`),
          type: s.supplier_type ? String(s.supplier_type) : undefined,
        });
      }
    });

    // Parse records
    const parsedOrders: PurchaseOrderRecord[] = [];
    const supplierSpendMap = new Map<
      number,
      {
        name: string;
        type?: string;
        count: number;
        spend: number;
        receivedSpend: number;
        received: number;
        pending: number;
      }
    >();

    const monthlyMap = new Map<string, { spend: number; count: number; receivedSpend: number }>();

    poRecords.forEach((p) => {
      const id = Number(p.purchase_order_id || p.id || 0);
      const poNo = String(p.purchase_order_no || `PO-${id}`);
      const dateStr = String(p.date || (p.date_encoded ? String(p.date_encoded).slice(0, 10) : ""));

      // Date filtering if requested
      if (startDate && dateStr && dateStr < startDate) return;
      if (endDate && dateStr && dateStr > endDate) return;

      const rawSupplier = Number(p.supplier_name || 0);
      const suppInfo = supplierMap.get(rawSupplier) || {
        name: rawSupplier ? `Supplier #${rawSupplier}` : "General Supplier",
        type: "TRADE",
      };

      const gross = parseFloat(String(p.gross_amount || "0")) || 0;
      let total = parseFloat(String(p.total_amount || "0")) || 0;
      if (total <= 0 && gross > 0) total = gross;

      const discount = parseFloat(String(p.discounted_amount || "0")) || 0;
      const vat = parseFloat(String(p.vat_amount || "0")) || 0;

      const invStatusNum = Number(p.inventory_status || 0);
      const invStatusObj = INVENTORY_STATUS_MAP[invStatusNum] || {
        text: `Status ${invStatusNum}`,
        key: "UNKNOWN" as PurchaseInventoryStatus,
      };

      const payStatusNum = Number(p.payment_status || 0);
      const payStatusObj = PAYMENT_STATUS_MAP[payStatusNum] || {
        text: `Payment ${payStatusNum}`,
        key: "UNKNOWN" as PurchasePaymentStatus,
      };

      // Calculate received amount
      let receivedAmt = receivingMap.get(id) || 0;
      if (receivedAmt === 0 && invStatusObj.key === "RECEIVED") {
        receivedAmt = total;
      } else if (invStatusObj.key === "PARTIALLY_RECEIVED" && receivedAmt === 0) {
        receivedAmt = Math.round(total * 0.5 * 100) / 100;
      }

      const record: PurchaseOrderRecord = {
        id,
        poNo,
        date: dateStr || new Date().toISOString().slice(0, 10),
        dateEncoded: p.date_encoded ? String(p.date_encoded) : undefined,
        dateReceived: p.date_received ? String(p.date_received) : null,
        supplierId: rawSupplier,
        supplierName: suppInfo.name,
        supplierType: suppInfo.type,
        grossAmount: gross,
        totalAmount: total,
        receivedAmount: receivedAmt,
        discountAmount: discount,
        vatAmount: vat,
        inventoryStatusId: invStatusNum,
        inventoryStatusText: invStatusObj.text,
        inventoryStatusKey: invStatusObj.key,
        paymentStatusId: payStatusNum,
        paymentStatusText: payStatusObj.text,
        paymentStatusKey: payStatusObj.key,
        branchId: p.branch_id ? Number(p.branch_id) : null,
        isPosted: Boolean(p.is_posted),
      };

      parsedOrders.push(record);

      // Aggregate supplier spend & received
      if (rawSupplier) {
        if (!supplierSpendMap.has(rawSupplier)) {
          supplierSpendMap.set(rawSupplier, {
            name: suppInfo.name,
            type: suppInfo.type,
            count: 0,
            spend: 0,
            receivedSpend: 0,
            received: 0,
            pending: 0,
          });
        }
        const sEntry = supplierSpendMap.get(rawSupplier)!;
        sEntry.count++;
        sEntry.spend += total;
        sEntry.receivedSpend += receivedAmt;
        if (invStatusObj.key === "RECEIVED" || invStatusObj.key === "PARTIALLY_RECEIVED") {
          sEntry.received++;
        } else {
          sEntry.pending++;
        }
      }

      // Aggregate monthly trend
      if (dateStr && dateStr.length >= 7) {
        const yyyyMm = dateStr.slice(0, 7); // e.g. "2026-11"
        const dObj = new Date(`${yyyyMm}-01T00:00:00Z`);
        const label = !isNaN(dObj.getTime())
          ? dObj.toLocaleString("en-US", { month: "short", year: "numeric" })
          : yyyyMm;

        if (!monthlyMap.has(label)) {
          monthlyMap.set(label, { spend: 0, count: 0, receivedSpend: 0 });
        }
        const mEntry = monthlyMap.get(label)!;
        mEntry.spend += total;
        mEntry.count++;
        mEntry.receivedSpend += receivedAmt;
      }
    });

    // Supplier rankings
    const topSuppliers: SupplierSpendSummary[] = Array.from(supplierSpendMap.entries())
      .map(([sId, s]) => ({
        supplierId: sId,
        supplierName: s.name,
        supplierType: s.type,
        orderCount: s.count,
        totalSpend: Math.round(s.spend * 100) / 100,
        receivedSpend: Math.round(s.receivedSpend * 100) / 100,
        receivedCount: s.received,
        pendingCount: s.pending,
        fulfillmentRate: s.count > 0 ? Math.round(((s.received) / s.count) * 1000) / 10 : 0,
        averageOrderValue: s.count > 0 ? Math.round(s.spend / s.count) : 0,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);

    // Monthly trends sorted chronologically
    const monthlyTrends: MonthlySpendTrend[] = Array.from(monthlyMap.entries())
      .map(([month, val]) => ({
        month,
        spend: Math.round(val.spend * 100) / 100,
        orderCount: val.count,
        receivedSpend: Math.round(val.receivedSpend * 100) / 100,
      }))
      .slice(-6);

    // Filter orders if user selected specific status or supplier
    let filteredOrders = parsedOrders;
    if (statusFilter && statusFilter !== "ALL") {
      filteredOrders = filteredOrders.filter((o) => o.inventoryStatusKey === statusFilter);
    }
    if (supplierIdFilter) {
      filteredOrders = filteredOrders.filter((o) => String(o.supplierId) === supplierIdFilter);
    }

    // Overall KPIs
    const totalSpend = parsedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalAmountReceived = parsedOrders.reduce((sum, o) => sum + o.receivedAmount, 0);
    const pendingAmount = Math.max(0, totalSpend - totalAmountReceived);

    const totalOrders = parsedOrders.length;
    const receivedOrders = parsedOrders.filter((o) => o.inventoryStatusKey === "RECEIVED").length;
    const partiallyReceivedOrders = parsedOrders.filter(
      (o) => o.inventoryStatusKey === "PARTIALLY_RECEIVED"
    ).length;
    const pendingOrders = parsedOrders.filter(
      (o) =>
        o.inventoryStatusKey !== "RECEIVED" &&
        o.inventoryStatusKey !== "PARTIALLY_RECEIVED" &&
        o.inventoryStatusKey !== "CANCELLED" &&
        o.inventoryStatusKey !== "REJECTED"
    ).length;
    const cancelledOrders = parsedOrders.filter(
      (o) => o.inventoryStatusKey === "CANCELLED" || o.inventoryStatusKey === "REJECTED"
    ).length;

    const fulfillmentRate =
      totalSpend > 0
        ? Math.round((totalAmountReceived / totalSpend) * 1000) / 10
        : totalOrders > 0
        ? Math.round(((receivedOrders + partiallyReceivedOrders) / totalOrders) * 1000) / 10
        : 0;

    const topSupplierName = topSuppliers[0]?.supplierName || "N/A";
    const topSupplierSpend = topSuppliers[0]?.totalSpend || 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpend / totalOrders) : 0;

    const kpis: PurchaseOrderKpis = {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalAmountReceived: Math.round(totalAmountReceived * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalOrders,
      fulfillmentRate,
      receivedOrders,
      partiallyReceivedOrders,
      pendingOrders,
      cancelledOrders,
      activeSuppliersCount: supplierSpendMap.size,
      topSupplierName,
      topSupplierSpend: Math.round(topSupplierSpend * 100) / 100,
      averageOrderValue,
    };

    const responseData: PurchaseOrderResponse = {
      kpis,
      orders: filteredOrders,
      topSuppliers,
      monthlyTrends,
      filters: {
        startDate,
        endDate,
        supplierId: supplierIdFilter ? Number(supplierIdFilter) : undefined,
        status: statusFilter,
      },
      source: "directus_live",
      timestamp: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Purchases API] Fatal error:", error);
    return NextResponse.json(FALLBACK_PURCHASES_DATA);
  }
}
