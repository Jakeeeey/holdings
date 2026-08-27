import React from "react";
import { ExecutiveDashboardProvider } from "@/modules/holdings/executive-dashboard/providers/ExecutiveDashboardProvider";
import { TopHeader } from "./_components/top-header";

export default function ExecutiveDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExecutiveDashboardProvider>
      <TopHeader />
      {children}
    </ExecutiveDashboardProvider>
  );
}
