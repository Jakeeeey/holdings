import React from "react";
import { ChevronRight, Users } from "lucide-react";
import { CustomerSalesPreviewCard } from "../CustomerSalesPreviewCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GroupItem {
  id: number;
  category: string;
  group_name: string;
  [key: string]: unknown;
}

async function getCustomerSalesGroups(): Promise<GroupItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/holdings/dashboard-api-groups?category=sales-by-customer`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const groups: GroupItem[] = await res.json();
      return groups.filter((g) => g.category === "sales-by-customer");
    }
  } catch (e) {
    console.error("Failed to fetch customer sales groups:", e);
  }
  return [];
}

export default async function SalesByCustomerGroupListPage() {
  const groups = await getCustomerSalesGroups();

  return (
    <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 md:p-10 text-foreground">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
                <span>Holdings Intelligence</span> <ChevronRight className="h-3 w-3" />
                <span>Executive Dashboard</span> <ChevronRight className="h-3 w-3" />
                <span>Sales</span> <ChevronRight className="h-3 w-3" />
                <span className="text-primary font-black">Sales by Customer</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                CUSTOMER <span className="text-primary">SALES REPORT</span>
              </h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                Key account volume, customer categorization &amp; revenue contribution across business units
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group) => (
              <CustomerSalesPreviewCard key={group.id} group={group} />
            ))}
          </div>

          {groups.length === 0 && (
            <div className="py-16 text-center text-muted-foreground border border-dashed rounded-2xl border-border/60">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold uppercase tracking-wider text-sm">No Customer Sales Groups Found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Configure dashboard API groups in dashboard management.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
