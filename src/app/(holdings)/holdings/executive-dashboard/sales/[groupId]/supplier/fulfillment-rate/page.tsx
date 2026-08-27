import React, { Suspense } from "react";



import FulfillmentRatePage from "@/modules/holdings/executive-dashboard/supplier-reliability-scorecard/fulfillment-rate/FulfillmentRatePage";
import { ScmFilterProvider } from "@/modules/holdings/executive-dashboard/supplier-reliability-scorecard/fulfillment-rate/providers/ScmFilterProvider";
import FulfillmentRateSkeleton from "@/app/(holdings)/holdings/executive-dashboard/_components/FulfillmentRateSkeleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export default async function Page() {
  // ✅ Next.js 16: cookies() is async




  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">


      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <Suspense fallback={<FulfillmentRateSkeleton />}>
          <ScmFilterProvider>
            <FulfillmentRatePage />
          </ScmFilterProvider>
        </Suspense>
      </main>
    </div>
  );
}
