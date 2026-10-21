import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DirectusInvoice {
  invoice_id?: number;
  id?: number;
  invoice_no?: string;
  order_id?: string | null;
  customer_code?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
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
  salesman_code?: string | null;
  division_id?: number | null;
}

interface DirectusDivision {
  division_id: number;
  division_name: string;
}

interface DirectusPayment {
  invoice_id?: number;
  paid_amount?: number | null;
  amount?: number | null;
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
      ) || groups[0]
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 1. Fetch sales invoices
    const invoiceFields = [
      "invoice_id",
      "id",
      "invoice_no",
      "order_id",
      "customer_code",
      "invoice_date",
      "due_date",
      "gross_amount",
      "discount_amount",
      "isPosted",
      "salesman_id",
      "branch_id",
      "dispatch_date",
      "payment_status",
      "transaction_status",
    ].join(",");

    let invoiceUrl = `${directusUrl}/items/sales_invoices?fields=${invoiceFields}&limit=1000&sort=-invoice_date,-invoice_id`;
    if (startDate && endDate) {
      invoiceUrl += `&filter[invoice_date][_between]=[${startDate},${endDate}]`;
    }

    let invoices: DirectusInvoice[] = [];
    try {
      const invRes = await fetch(invoiceUrl, { headers, cache: "no-store" });
      if (invRes.ok) {
        const invData = await invRes.json();
        invoices = invData.data || [];
      } else {
        // Fallback without sort or filter
        const fallbackUrl = `${directusUrl}/items/sales_invoices?fields=${invoiceFields}&limit=500`;
        const fbRes = await fetch(fallbackUrl, { headers, cache: "no-store" });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          invoices = fbData.data || [];
        }
      }
    } catch (e) {
      console.warn("[AR Route] sales_invoices fetch error:", e);
    }

    // 2. Fetch lookups in parallel
    const [customersRes, salesmenRes, divisionsRes, paymentsRes] = await Promise.allSettled([
      fetch(`${directusUrl}/items/customers?fields=customer_code,customer_name&limit=2000`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/salesman?fields=id,salesman_name,salesman_code,division_id&limit=500`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/division?fields=division_id,division_name&limit=200`, { headers, cache: "no-store" }),
      fetch(`${directusUrl}/items/sales_invoice_payment?fields=invoice_id,paid_amount,amount&limit=2000`, { headers, cache: "no-store" }),
    ]);

    const customersMap = new Map<string, string>();
    if (customersRes.status === "fulfilled" && customersRes.value.ok) {
      try {
        const cJson = await customersRes.value.json();
        (cJson.data || []).forEach((c: DirectusCustomer) => {
          if (c.customer_code) customersMap.set(c.customer_code, c.customer_name);
        });
      } catch {}
    }

    const salesmenMap = new Map<number, DirectusSalesman>();
    if (salesmenRes.status === "fulfilled" && salesmenRes.value.ok) {
      try {
        const sJson = await salesmenRes.value.json();
        (sJson.data || []).forEach((s: DirectusSalesman) => {
          if (s.id) salesmenMap.set(s.id, s);
        });
      } catch {}
    }

    const divisionsMap = new Map<number, string>();
    if (divisionsRes.status === "fulfilled" && divisionsRes.value.ok) {
      try {
        const dJson = await divisionsRes.value.json();
        (dJson.data || []).forEach((d: DirectusDivision) => {
          if (d.division_id) divisionsMap.set(d.division_id, d.division_name);
        });
      } catch {}
    }

    const paymentsMap = new Map<number, number>();
    if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
      try {
        const pJson = await paymentsRes.value.json();
        (pJson.data || []).forEach((p: DirectusPayment) => {
          const invId = p.invoice_id;
          if (invId) {
            const current = paymentsMap.get(invId) || 0;
            const amt = asNumber(p.paid_amount ?? p.amount ?? 0);
            paymentsMap.set(invId, current + amt);
          }
        });
      } catch {}
    }

    // 3. Assemble unified AR Rows
    const rows = invoices.map((inv) => {
      const invId = inv.invoice_id ?? inv.id ?? 0;
      const custCode = inv.customer_code || "";
      const custName = customersMap.get(custCode) || custCode || "Unknown Customer";

      const salesmanInfo = inv.salesman_id ? salesmenMap.get(inv.salesman_id) : undefined;
      const salesmanName = salesmanInfo?.salesman_name || "Unassigned";

      const divisionName = salesmanInfo?.division_id
        ? divisionsMap.get(salesmanInfo.division_id) || "General"
        : "General";

      const gross = asNumber(inv.gross_amount);
      const discount = asNumber(inv.discount_amount);
      const netReceivable = Math.max(0, gross - discount);

      const paid = paymentsMap.get(invId) || 0;
      const outstanding = Math.max(0, netReceivable - paid);

      const dueDate = inv.due_date || null;
      let daysOverdue: number | null = null;
      if (dueDate) {
        const due = new Date(dueDate);
        if (!isNaN(due.getTime())) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          due.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      let status = "Due";
      if (outstanding <= 0.01) {
        status = "Paid";
      } else if (daysOverdue !== null && daysOverdue > 0) {
        status = "Overdue";
      }

      const branchName =
        typeof inv.branch_id === "object" && inv.branch_id !== null
          ? inv.branch_id.branch_name || "—"
          : "—";

      return {
        invoiceId: invId,
        invoiceNo: inv.invoice_no || `INV-${invId}`,
        orderId: inv.order_id || "—",
        customerName: custName,
        customerCode: custCode,
        invoiceDate: inv.invoice_date || "",
        calculatedDueDate: dueDate || "",
        grossAmount: gross,
        discountAmount: discount,
        netReceivable,
        totalPaid: paid,
        outstandingBalance: outstanding,
        daysOverdue,
        branch: branchName,
        salesman: salesmanName,
        division: divisionName,
        paymentStatus: inv.payment_status || status,
        transactionStatus: inv.transaction_status || "Active",
        arStatus: status,
        isPosted: Boolean(inv.isPosted),
      };
    });

    return NextResponse.json({
      success: true,
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
