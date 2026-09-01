"use client";
import React, { useState, useMemo } from "react";
import { useConferenceRoomRequestContext } from "../providers/ConferenceRoomRequestProvider";
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, parseISO, addHours, startOfDay, setHours } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ConferenceRoomCalendar: React.FC = () => {
  const { allRequests, rooms, isLoading } = useConferenceRoomRequestContext();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");

  // Filter requests based on selected room
  const filteredRequests = useMemo(() => {
    if (selectedRoomId === "all") return allRequests;
    return allRequests.filter(req => req.room_id === Number(selectedRoomId));
  }, [allRequests, selectedRoomId]);

  // Generate the 7 days of the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Calendar configuration
  const START_HOUR = 7; // 7 AM
  const END_HOUR = 19; // 7 PM
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading Calendar Data...</div>;
  }

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <Card className="shadow-xl shadow-black/10 border-border/60 overflow-hidden bg-background rounded-2xl flex flex-col">
      <CardHeader className="bg-slate-900 text-white border-b border-border/40 pb-5 px-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl text-white shadow-inner">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Availability Calendar</CardTitle>
              <p className="text-slate-300 text-sm mt-1">View weekly schedules for all global conference rooms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="w-[220px] bg-white/10 border-white/20 text-white focus:ring-white/30 h-10">
                <SelectValue placeholder="All Conference Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conference Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={String(room.id)}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={handlePrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="h-8 px-3 text-white hover:bg-white/20 hover:text-white text-xs font-semibold uppercase tracking-wider" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-auto flex-1 max-h-[700px] custom-scrollbar">
        <div className="min-w-[800px] flex flex-col relative">
          
          {/* Header Row (Days of the week) */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] sticky top-0 bg-slate-50 border-b border-slate-200 z-30">
            <div className="border-r border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-wider h-14">
              Time
            </div>
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={idx} className={`border-r border-slate-200 flex flex-col items-center justify-center h-14 ${isToday ? 'bg-blue-50/80' : 'bg-slate-50'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-base font-bold mt-0.5 ${isToday ? 'text-blue-700 bg-blue-100/50 px-2 rounded-md' : 'text-slate-900'}`}>
                    {format(day, 'MMM d')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div className="flex flex-1 relative bg-white">
            {/* Time Label Column */}
            <div className="w-[80px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/50 z-20">
              {hours.map((hour) => (
                <div key={`time-${hour}`} className="border-b border-slate-200 flex items-start justify-center py-2 text-xs font-semibold text-slate-500 h-24">
                  {format(setHours(new Date(), hour), 'h a')}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
              {weekDays.map((day, dayIdx) => {
                // Find requests for this day
                const dayRequests = filteredRequests.filter(req => {
                  if (!req.start_time) return false;
                  return isSameDay(parseISO(req.start_time), day);
                });

                return (
                  <div key={`day-${dayIdx}`} className="border-r border-slate-100 relative group">
                    {/* Background Grid Lines (1 hour = h-24 = 96px) */}
                    {hours.map((hour) => (
                      <div key={`grid-${hour}`} className="h-24 border-b border-slate-100 w-full hover:bg-slate-50 transition-colors" />
                    ))}

                    {/* Bookings for the day */}
                    {dayRequests.map(req => {
                      if (!req.start_time || !req.end_time) return null;
                      
                      const start = parseISO(req.start_time);
                      const end = parseISO(req.end_time);
                      
                      // Calculate fractional hours
                      const startH = start.getHours() + start.getMinutes() / 60;
                      const endH = end.getHours() + end.getMinutes() / 60;
                      
                      // Filter out events completely outside the visible hours
                      if (endH <= START_HOUR || startH >= END_HOUR + 1) return null;
                      
                      // Clamp to visible hours
                      const visibleStartH = Math.max(startH, START_HOUR);
                      const visibleEndH = Math.min(endH, END_HOUR + 1);
                      
                      // 96px per hour
                      const top = (visibleStartH - START_HOUR) * 96;
                      const height = (visibleEndH - visibleStartH) * 96;

                      const room = rooms.find(r => r.id === req.room_id);
                      const isApproved = req.status.toLowerCase() === 'approved';

                      return (
                        <div 
                          key={req.id}
                          className="absolute left-1 right-1 px-2 py-1.5 rounded-md border text-xs shadow-sm flex flex-col z-10 transition-transform hover:scale-[1.02] cursor-pointer overflow-hidden"
                          style={{
                            top: `${top + 2}px`, // +2px for padding
                            height: `${Math.max(height - 4, 20)}px`, // -4px for padding, min 20px
                            backgroundColor: isApproved ? '#ecfdf5' : '#fffbeb', // emerald-50 / amber-50
                            borderColor: isApproved ? '#a7f3d0' : '#fde68a', // emerald-200 / amber-200
                            color: isApproved ? '#065f46' : '#92400e', // emerald-800 / amber-800
                          }}
                          title={`${req.title}\n${room?.name}\n${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`}
                        >
                          <span className="font-bold truncate block">{req.title}</span>
                          <div className="flex items-center gap-1 mt-0.5 opacity-80 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{room?.name || `Room #${req.room_id}`}</span>
                          </div>
                          <div className="mt-auto text-[10px] font-medium opacity-70">
                            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
