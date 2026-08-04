import React from "react";
import { SubsidiaryProvider } from "@/modules/holdings/management/subsidiary-management/providers/SubsidiaryProvider";
import { SubsidiaryPage } from "@/modules/holdings/management/subsidiary-management/SubsidiaryPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subsidiary Management",
  description: "Manage subsidiaries in the organization",
};

export default function SubsidiaryManagementRoute() {
  return (
    <SubsidiaryProvider>
      <SubsidiaryPage />
    </SubsidiaryProvider>
  );
}
