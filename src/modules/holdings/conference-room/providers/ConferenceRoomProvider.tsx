"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useConferenceRoom } from "../hooks/useConferenceRoom";

type ConferenceRoomContextType = ReturnType<typeof useConferenceRoom>;

const ConferenceRoomContext = createContext<ConferenceRoomContextType | undefined>(undefined);

export const ConferenceRoomProvider = ({ children }: { children: ReactNode }) => {
  const conferenceRoomState = useConferenceRoom();

  return (
    <ConferenceRoomContext.Provider value={conferenceRoomState}>
      {children}
    </ConferenceRoomContext.Provider>
  );
};

export const useConferenceRoomContext = () => {
  const context = useContext(ConferenceRoomContext);
  if (context === undefined) {
    throw new Error("useConferenceRoomContext must be used within a ConferenceRoomProvider");
  }
  return context;
};
