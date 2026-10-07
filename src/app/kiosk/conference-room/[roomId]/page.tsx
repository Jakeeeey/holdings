import React from "react";
import { RoomMonitorKiosk } from "@/modules/holdings/conference/conference-room-monitor/components/RoomMonitorKiosk";

export default async function ConferenceRoomMonitorPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params;
  const roomId = parseInt(resolvedParams.roomId, 10);
  
  return (
    <div className="min-h-screen bg-slate-950">
      <RoomMonitorKiosk roomId={roomId} />
    </div>
  );
}
