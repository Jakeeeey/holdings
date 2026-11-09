import React from "react";
import { ChevronRight } from "lucide-react";
import { GrossMarginModule } from "@/modules/holdings/executive-dashboard/gross-margin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GrossMarginPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return (
    <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 text-foreground">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Breadcrumbs */}
          <div className="space-y-2 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] uppercase font-black tracking-[0.2em]">
              <span>Holdings Intelligence</span> <ChevronRight className="h-3 w-3" />
              <span>Executive Dashboard</span> <ChevronRight className="h-3 w-3" />
              <span>Distribution</span> <ChevronRight className="h-3 w-3" />
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                Gross Margin & Profitability
              </span>
            </div>
          </div>

          <GrossMarginModule groupId={groupId} />
        </div>
      </main>
    </div>
  );
}

