"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useConferenceRoomRequest } from "../hooks/useConferenceRoomRequest";
import { ConferenceRoomRequestInput } from "../types/conference-room-request.schema";
import { ConferenceRoomInput } from "../../conference-room/types/conference-room.schema";

interface ConferenceRoomRequestContextProps {
  requests: ConferenceRoomRequestInput[];
  rooms: ConferenceRoomInput[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  submitRequest: (payload: ConferenceRoomRequestInput) => Promise<any>;
}

const ConferenceRoomRequestContext = createContext<ConferenceRoomRequestContextProps | undefined>(undefined);

export const ConferenceRoomRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const requestHook = useConferenceRoomRequest();

  return (
    <ConferenceRoomRequestContext.Provider value={requestHook}>
      {children}
    </ConferenceRoomRequestContext.Provider>
  );
};

export const useConferenceRoomRequestContext = () => {
  const context = useContext(ConferenceRoomRequestContext);
  if (context === undefined) {
    throw new Error("useConferenceRoomRequestContext must be used within a ConferenceRoomRequestProvider");
  }
  return context;
};
