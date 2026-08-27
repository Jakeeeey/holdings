"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useExecutiveDashboard } from "@/modules/holdings/executive-dashboard/hooks/useExecutiveDashboard";

type DashboardContextType = ReturnType<typeof useExecutiveDashboard>;

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function ExecutiveDashboardProvider({ children }: { children: ReactNode }) {
  const dashboard = useExecutiveDashboard();

  return (
    <DashboardContext.Provider value={dashboard}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardContext must be used within an ExecutiveDashboardProvider");
  }
  return context;
}
