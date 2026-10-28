import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DirectusInvoice {
  invoice_id: number;
  invoice_no?: string;
  order_id?: string | null;
  customer_code?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
  net_amount?: number | null;
  gross_amount?: number | null;
  discount_amount?: number | null;
  isPosted?: unknown;
  salesman_id?: number | null;
  branch_id?: number | { branch_name?: string } | null;
  dispatch_date?: string | null;
  payment_status?: string | null;
  transaction_status?: string | null;
}

interface DirectusCustomer {
  customer_code: string;
  customer_name: string;
}

interface DirectusSalesman {
  id: number;
  salesman_name: string;
  division_id?: number | null;
}

interface DirectusDivision {
  division_id: number;
  division_name: string;
}

interface DirectusPayment {
  invoice_id: number;
  paid_amount?: number | null;
}

interface DirectusReturn {
  invoice_no: number;
  amount?: number | null;
}

interface DirectusMemo {
  invoice_id: number;
  amount?: number | null;
  memo_id?: {
    type?: number | null;
    status?: string | null;
  } | null;
}

interface DirectusUnfulfilled {
  sales_invoice_id: number;
  variance_amount?: number | null;
}

interface DirectusCollection {
  id: number;
  salesman_id?: number | null;
  totalAmount?: number | null;
  isPosted?: unknown;
  isCancelled?: unknown;
}

interface DirectusCollectionInvoice {
  collection_id?: number;
  invoice_id?: number;
  amount?: number;
}

function parseBit(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.type === "Buffer" && Array.isArray(obj.data)) return obj.data[0] === 1;
  }
  return val === "1" || val === 1;
}

function asNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find(
        (g: { id: string | number; [key: string]: unknown }) =>
          String(g.id) === groupId
      ) || groups.find((g: { category?: string }) => g.category === "accounts-receivable") || groups[0]
    );
  } catch (e) {
    console.error("[AR Route] fetchDashboardGroups failed:", e);
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

    const directusUrl = (
      (group?.directus as string | undefined) ||
      process.env.DIRECTUS_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ""
    ).replace(/\/$/, "");

    const token =
      (group?.directus_token as string | undefined) ||
      process.env.DIRECTUS_STATIC_TOKEN ||
      "";

    if (!directusUrl) {
      return NextResponse.json(
        { error: "Directus URL not configured for this group" },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("startDate") || searchParams.get("dateFrom");
    const dateTo = searchParams.get("endDate") || searchParams.get("dateTo");
    const arStatusFilter = searchParams.get("arStatus");
    const txStatusFilter = searchParams.get("transactionStatus");

    const invoiceFields = [
      "invoice_id",
      "invoice_no",
      "order_id",
      "customer_code",
      "invoice_date",
      "due_date",
      "total_amount",
      "net_amount",
      "gross_amount",
      "discount_amount",
      "isPosted",
      "salesman_id",
      "branch_id",
      "dispatch_date",
      "payment_status",
      "transaction_status",
    ].join(",");

    async function fetchAllSalesInvoices(urlBase: string): Promise<DirectusInvoice[]> {
      const all: DirectusInvoice[] = [];
      let offset = 0;
      while (true) {
        const url = `${urlBase}&limit=500&offset=${offset}`;
        const res = await fetch(url, { headers, cache: "no-store" });
        if (!res.ok) break;
        const json = await res.json();
        const rows = json.data || [];
        all.push(...rows);
        if (rows.length < 500) break;
        offset += 500;
      }
      return all;
    }

    async function fetchAllChunked<T>(
      baseUrl: string,
      idField: string,
      ids: (number | string)[],
      chunkSize = 300,
      concurrency = 5
    ): Promise<T[]> {
      if (ids.length === 0) return [];
      const chunks: (number | string)[][] = [];
      for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
      const results: T[] = [];
      for (let i = 0; i < chunks.length; i += concurrency) {
        const batch = chunks.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(async (chunk) => {
            const sep = baseUrl.includes("?") ? "&" : "?";
            const url = `${baseUrl}${sep}filter[${idField}][_in]=${chunk.join(",")}`;
            const res = await fetch(url, { headers, cache: "no-store" });
            if (!res.ok) return [];
            const j = await res.json();
            return (j.data || []) as T[];
          })
        );
        results.push(...batchResults.flat());
      }
      return results;
    }

    const baseFilter = [
      "filter[payment_status][_nin]=Paid,Fully Paid,Void,VOID,Cancelled,CANCELLED,Cancelled%20-%20Old%20Invoice,CANCELLED%20-%20OLD%20INVOICE",
      "filter[_or][0][isPosted][_null]=true",
      "filter[_or][1][isPosted][_eq]=false",
      "filter[_and][0][_or][0][transaction_status][_nin]=Cancelled,CANCELLED,Void,VOID,void,Not%20Fulfilled,NOT%20FULFILLED,Cancelled%20-%20Old%20Invoice,CANCELLED%20-%20OLD%20INVOICE,cancelled%20-%20old%20invoice",
      "filter[_and][0][_or][1][transaction_status][_null]=true",
    ].join("&");

    let invoiceUrl = `${directusUrl}/items/sales_invoice?${baseFilter}&fields=${invoiceFields}&sort=-invoice_date,-invoice_id`;
    if (dateFrom && dateTo && dateFrom !== "2020-01-01") {
      invoiceUrl += `&filter[invoice_date][_between]=[${dateFrom},${dateTo}]`;
    }

    // Phase 1: Fetch invoices, unposted collections, and master tables
    const [invoices, unpostedCollections, custRes, salesRes, divRes] = await Promise.all([
      fetchAllSalesInvoices(invoiceUrl),
      fetch(`${directusUrl}/items/collection?limit=-1&fields=id,salesman_id,totalAmount&filter[isPosted][_neq]=true&filter[isCancelled][_neq]=true`, { headers, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((j) => (j.data || []) as DirectusCollection[])
        .catch(() => [] as DirectusCollection[]),
      fetch(`${directusUrl}/items/customer?fields=customer_code,customer_name&limit=-1`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/salesman?fields=id,salesman_name,division_id&limit=-1`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/division?fields=division_id,division_name&limit=-1`, { headers, cache: "no-store" }),
    ]);

    const invoiceIds = invoices.map((inv) => inv.invoice_id);
    const unpostedPouchIds = unpostedCollections.map((c) => c.id);

    // Phase 2: Fetch related records chunked by invoice_id / pouch_id (matches FM _arFetchAndDerive exactly)
    const [payments, returns_, memos, unfulfilled, collectionInvoices] = await Promise.all([
      fetchAllChunked<DirectusPayment>(`${directusUrl}/items/sales_invoice_payments?limit=-1&fields=invoice_id,paid_amount`, "invoice_id", invoiceIds),
      fetchAllChunked<DirectusReturn>(`${directusUrl}/items/sales_invoice_sales_return?limit=-1&fields=invoice_no,amount`, "invoice_no", invoiceIds),
      fetchAllChunked<DirectusMemo>(`${directusUrl}/items/customer_memo_invoices?limit=-1&fields=invoice_id,amount,memo_id.type,memo_id.status`, "invoice_id", invoiceIds),
      fetchAllChunked<DirectusUnfulfilled>(`${directusUrl}/items/unfulfilled_sales_transaction?limit=-1&fields=sales_invoice_id,variance_amount`, "sales_invoice_id", invoiceIds),
      fetchAllChunked<DirectusCollectionInvoice>(`${directusUrl}/items/collection_invoices?limit=-1&fields=collection_id,invoice_id,amount`, "collection_id", unpostedPouchIds),
    ]);

    const customersMap = new Map<string, string>();
    if (custRes.ok) {
      const cData = (await custRes.json()).data || [];
      cData.forEach((c: DirectusCustomer) => {
        if (c.customer_code) customersMap.set(c.customer_code.trim(), c.customer_name);
      });
    }

    const salesmenMap = new Map<number, DirectusSalesman>();
    if (salesRes.ok) {
      const sData = (await salesRes.json()).data || [];
      sData.forEach((s: DirectusSalesman) => {
        if (s.id) salesmenMap.set(s.id, s);
      });
    }

    const divisionsMap = new Map<number, string>();
    if (divRes.ok) {
      const dData = (await divRes.json()).data || [];
      dData.forEach((d: DirectusDivision) => {
        if (d.division_id) divisionsMap.set(d.division_id, d.division_name);
      });
    }

    // Payment aggregations
    const paymentsMap = new Map<number, number>();
    payments.forEach((p) => {
      if (p.invoice_id) {
        paymentsMap.set(p.invoice_id, (paymentsMap.get(p.invoice_id) || 0) + asNumber(p.paid_amount));
      }
    });

    // Return aggregations (invoice_no in sales_invoice_sales_return corresponds to invoice_id)
    const returnAgg = new Map<number, number>();
    returns_.forEach((r) => {
      if (r.invoice_no) {
        returnAgg.set(r.invoice_no, (returnAgg.get(r.invoice_no) || 0) + asNumber(r.amount));
      }
    });

    // Credit and Debit Memo aggregations (type 1 = credit, type 0 or 2 = debit)
    const creditAgg = new Map<number, number>();
    const debitAgg = new Map<number, number>();
    memos.forEach((m) => {
      if (!m.memo_id || m.memo_id.status !== "APPROVED") return;
      const type = Number(m.memo_id.type);
      const amt = asNumber(m.amount);
      if (type === 1) {
        creditAgg.set(m.invoice_id, (creditAgg.get(m.invoice_id) || 0) + amt);
      } else if (type === 0 || type === 2) {
        debitAgg.set(m.invoice_id, (debitAgg.get(m.invoice_id) || 0) + amt);
      }
    });

    // Unfulfilled transaction aggregations
    const unfulfilledAgg = new Map<number, number>();
    unfulfilled.forEach((u) => {
      if (u.sales_invoice_id) {
        unfulfilledAgg.set(u.sales_invoice_id, (unfulfilledAgg.get(u.sales_invoice_id) || 0) + asNumber(u.variance_amount));
      }
    });

    // Unposted collections pool & salesman unposted map
    const unpostedPouchIdSet = new Set(unpostedPouchIds);
    let totalUnposted = 0;
    const salesmanUnpostedMap = new Map<string, number>();

    for (const c of unpostedCollections) {
      const amt = asNumber(c.totalAmount);
      totalUnposted += amt;
      const sName = c.salesman_id ? (salesmenMap.get(c.salesman_id)?.salesman_name || "Unknown") : "Unknown";
      salesmanUnpostedMap.set(sName, (salesmanUnpostedMap.get(sName) || 0) + amt);
    }

    // Invoice-level unposted allocation
    const unpostedInvoiceAllocMap = new Map<number, number>();
    for (const ci of collectionInvoices) {
      if (ci.collection_id && unpostedPouchIdSet.has(ci.collection_id) && ci.invoice_id) {
        unpostedInvoiceAllocMap.set(ci.invoice_id, (unpostedInvoiceAllocMap.get(ci.invoice_id) || 0) + asNumber(ci.amount));
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalReceivable = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let overdueDaysSum = 0;
    let totalPendingCancellation = 0;

    const agingData = [
      { range: "0-30 Days", amount: 0 },
      { range: "31-60 Days", amount: 0 },
      { range: "61-90 Days", amount: 0 },
      { range: "90+ Days", amount: 0 },
    ];

    const salesmanOutstandingMap = new Map<string, number>();
    const rows = [];

    for (const inv of invoices) {
      if (parseBit(inv.isPosted)) continue;

      const txStatus = (inv.transaction_status || "").trim().toUpperCase();
      const payStatus = (inv.payment_status || "").trim().toUpperCase();
      if (
        txStatus === "NOT FULFILLED" ||
        txStatus === "NOT_FULFILLED" ||
        txStatus === "CANCELLED" ||
        txStatus.startsWith("CANCELLED -") ||
        txStatus.includes("OLD INVOICE") ||
        txStatus === "VOID" ||
        txStatus === "VOIDED" ||
        payStatus === "VOID" ||
        payStatus === "VOIDED" ||
        payStatus === "CANCELLED" ||
        payStatus.startsWith("CANCELLED -") ||
        payStatus.includes("OLD INVOICE")
      ) {
        continue;
      }

      const invId = inv.invoice_id;
      const custCode = (inv.customer_code || "").trim();
      const custName = customersMap.get(custCode) || custCode || "Unknown Customer";

      const salesmanInfo = inv.salesman_id ? salesmenMap.get(inv.salesman_id) : undefined;
      const salesmanName = salesmanInfo?.salesman_name || "Unassigned";

      const divisionName = salesmanInfo?.division_id
        ? divisionsMap.get(salesmanInfo.division_id) || "General"
        : "General";

      // Match FM netReceivable & outstandingBalance calculation exactly
      const grossAmount = asNumber(inv.gross_amount);
      const discountAmount = asNumber(inv.discount_amount);
      const netReceivable = grossAmount - discountAmount;

      const returnAmount = returnAgg.get(invId) || 0;
      const creditMemos = creditAgg.get(invId) || 0;
      const debitMemos = debitAgg.get(invId) || 0;
      const unfulfilledAmount = unfulfilledAgg.get(invId) || 0;
      const paid = paymentsMap.get(invId) || 0;

      const outstanding = Math.max(0, netReceivable - returnAmount - creditMemos + debitMemos - unfulfilledAmount - paid);

      if (outstanding <= 0.001) continue;

      // Credit terms in days between invoice_date and due_date
      let termDays = 0;
      if (inv.due_date && inv.invoice_date) {
        const invD = new Date(inv.invoice_date);
        const dueD = new Date(inv.due_date);
        if (!isNaN(invD.getTime()) && !isNaN(dueD.getTime())) {
          termDays = Math.max(0, Math.round((dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      let calculatedDueDate: string | null = inv.due_date || null;
      if (inv.dispatch_date) {
        const delD = new Date(inv.dispatch_date);
        if (!isNaN(delD.getTime())) {
          const newDueD = new Date(delD.getTime());
          newDueD.setDate(newDueD.getDate() + termDays);
          calculatedDueDate = newDueD.toISOString();
        }
      }

      let daysOverdue: number | null = null;
      if (calculatedDueDate) {
        const due = new Date(calculatedDueDate);
        if (!isNaN(due.getTime())) {
          due.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      const status = daysOverdue !== null && daysOverdue >= 0 ? "Overdue" : "Due";
      if (arStatusFilter && status !== arStatusFilter) continue;
      if (txStatusFilter && (inv.transaction_status || "").trim() !== txStatusFilter) continue;

      totalReceivable += netReceivable;
      totalOutstanding += outstanding;

      if (inv.transaction_status === "Cancellation Requested") {
        totalPendingCancellation += outstanding;
      }

      salesmanOutstandingMap.set(salesmanName, (salesmanOutstandingMap.get(salesmanName) || 0) + outstanding);

      // Aging bucket assignment (matches FM deriveFilteredAging exactly)
      if (daysOverdue !== null && daysOverdue >= 0 && outstanding > 0) {
        totalOverdue += outstanding;
        overdueCount++;
        overdueDaysSum += daysOverdue;

        if (daysOverdue <= 30) agingData[0].amount += outstanding;
        else if (daysOverdue <= 60) agingData[1].amount += outstanding;
        else if (daysOverdue <= 90) agingData[2].amount += outstanding;
        else agingData[3].amount += outstanding;
      }

      const unpostedAlloc = unpostedInvoiceAllocMap.get(invId) || 0;

      rows.push({
        invoiceId: invId,
        invoiceNo: inv.invoice_no || `INV-${invId}`,
        orderId: inv.order_id || "—",
        customerName: custName,
        customerCode: custCode,
        invoiceDate: inv.invoice_date || "",
        calculatedDueDate: calculatedDueDate || "",
        grossAmount,
        discountAmount,
        netReceivable,
        totalPaid: paid,
        outstandingBalance: outstanding,
        unpostedCollectionAmount: unpostedAlloc,
        daysOverdue,
        branch: typeof inv.branch_id === "object" && inv.branch_id !== null ? inv.branch_id.branch_name || "—" : "—",
        salesman: salesmanName,
        division: divisionName,
        paymentStatus: inv.payment_status || status,
        transactionStatus: inv.transaction_status || "Active",
        arStatus: status,
        isPosted: false,
      });
    }

    const realOutstanding = Math.max(0, totalOutstanding - totalUnposted);
    const avgOverdue = overdueCount > 0 ? Math.round(overdueDaysSum / overdueCount) : 0;

    // Top salesmen chart data
    const salesmanData = Array.from(salesmanOutstandingMap.entries())
      .map(([name, val]) => ({
        name,
        value: val,
        unposted: salesmanUnpostedMap.get(name) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const metrics = {
      totalReceivable,
      totalOutstanding,
      totalUnposted,
      totalOverdue,
      realOutstanding,
      avgOverdue,
      overdueCount,
      invoiceCount: rows.length,
      totalPendingCancellation,
    };

    return NextResponse.json({
      success: true,
      metrics,
      agingData,
      salesmanData,
      rows,
      count: rows.length,
      groupId,
      groupName: group?.group_name || "Accounts Receivable",
    });
  } catch (error: unknown) {
    console.error("[Holdings Accounts Receivable API] Fatal error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
