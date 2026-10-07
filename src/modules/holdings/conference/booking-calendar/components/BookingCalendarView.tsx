"use client";

import React, { useState, useMemo } from "react";
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  setHours
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useBookingCalendar } from "../hooks/useBookingCalendar";
import { ConferenceRoomRequestInput } from "../../conference-room-request/types/conference-room-request.schema";

type ViewMode = "month" | "week" | "day";

export const BookingCalendarView: React.FC = () => {
  const { requests, rooms, isLoading, error } = useBookingCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ConferenceRoomRequestInput | null>(null);

  const navigateNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const navigatePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const filteredRequests = useMemo(() => {
    if (selectedRoomId === "all") return requests;
    return requests.filter(req => req.room_id === Number(selectedRoomId));
  }, [requests, selectedRoomId]);

  const daysInGrid = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === "week") {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      return [currentDate];
    }
  }, [currentDate, viewMode]);

  const currentDisplayDate = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM d, yyyy");
  }, [currentDate, viewMode]);

  const START_HOUR = 7; // 7 AM
  const END_HOUR = 19; // 7 PM
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/60">
        <div className="h-[600px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse">
            <CalendarIcon className="w-10 h-10" />
            <p className="font-medium">Loading Calendar Data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-border/60">
        <div className="h-[600px] flex items-center justify-center">
          <div className="text-center p-6 bg-red-50 text-red-600 rounded-xl max-w-md">
            <h3 className="font-bold text-lg mb-2">Error Loading Calendar</h3>
            <p>{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/60 overflow-hidden bg-background flex flex-col h-full min-h-[800px]">
      <CardHeader className="bg-slate-900 text-white border-b border-border/40 pb-5 px-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl text-white shadow-inner">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Booking Calendar</CardTitle>
              <p className="text-slate-300 text-sm mt-1">Manage all conference room schedules</p>
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
            <div className="flex bg-white/10 rounded-lg p-1 border border-white/10 text-white">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode("day")}
                className={`h-8 px-3 text-sm font-medium ${viewMode === "day" ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Day
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode("week")}
                className={`h-8 px-3 text-sm font-medium ${viewMode === "week" ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Week
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode("month")}
                className={`h-8 px-3 text-sm font-medium ${viewMode === "month" ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Month
              </Button>
            </div>
            <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={navigatePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="h-8 px-3 text-white hover:bg-white/20 hover:text-white text-sm font-semibold tracking-wide min-w-[140px]" onClick={goToToday}>
                {currentDisplayDate}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={navigateNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {viewMode === "month" ? (
          <>
            <div className={`grid grid-cols-7 border-b border-slate-200 bg-white shadow-sm z-10`}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className={`flex-1 grid grid-cols-7 grid-rows-5 bg-slate-200 gap-px`}>
              {daysInGrid.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                
                // Find requests for this day
                const dayRequests = filteredRequests.filter(req => {
                  if (!req.start_time) return false;
                  return isSameDay(parseISO(req.start_time), day);
                }).sort((a, b) => parseISO(a.start_time!).getTime() - parseISO(b.start_time!).getTime());

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[120px] bg-white p-2 flex flex-col transition-colors hover:bg-slate-50/80 ${!isCurrentMonth ? 'opacity-40 bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isDayToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayRequests.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400">{dayRequests.length} meetings</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                      {dayRequests.map(req => {
                        const room = rooms.find(r => r.id === req.room_id);
                        const isApproved = req.status.toLowerCase() === 'approved';
                        
                        return (
                          <div 
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`text-xs px-2 py-1.5 rounded-md border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] ${
                              isApproved 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                          >
                            <div className="font-bold truncate">{req.title}</div>
                            <div className="flex items-center justify-between mt-1 opacity-80">
                              <span className="text-[10px]">{format(parseISO(req.start_time!), 'h:mm a')}</span>
                              <span className="text-[10px] truncate max-w-[60px]">{room?.name || `Room ${req.room_id}`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto max-h-[700px] custom-scrollbar">
            <div className={`min-w-[${viewMode === 'week' ? '800px' : '100%'}] flex flex-col relative`}>
              
              {/* Header Row (Days of the week or single day) */}
              <div className={`grid ${viewMode === 'week' ? 'grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]' : 'grid-cols-[80px_1fr]'} sticky top-0 bg-slate-50 border-b border-slate-200 z-30`}>
                <div className="border-r border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-wider h-14">
                  Time
                </div>
                {daysInGrid.map((day, idx) => {
                  const isDayToday = isSameDay(day, new Date());
                  return (
                    <div key={idx} className={`border-r border-slate-200 flex flex-col items-center justify-center h-14 ${isDayToday ? 'bg-blue-50/80' : 'bg-slate-50'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDayToday ? 'text-blue-600' : 'text-slate-500'}`}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-base font-bold mt-0.5 ${isDayToday ? 'text-blue-700 bg-blue-100/50 px-2 rounded-md' : 'text-slate-900'}`}>
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
                <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} relative`}>
                  {daysInGrid.map((day, dayIdx) => {
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
                          
                          const startH = start.getHours() + start.getMinutes() / 60;
                          const endH = end.getHours() + end.getMinutes() / 60;
                          
                          if (endH <= START_HOUR || startH >= END_HOUR + 1) return null;
                          
                          const visibleStartH = Math.max(startH, START_HOUR);
                          const visibleEndH = Math.min(endH, END_HOUR + 1);
                          
                          const top = (visibleStartH - START_HOUR) * 96;
                          const height = (visibleEndH - visibleStartH) * 96;

                          const room = rooms.find(r => r.id === req.room_id);
                          const isApproved = req.status.toLowerCase() === 'approved';

                          return (
                            <div 
                              key={req.id}
                              className="absolute left-1 right-1 px-2 py-1.5 rounded-md border shadow-sm flex flex-col z-10 transition-transform hover:scale-[1.02] cursor-pointer overflow-hidden"
                              onClick={() => setSelectedRequest(req)}
                              style={{
                                top: `${top + 2}px`,
                                height: `${Math.max(height - 4, 30)}px`,
                                backgroundColor: isApproved ? '#ecfdf5' : '#fffbeb',
                                borderColor: isApproved ? '#a7f3d0' : '#fde68a',
                                color: isApproved ? '#065f46' : '#92400e',
                              }}
                              title={`${req.title}\n${room?.name}\n${req.requested_by_name ? `By: ${req.requested_by_name}\n` : ''}${req.purpose ? `Purpose: ${req.purpose}\n` : ''}${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`}
                            >
                              <span className="font-bold truncate block text-xs">{req.title}</span>
                              <div className="flex items-center gap-1 mt-0.5 opacity-80 truncate text-[10px]">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{room?.name || `Room #${req.room_id}`}</span>
                              </div>
                              {req.requested_by_name && (
                                <div className="text-[10px] opacity-80 mt-0.5 truncate font-medium">
                                  {req.requested_by_name}
                                </div>
                              )}
                              <div className="mt-auto text-[9px] font-medium opacity-70 pt-1">
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
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Detailed information about this conference room booking.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">{selectedRequest.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedRequest.status.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-slate-900">{rooms.find(r => r.id === selectedRequest.room_id)?.name || `Room #${selectedRequest.room_id}`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>
                    {selectedRequest.start_time ? format(parseISO(selectedRequest.start_time), "EEEE, MMM d, yyyy") : ""} <br />
                    {selectedRequest.start_time ? format(parseISO(selectedRequest.start_time), "h:mm a") : ""} - {selectedRequest.end_time ? format(parseISO(selectedRequest.end_time), "h:mm a") : ""}
                  </span>
                </div>
                {selectedRequest.requested_by_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>Requested by {selectedRequest.requested_by_name}</span>
                  </div>
                )}
                {selectedRequest.purpose && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                    <FileText className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <span className="whitespace-pre-wrap">{selectedRequest.purpose}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
