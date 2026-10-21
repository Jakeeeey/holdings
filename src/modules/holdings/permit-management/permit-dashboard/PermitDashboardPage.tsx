"use client";

import React, { useState } from "react";
import { usePermitDashboard } from "./hooks/usePermitDashboard";
import { PermitDashboardHeader } from "./components/PermitDashboardHeader";
import { DashboardStatCards } from "./components/DashboardStatCards";
import { UpcomingExpiryAlerts } from "./components/UpcomingExpiryAlerts";
import { CompanyHealthTable } from "./components/CompanyHealthTable";
import { SyncCenterDialog } from "@/modules/holdings/permit-management/permit-creation/components/SyncCenterDialog";

export default function PermitDashboardPage() {
  const {
    summary,
    companiesHealth,
    urgentExpiries,
    syncDialogCompanies,
    allPermitsForSync,
    isLoading,
    isSyncing,
    syncingCompanyId,
    syncCompany,
    searchTerm,
    setSearchTerm,
    healthFilter,
    setHealthFilter,
    refetch,
  } = usePermitDashboard();

  // State for Sync Center modal
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  const allCompanyPermits = React.useMemo(() => {
    return companiesHealth.flatMap((c) => [...c.permits, ...c.archived_permits]);
  }, [companiesHealth]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      <PermitDashboardHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        isLoading={isLoading}
        isSyncing={isSyncing}
        onRefresh={refetch}
        onSyncCompanies={() => setIsSyncCenterOpen(true)}
      />

      <DashboardStatCards
        summary={summary}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
      />
      <UpcomingExpiryAlerts
        urgentPermits={urgentExpiries}
        allCompanyPermits={allCompanyPermits}
        onSyncCompany={syncCompany}
        syncingCompanyId={syncingCompanyId}
      />
      <CompanyHealthTable
        companies={companiesHealth}
        isLoading={isLoading}
        onSyncCompany={syncCompany}
        syncingCompanyId={syncingCompanyId}
      />

      {/* Sync Center Dialog */}
      <SyncCenterDialog
        isOpen={isSyncCenterOpen}
        onClose={() => setIsSyncCenterOpen(false)}
        companies={syncDialogCompanies}
        permits={allPermitsForSync}
        onFinishSync={refetch}
      />
    </div>
  );
}
