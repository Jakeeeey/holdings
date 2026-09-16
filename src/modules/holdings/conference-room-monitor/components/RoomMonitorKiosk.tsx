"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO, isWithinInterval, isToday, isAfter } from "date-fns";
import { useRoomMonitor } from "../hooks/useRoomMonitor";
import { Clock, MapPin, Calendar as CalendarIcon, User } from "lucide-react";

interface RoomMonitorKioskProps {
  roomId: number;
}

export const RoomMonitorKiosk: React.FC<RoomMonitorKioskProps> = ({ roomId }) => {
  const { requests, room, isLoading, error } = useRoomMonitor(roomId);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current status
  const currentMeeting = useMemo(() => {
    if (!requests) return null;
    return requests.find(req => {
      if (!req.start_time || !req.end_time) return false;
      return isWithinInterval(currentTime, {
        start: parseISO(req.start_time),
        end: parseISO(req.end_time)
      });
    }) || null;
  }, [requests, currentTime]);

  const isOccupied = !!currentMeeting;

  // Get upcoming meetings for today
  const upcomingMeetings = useMemo(() => {
    if (!requests) return [];
    return requests
      .filter(req => {
        if (!req.start_time) return false;
        const start = parseISO(req.start_time);
        return isToday(start) && isAfter(start, currentTime);
      })
      .sort((a, b) => parseISO(a.start_time!).getTime() - parseISO(b.start_time!).getTime());
  }, [requests, currentTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-white rounded-full animate-spin" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-300">Initializing Monitor...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center text-white p-12 text-center">
        <div>
          <h1 className="text-6xl font-bold mb-4">Connection Error</h1>
          <p className="text-2xl text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white overflow-hidden selection:bg-transparent cursor-none">
      {/* Top Header - Room Name & Live Clock */}
      <div className="h-32 px-12 flex items-center justify-between border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-6">
          <div className="bg-white/10 p-4 rounded-2xl">
            <MapPin className="w-12 h-12 text-blue-400" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight">{room?.name || `Conference Room ${roomId}`}</h1>
            <p className="text-2xl text-slate-400 font-medium mt-1">Live Schedule Monitor</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <h2 className="text-6xl font-bold font-mono tracking-tighter">
            {format(currentTime, "h:mm:ss a")}
          </h2>
          <p className="text-2xl text-slate-400 font-medium mt-2">
            {format(currentTime, "EEEE, MMMM do, yyyy")}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        
        {/* Left Side: Massive Status Indicator */}
        <div className={`flex-1 flex flex-col items-center justify-center p-12 transition-colors duration-1000 ${isOccupied ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
          <div className={`text-9xl mb-8 transition-transform duration-1000 ${isOccupied ? 'scale-110' : 'scale-100'}`}>
            {isOccupied ? '🛑' : '✨'}
          </div>
          
          <h1 className={`text-[8rem] font-black tracking-tighter uppercase leading-none mb-6 ${isOccupied ? 'text-red-500' : 'text-emerald-500'}`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </h1>
          
          <p className="text-4xl text-slate-300 font-medium">
            {isOccupied 
              ? 'Please do not disturb' 
              : 'Available for walk-ins or scheduled meetings'}
          </p>

          {/* Current Meeting Details (If Occupied) */}
          {currentMeeting && (
            <div className="mt-16 w-full max-w-4xl bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 text-red-400 mb-6 font-bold uppercase tracking-widest text-xl">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                Current Meeting
              </div>
              <h2 className="text-5xl font-bold mb-6 leading-tight">{currentMeeting.title}</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4 text-2xl text-slate-300">
                  <Clock className="w-8 h-8 text-slate-400" />
                  {format(parseISO(currentMeeting.start_time!), "h:mm a")} - {format(parseISO(currentMeeting.end_time!), "h:mm a")}
                </div>
                {currentMeeting.requested_by_name && (
                  <div className="flex items-center gap-4 text-2xl text-slate-300">
                    <User className="w-8 h-8 text-slate-400" />
                    {currentMeeting.requested_by_name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Upcoming Schedule */}
        <div className="w-[600px] border-l border-white/10 bg-slate-900/30 flex flex-col">
          <div className="p-10 border-b border-white/10">
            <h3 className="text-3xl font-bold flex items-center gap-4">
              <CalendarIcon className="w-8 h-8 text-blue-400" />
              Upcoming Today
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto p-10 flex flex-col gap-6 custom-scrollbar">
            {upcomingMeetings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
                <CalendarIcon className="w-24 h-24 mb-6" />
                <p className="text-2xl font-medium">No more meetings today</p>
              </div>
            ) : (
              upcomingMeetings.map((req) => (
                <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500/50" />
                  <h4 className="text-2xl font-bold text-white">{req.title}</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-xl text-slate-400">
                      <Clock className="w-5 h-5" />
                      {format(parseISO(req.start_time!), "h:mm a")} - {format(parseISO(req.end_time!), "h:mm a")}
                    </div>
                    {req.requested_by_name && (
                      <div className="flex items-center gap-3 text-xl text-slate-400">
                        <User className="w-5 h-5" />
                        {req.requested_by_name}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
