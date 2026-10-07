import React from "react";
import { AreaDrilldownModule } from "@/modules/holdings/executive-dashboard/sales-by-territory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SalesByTerritoryDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4">
                <AreaDrilldownModule groupId={groupId} />
            </main>
        </div>
    );
}
