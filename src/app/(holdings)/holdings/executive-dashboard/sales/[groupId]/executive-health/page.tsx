

// ✅ Wire the module you asked for
import { ExecutiveHealthModule } from "@/modules/holdings/executive-dashboard/executive-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
    




    return (
        // ✅ This fills the RIGHT column provided by SidebarInset (which is now fixed-height).
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* ✅ Topbar is fixed in place because ONLY <main> scrolls */}


            {/* ✅ Only content scrolls inside RIGHT column */}
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4">
                <ExecutiveHealthModule groupId={groupId} />
            </main>
        </div>
    );
}
