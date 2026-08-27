import React from "react";
import { ExecutiveDashboardProvider } from "@/components/providers/ExecutiveDashboardProvider";

export default function ExecutiveDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExecutiveDashboardProvider>
      {children}
    </ExecutiveDashboardProvider>
  );
}
