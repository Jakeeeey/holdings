import { LostCustomerRecord } from "../types";

export function exportLostCustomersCsv(
  data: LostCustomerRecord[],
  filename = "lost_customers.csv"
) {
  if (!data || data.length === 0) return;

  const headers = [
    "Customer Code",
    "Customer Name",
    "Status / Tagging",
    "Days Inactive",
    "Last Sales Date",
    "Total Past Sales",
    "Assigned Salesman",
    "Branch",
    "Contact Number",
    "Email",
  ];

  const rows = data.map((item) => [
    `"${(item.customerCode || "").replace(/"/g, '""')}"`,
    `"${(item.customerName || "").replace(/"/g, '""')}"`,
    `"${(item.tagging || "").replace(/"/g, '""')}"`,
    item.minDaysNoSales,
    `"${(item.lastSalesDate || "").replace(/"/g, '""')}"`,
    item.totalHistoricalSales,
    `"${(item.salesmanName || "").replace(/"/g, '""')}"`,
    `"${(item.branchName || "").replace(/"/g, '""')}"`,
    `"${(item.contactNumber || "").replace(/"/g, '""')}"`,
    `"${(item.email || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
