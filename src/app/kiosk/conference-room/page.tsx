"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Monitor } from "lucide-react";
import { ConferenceRoom } from "@/modules/holdings/conference-room-monitor/hooks/useRoomMonitor";

export default function KioskSelectionPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/holdings/conference-rooms')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setRooms(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="animate-pulse text-slate-500 font-medium">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
          <Monitor className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Setup Kiosk Display</h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          Select the conference room for this digital signage monitor. Once selected, it will enter full-screen kiosk mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {rooms.map((room) => (
          <Card 
            key={room.id} 
            className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group overflow-hidden"
            onClick={() => router.push(`/kiosk/conference-room/${room.id}`)}
          >
            <CardHeader className="bg-slate-900 text-white group-hover:bg-blue-600 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {room.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <Monitor className="w-16 h-16 mx-auto text-slate-200 group-hover:text-blue-100 transition-colors mb-4" />
              <p className="font-semibold text-slate-700">Launch Monitor</p>
              <p className="text-sm text-slate-500 mt-1">Click to enter full-screen schedule display</p>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full text-center p-12 text-slate-500 border-2 border-dashed rounded-xl">
            No conference rooms found in the system.
          </div>
        )}
      </div>
    </div>
  );
}
