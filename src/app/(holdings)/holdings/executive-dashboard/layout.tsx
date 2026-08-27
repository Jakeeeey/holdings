import React from "react";
import { ExecutiveDashboardProvider } from "@/modules/holdings/executive-dashboard/providers/ExecutiveDashboardProvider";

export default function ExecutiveDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExecutiveDashboardProvider>
      {children}
    </ExecutiveDashboardProvider>
  );
}
