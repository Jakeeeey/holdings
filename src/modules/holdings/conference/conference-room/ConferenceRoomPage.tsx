import React from "react";
import { ConferenceRoomProvider } from "./providers/ConferenceRoomProvider";
import { ConferenceRoomTable } from "./components/ConferenceRoomTable";

export default function ConferenceRoomPage() {
  return (
    <ConferenceRoomProvider>
      <div className="p-6">
        <ConferenceRoomTable />
      </div>
    </ConferenceRoomProvider>
  );
}
