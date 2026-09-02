import React from "react";
import { TopHeader } from "./_components/top-header";

export default function ConferenceRoomsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopHeader />
      {children}
    </>
  );
}
