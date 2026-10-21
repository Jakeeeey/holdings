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

    const baseFilter = [
      "filter[payment_status][_nin]=Paid,Fully Paid,Void,VOID",
      "filter[_or][0][isPosted][_null]=true",
      "filter[_or][1][isPosted][_eq]=false",
      "filter[_and][0][_or][0][transaction_status][_nin]=Cancelled,CANCELLED,Void,VOID,void",
      "filter[_and][0][_or][1][transaction_status][_null]=true",
    ].join("&");

    let invoiceUrl = `${directusUrl}/items/sales_invoice?${baseFilter}&limit=5000&fields=${invoiceFields}&sort=-invoice_date,-invoice_id`;
    if (dateFrom && dateTo && dateFrom !== "2020-01-01") {
      invoiceUrl += `&filter[invoice_date][_between]=[${dateFrom},${dateTo}]`;
    }

    // 1. Fetch invoices and lookups in parallel
    const [invRes, colRes, colInvRes, custRes, salesRes, divRes, payRes] = await Promise.allSettled([
      fetch(invoiceUrl, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/collection?limit=2000&fields=id,salesman_id,totalAmount&filter[isPosted][_neq]=true&filter[isCancelled][_neq]=true`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/collection_invoices?limit=5000&fields=collection_id,invoice_id,amount`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/customer?fields=customer_code,customer_name&limit=3000`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/salesman?fields=id,salesman_name,division_id&limit=500`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/division?fields=division_id,division_name&limit=200`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/sales_invoice_payments?fields=invoice_id,paid_amount&limit=5000`, { headers, cache: "no-store" }),
    ]);

    let invoices: DirectusInvoice[] = [];
    if (invRes.status === "fulfilled" && invRes.value.ok) {
      const invData = await invRes.value.json();
      invoices = invData.data || [];
    }

    const unpostedCollections: DirectusCollection[] =
      colRes.status === "fulfilled" && colRes.value.ok ? (await colRes.value.json()).data || [] : [];

    const collectionInvoices: DirectusCollectionInvoice[] =
      colInvRes.status === "fulfilled" && colInvRes.value.ok ? (await colInvRes.value.json()).data || [] : [];

    const customersMap = new Map<string, string>();
    if (custRes.status === "fulfilled" && custRes.value.ok) {
      const cData = (await custRes.value.json()).data || [];
      cData.forEach((c: DirectusCustomer) => {
        if (c.customer_code) customersMap.set(c.customer_code.trim(), c.customer_name);
      });
    }

    const salesmenMap = new Map<number, DirectusSalesman>();
    if (salesRes.status === "fulfilled" && salesRes.value.ok) {
      const sData = (await salesRes.value.json()).data || [];
      sData.forEach((s: DirectusSalesman) => {
        if (s.id) salesmenMap.set(s.id, s);
      });
    }

    const divisionsMap = new Map<number, string>();
    if (divRes.status === "fulfilled" && divRes.value.ok) {
      const dData = (await divRes.value.json()).data || [];
      dData.forEach((d: DirectusDivision) => {
        if (d.division_id) divisionsMap.set(d.division_id, d.division_name);
      });
    }

    const paymentsMap = new Map<number, number>();
    if (payRes.status === "fulfilled" && payRes.value.ok) {
      const pData = (await payRes.value.json()).data || [];
      pData.forEach((p: DirectusPayment) => {
        if (p.invoice_id) {
          const cur = paymentsMap.get(p.invoice_id) || 0;
          paymentsMap.set(p.invoice_id, cur + asNumber(p.paid_amount));
        }
      });
    }

    // Unposted collections pool & salesman map
    const unpostedPouchIds = new Set(unpostedCollections.map((c) => c.id));
    let totalUnposted = 0;
    const salesmanUnpostedMap = new Map<number, number>();

    for (const c of unpostedCollections) {
      const amt = asNumber(c.totalAmount);
      totalUnposted += amt;
      if (c.salesman_id) {
        const cur = salesmanUnpostedMap.get(c.salesman_id) || 0;
        salesmanUnpostedMap.set(c.salesman_id, cur + amt);
      }
    }

    // Invoice-level unposted allocation
    const unpostedInvoiceAllocMap = new Map<number, number>();
    for (const ci of collectionInvoices) {
      if (ci.collection_id && unpostedPouchIds.has(ci.collection_id) && ci.invoice_id) {
        const cur = unpostedInvoiceAllocMap.get(ci.invoice_id) || 0;
        unpostedInvoiceAllocMap.set(ci.invoice_id, cur + asNumber(ci.amount));
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

    const salesmanOutstandingMap = new Map<number, number>();
    const rows = [];

    for (const inv of invoices) {
      if (parseBit(inv.isPosted)) continue;

      const txStatus = (inv.transaction_status || "").trim().toUpperCase();
      const payStatus = (inv.payment_status || "").trim().toUpperCase();
      if (
        txStatus === "CANCELLED" ||
        txStatus === "VOID" ||
        txStatus === "VOIDED" ||
        payStatus === "VOID" ||
        payStatus === "VOIDED"
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

      const totalAmt = asNumber(inv.total_amount ?? inv.net_amount ?? inv.gross_amount);
      const discount = asNumber(inv.discount_amount);
      const netReceivable = Math.max(0, totalAmt - discount);

      const paid = paymentsMap.get(invId) || 0;
      const outstanding = Math.max(0, netReceivable - paid);

      if (outstanding <= 0.01) continue;

      totalReceivable += netReceivable;
      totalOutstanding += outstanding;

      if (inv.transaction_status === "Cancellation Requested") {
        totalPendingCancellation += outstanding;
      }

      if (inv.salesman_id) {
        const cur = salesmanOutstandingMap.get(inv.salesman_id) || 0;
        salesmanOutstandingMap.set(inv.salesman_id, cur + outstanding);
      }

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

      // Aging bucket assignment
      if (daysOverdue !== null && daysOverdue >= 0) {
        totalOverdue += outstanding;
        overdueCount++;
        overdueDaysSum += daysOverdue;

        if (daysOverdue <= 30) agingData[0].amount += outstanding;
        else if (daysOverdue <= 60) agingData[1].amount += outstanding;
        else if (daysOverdue <= 90) agingData[2].amount += outstanding;
        else agingData[3].amount += outstanding;
      } else {
        agingData[0].amount += outstanding; // Current / not yet overdue
      }

      const status = daysOverdue !== null && daysOverdue > 0 ? "Overdue" : "Due";
      const unpostedAlloc = unpostedInvoiceAllocMap.get(invId) || 0;

      rows.push({
        invoiceId: invId,
        invoiceNo: inv.invoice_no || `INV-${invId}`,
        orderId: inv.order_id || "—",
        customerName: custName,
        customerCode: custCode,
        invoiceDate: inv.invoice_date || "",
        calculatedDueDate: calculatedDueDate || "",
        grossAmount: totalAmt,
        discountAmount: discount,
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
      .map(([sId, val]) => ({
        name: salesmenMap.get(sId)?.salesman_name || `Salesman #${sId}`,
        value: val,
        unposted: salesmanUnpostedMap.get(sId) || 0,
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
