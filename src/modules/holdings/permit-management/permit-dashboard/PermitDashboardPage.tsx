"use client";

import React from "react";
import { usePermitDashboard } from "./hooks/usePermitDashboard";
import { PermitDashboardHeader } from "./components/PermitDashboardHeader";
import { DashboardStatCards } from "./components/DashboardStatCards";
import { UpcomingExpiryAlerts } from "./components/UpcomingExpiryAlerts";
import { CompanyHealthTable } from "./components/CompanyHealthTable";

export default function PermitDashboardPage() {
  const {
    summary,
    companiesHealth,
    urgentExpiries,
    isLoading,
    searchTerm,
    setSearchTerm,
    healthFilter,
    setHealthFilter,
    refetch,
  } = usePermitDashboard();

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
        onRefresh={refetch}
      />

      <DashboardStatCards
        summary={summary}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
      />
      <UpcomingExpiryAlerts
        urgentPermits={urgentExpiries}
        allCompanyPermits={allCompanyPermits}
      />
      <CompanyHealthTable
        companies={companiesHealth}
        isLoading={isLoading}
      />
    </div>
  );
}
