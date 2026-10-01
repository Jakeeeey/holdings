import React from "react";
import { TopHeader } from "./_components/top-header";

export default function SubsidiaryManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopHeader />
      {children}
    </>
  );
}
