import React, { Suspense } from "react";




import LeadTimeVariancePage from "@/modules/holdings/executive-dashboard/supplier-reliability-scorecard/lead-time-variance/LeadTimeVariancePage";
import { ScmFilterProvider } from "@/modules/holdings/executive-dashboard/supplier-reliability-scorecard/lead-time-variance/providers/ScmFilterProvider";
import LeadTimeVarianceSkeleton from "@/app/(holdings)/holdings/executive-dashboard/_components/LeadTimeVarianceSkeleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export default async function Page() {
  // ✅ Next.js 16: cookies() is async




  return (
    // ✅ This fills the RIGHT column provided by SidebarInset (which is now fixed-height).
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* ✅ Topbar is fixed in place because ONLY <main> scrolls */}



      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <Suspense fallback={<LeadTimeVarianceSkeleton />}>
          <ScmFilterProvider>
            <LeadTimeVariancePage />
          </ScmFilterProvider>
        </Suspense>
      </main>
    </div>
  );
}
