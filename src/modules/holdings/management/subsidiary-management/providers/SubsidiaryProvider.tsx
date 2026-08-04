"use client";

import React, { createContext, useContext } from "react";
import { useSubsidiary } from "../hooks/useSubsidiary";

type SubsidiaryContextType = ReturnType<typeof useSubsidiary>;

const SubsidiaryContext = createContext<SubsidiaryContextType | undefined>(undefined);

export const SubsidiaryProvider = ({ children }: { children: React.ReactNode }) => {
  const subsidiaryData = useSubsidiary();

  return (
    <SubsidiaryContext.Provider value={subsidiaryData}>
      {children}
    </SubsidiaryContext.Provider>
  );
};

export const useSubsidiaryContext = () => {
  const context = useContext(SubsidiaryContext);
  if (context === undefined) {
    throw new Error("useSubsidiaryContext must be used within a SubsidiaryProvider");
  }
  return context;
};
