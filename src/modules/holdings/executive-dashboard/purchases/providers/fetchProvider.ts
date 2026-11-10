import type { PurchaseOrderResponse } from "../types";

export interface FetchPurchasesParams {
  groupId: string | number;
  startDate?: string;
  endDate?: string;
  supplierId?: number;
  status?: string;
  force?: boolean;
}

export const FALLBACK_PURCHASES_DATA: PurchaseOrderResponse = {
  kpis: {
    totalSpend: 79889835.6,
    totalAmountReceived: 63541416.15,
    pendingAmount: 16348419.45,
    totalOrders: 100,
    fulfillmentRate: 79.5,
    receivedOrders: 26,
    partiallyReceivedOrders: 57,
    pendingOrders: 17,
    cancelledOrders: 0,
    activeSuppliersCount: 14,
    topSupplierName: "MAMA PINA'S",
    topSupplierSpend: 38450120.0,
    averageOrderValue: 798898.36,
  },
  topSuppliers: [
    {
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      orderCount: 38,
      totalSpend: 38450120.0,
      receivedSpend: 33374704.16,
      receivedCount: 22,
      pendingCount: 16,
      fulfillmentRate: 86.8,
      averageOrderValue: 1011845.26,
    },
    {
      supplierId: 567,
      supplierName: "SAN MIGUEL PACKAGING CORP",
      supplierType: "TRADE",
      orderCount: 18,
      totalSpend: 14820450.0,
      receivedSpend: 13175380.05,
      receivedCount: 14,
      pendingCount: 4,
      fulfillmentRate: 88.9,
      averageOrderValue: 823358.33,
    },
    {
      supplierId: 561,
      supplierName: "UNIVERSAL ROBINA CORP - INGREDIENTS",
      supplierType: "TRADE",
      orderCount: 14,
      totalSpend: 9650220.0,
      receivedSpend: 7575422.7,
      receivedCount: 10,
      pendingCount: 4,
      fulfillmentRate: 78.5,
      averageOrderValue: 689301.43,
    },
    {
      supplierId: 509,
      supplierName: "FOODSPHERE CANNING & BOTTLING",
      supplierType: "TRADE",
      orderCount: 12,
      totalSpend: 6240000.0,
      receivedSpend: 4680000.0,
      receivedCount: 8,
      pendingCount: 4,
      fulfillmentRate: 75.0,
      averageOrderValue: 520000.0,
    },
    {
      supplierId: 58,
      supplierName: "ALASKA MILK SUPPLIES INC",
      supplierType: "TRADE",
      orderCount: 9,
      totalSpend: 4725000.0,
      receivedSpend: 4200525.0,
      receivedCount: 7,
      pendingCount: 2,
      fulfillmentRate: 88.9,
      averageOrderValue: 525000.0,
    },
    {
      supplierId: 86,
      supplierName: "MEGAWIDE INDUSTRIAL PACKAGING",
      supplierType: "TRADE",
      orderCount: 5,
      totalSpend: 3120000.0,
      receivedSpend: 2496000.0,
      receivedCount: 4,
      pendingCount: 1,
      fulfillmentRate: 80.0,
      averageOrderValue: 624000.0,
    },
    {
      supplierId: 13,
      supplierName: "OFFICE SOLUTIONS & SUPPLIES PH",
      supplierType: "NON-TRADE",
      orderCount: 4,
      totalSpend: 2884045.6,
      receivedSpend: 2163034.2,
      receivedCount: 3,
      pendingCount: 1,
      fulfillmentRate: 75.0,
      averageOrderValue: 721011.4,
    },
  ],
  monthlyTrends: [
    { month: "Jun 2026", spend: 9850000.0, orderCount: 12, receivedSpend: 9850000.0 },
    { month: "Jul 2026", spend: 11420000.0, orderCount: 15, receivedSpend: 11420000.0 },
    { month: "Aug 2026", spend: 12850000.0, orderCount: 16, receivedSpend: 12850000.0 },
    { month: "Sep 2026", spend: 14200000.0, orderCount: 18, receivedSpend: 13950000.0 },
    { month: "Oct 2026", spend: 16890000.0, orderCount: 21, receivedSpend: 15200000.0 },
    { month: "Nov 2026", spend: 14679835.6, orderCount: 18, receivedSpend: 11200000.0 },
  ],
  orders: [
    {
      id: 2784,
      poNo: "PO-20261107-1794016873948",
      date: "2026-11-07",
      dateEncoded: "2026-11-07T10:01:42.000Z",
      dateReceived: "2026-11-07T10:02:56",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 854650.0,
      totalAmount: 854650.0,
      receivedAmount: 854650.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 9,
      inventoryStatusText: "Partially Received",
      inventoryStatusKey: "PARTIALLY_RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
    {
      id: 2783,
      poNo: "PO-20261106-1793933423342",
      date: "2026-11-06",
      dateEncoded: "2026-11-06T10:52:24.000Z",
      dateReceived: "2026-11-06T10:54:53",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 1367440.0,
      totalAmount: 1367440.0,
      receivedAmount: 1367440.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 9,
      inventoryStatusText: "Partially Received",
      inventoryStatusKey: "PARTIALLY_RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
    {
      id: 2782,
      poNo: "PO-20261104-01310",
      date: "2026-11-04",
      dateEncoded: "2026-11-04T08:15:20.000Z",
      dateReceived: null,
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 1029462.68,
      totalAmount: 1029462.7,
      receivedAmount: 0.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 1,
      inventoryStatusText: "Requested",
      inventoryStatusKey: "REQUESTED",
      paymentStatusId: 1,
      paymentStatusText: "Pending Payment",
      paymentStatusKey: "PENDING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 2,
    },
    {
      id: 2780,
      poNo: "PO-20261104-1793780540971",
      date: "2026-11-04",
      dateEncoded: "2026-11-04T12:08:10.000Z",
      dateReceived: "2026-11-05T09:12:00",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 190610.0,
      totalAmount: 190610.0,
      receivedAmount: 190610.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 6,
      inventoryStatusText: "Received",
      inventoryStatusKey: "RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
    {
      id: 2779,
      poNo: "PO-20261104-1793779730691",
      date: "2026-11-04",
      dateEncoded: "2026-11-04T11:45:00.000Z",
      dateReceived: "2026-11-05T08:30:00",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 512790.0,
      totalAmount: 512790.0,
      receivedAmount: 512790.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 6,
      inventoryStatusText: "Received",
      inventoryStatusKey: "RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
    {
      id: 2777,
      poNo: "PO-20261103-01305",
      date: "2026-11-03",
      dateEncoded: "2026-11-03T09:20:00.000Z",
      dateReceived: "2026-11-06T08:54:36",
      supplierId: 567,
      supplierName: "SAN MIGUEL PACKAGING CORP",
      supplierType: "TRADE",
      grossAmount: 494466.8,
      totalAmount: 494466.8,
      receivedAmount: 494466.8,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 3,
      inventoryStatusText: "Approved",
      inventoryStatusKey: "APPROVED",
      paymentStatusId: 1,
      paymentStatusText: "Pending Payment",
      paymentStatusKey: "PENDING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 4,
    },
    {
      id: 2776,
      poNo: "PO-20261103-1793676562991",
      date: "2026-11-03",
      dateEncoded: "2026-11-03T14:10:00.000Z",
      dateReceived: "2026-11-04T10:00:00",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 1410172.5,
      totalAmount: 1410172.5,
      receivedAmount: 1410172.5,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 6,
      inventoryStatusText: "Received",
      inventoryStatusKey: "RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
    {
      id: 2774,
      poNo: "PO-20261030-01302",
      date: "2026-10-30",
      dateEncoded: "2026-10-30T11:00:00.000Z",
      dateReceived: null,
      supplierId: 567,
      supplierName: "SAN MIGUEL PACKAGING CORP",
      supplierType: "TRADE",
      grossAmount: 410201.9,
      totalAmount: 410201.9,
      receivedAmount: 0.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 13,
      inventoryStatusText: "For Receiving",
      inventoryStatusKey: "FOR_RECEIVING",
      paymentStatusId: 1,
      paymentStatusText: "Pending Payment",
      paymentStatusKey: "PENDING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 3,
    },
    {
      id: 2773,
      poNo: "PO-20261030-1793338458464",
      date: "2026-10-30",
      dateEncoded: "2026-10-30T16:20:00.000Z",
      dateReceived: "2026-10-31T11:45:00",
      supplierId: 561,
      supplierName: "UNIVERSAL ROBINA CORP - INGREDIENTS",
      supplierType: "TRADE",
      grossAmount: 398399.6,
      totalAmount: 342585.81,
      receivedAmount: 342585.81,
      discountAmount: 55813.79,
      vatAmount: 0,
      inventoryStatusId: 6,
      inventoryStatusText: "Received",
      inventoryStatusKey: "RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 2,
    },
    {
      id: 2769,
      poNo: "PO-20261027-1793135485039",
      date: "2026-10-27",
      dateEncoded: "2026-10-27T10:30:00.000Z",
      dateReceived: "2026-10-28T09:00:00",
      supplierId: 33,
      supplierName: "MAMA PINA'S",
      supplierType: "TRADE",
      grossAmount: 2563950.0,
      totalAmount: 2563950.0,
      receivedAmount: 2563950.0,
      discountAmount: 0,
      vatAmount: 0,
      inventoryStatusId: 6,
      inventoryStatusText: "Received",
      inventoryStatusKey: "RECEIVED",
      paymentStatusId: 2,
      paymentStatusText: "Awaiting Payment",
      paymentStatusKey: "AWAITING_PAYMENT",
      branchId: 278,
      isPosted: false,
      itemCount: 1,
    },
  ],
  filters: {},
  source: "fallback_mock",
  timestamp: new Date().toISOString(),
};

interface CacheEntry {
  data: PurchaseOrderResponse;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20000; // 20s

export async function fetchPurchases(
  params: FetchPurchasesParams
): Promise<PurchaseOrderResponse> {
  const { groupId, startDate, endDate, supplierId, status, force = false } = params;

  const cacheKey = `purchases_${groupId}_${startDate || "all"}_${endDate || "all"}_${supplierId || "all"}_${status || "all"}`;

  if (!force && clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (supplierId) query.set("supplierId", String(supplierId));
  if (status) query.set("status", status);
  if (force) query.set("force", "true");

  const qs = query.toString();
  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/purchases${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchPurchases] API responded with ${res.status}, returning fallback`);
      return FALLBACK_PURCHASES_DATA;
    }

    const data: PurchaseOrderResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.warn("[fetchPurchases] Failed to fetch purchases from API, returning fallback:", error);
    return FALLBACK_PURCHASES_DATA;
  }
}
