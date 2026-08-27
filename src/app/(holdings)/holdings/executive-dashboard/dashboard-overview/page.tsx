

// ✅ Wire the module you asked for
import ComingSoon from "../../_components/ComingSoon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function Page() {
    // ✅ Next.js 16: cookies() is async




    return (
        // ✅ This fills the RIGHT column provided by SidebarInset (which is now fixed-height).
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* ✅ Topbar is fixed in place because ONLY <main> scrolls */}


            {/* ✅ Only content scrolls inside RIGHT column */}
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4">
                <ComingSoon />
            </main>
        </div>
    );
}
