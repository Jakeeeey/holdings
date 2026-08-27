import React from "react";
import { DashboardManagementPage } from "@/modules/holdings/dashboard-management/DashboardManagementPage";

export default function Page() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background">
        <DashboardManagementPage />
      </main>
    </div>
  );
}
