/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { TaskStatus } from "../type";
import { Loader2, Plus, GripVertical, CheckCircle2, Clock, PlayCircle, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, List as ListIcon, User, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
  differenceInMinutes,
  getHours,
  getMinutes
} from "date-fns";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { Task } from "../type";

export function TaskBoard({ userId }: { userId: string | number }) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { tasks, holidays, isLoading, error, refresh, updateTask, createTask, deleteTask } = useTasks(userId, selectedEmployees);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "calendar" | "list">("calendar");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);

  useEffect(() => {
    fetch('/api/holdings/users')
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) setUsers(data.users);
        else if (Array.isArray(data)) setUsers(data);
        else if (data.data) setUsers(data.data);
      })
      .catch(err => console.error("Failed to fetch users:", err));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (taskId: string | number, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const prevDate = () => {
    if (calendarView === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const nextDate = () => {
    if (calendarView === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const goToToday = () => setCurrentDate(new Date());

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>;
  }

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode; color: string }[] = [
    { title: "Pending", status: "Pending", icon: <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />, color: "bg-white/50 dark:bg-white/5 backdrop-blur-md" },
    { title: "In Progress", status: "In Progress", icon: <PlayCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />, color: "bg-cyan-50/50 dark:bg-cyan-950/20 backdrop-blur-md" },
    { title: "Complete", status: "Complete", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />, color: "bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-md" },
  ];

    const renderCalendarHeader = (startDate: Date, endDate: Date) => (
      <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-wide">
            {calendarView === "month" ? format(currentDate, "MMMM yyyy") : 
             calendarView === "week" ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}` :
             format(currentDate, "MMMM d, yyyy")}
          </h3>
          
          <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-md border border-slate-200 dark:border-white/10 shadow-inner">
            <button onClick={() => setCalendarView("month")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${calendarView === "month" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent"}`}>Month</button>
            <button onClick={() => setCalendarView("week")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${calendarView === "week" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent"}`}>Week</button>
            <button onClick={() => setCalendarView("day")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${calendarView === "day" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent"}`}>Day</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1 text-sm border border-slate-200 dark:border-white/10 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-medium transition-colors">Today</button>
          <div className="flex border border-slate-200 dark:border-white/10 rounded overflow-hidden">
            <button onClick={prevDate} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextDate} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );

    const renderCalendar = () => {
      let startDate: Date, endDate: Date;
      if (calendarView === "month") {
        startDate = startOfWeek(startOfMonth(currentDate));
        endDate = endOfWeek(endOfMonth(currentDate));
      } else {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      }
      const displayDays = 7;
  
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
      let day = startDate;
      const rows = [];
  
      while (day <= endDate) {
        const weekStart = day;
        const weekEnd = addDays(day, displayDays - 1);
  
        // 1. Render background cells for the segment
        const days = [];
        for (let i = 0; i < displayDays; i++) {
          const currentDay = addDays(weekStart, i);
          
          const dayHolidays = holidays?.filter(h => isSameDay(parseISO(h.holiday_date), currentDay)) || [];
          
          days.push(
            <div
              key={currentDay.toString()}
              className={`min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-white/5 ${
                calendarView === "month" && !isSameMonth(currentDay, currentDate)
                  ? "bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-700"
                  : dayHolidays.length > 0 
                  ? "bg-rose-50/50 dark:bg-rose-950/30" 
                  : isToday(currentDay)
                  ? "bg-cyan-50/50 dark:bg-cyan-950/20"
                  : "bg-transparent"
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday(currentDay) ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 w-7 h-7 rounded flex items-center justify-center shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]' : dayHolidays.length > 0 ? 'text-rose-600 dark:text-rose-400 ml-1' : 'text-slate-600 dark:text-slate-400 ml-1'}`}>
                {format(currentDay, "d")}
              </div>
              {dayHolidays.map(h => (
                <div key={h.id} className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 px-1 truncate" title={h.description}>
                  {h.description}
                </div>
              ))}
            </div>
          );
        }
  
        // 2. Find tasks overlapping this week
        const weekTasks = tasks.filter(t => {
          const tStart = t.start_date ? startOfDay(parseISO(t.start_date)) : 
                         t.end_date ? startOfDay(parseISO(t.end_date)) :
                         (t.date_created ? startOfDay(parseISO(t.date_created)) : null);
          const tEnd = t.end_date ? endOfDay(parseISO(t.end_date)) : 
                       t.start_date ? endOfDay(parseISO(t.start_date)) : 
                       (t.date_created ? endOfDay(parseISO(t.date_created)) : null);
          
          if (!tStart || !tEnd) return false;
          // Overlaps if task start is before week end AND task end is after week start
          return tStart <= endOfDay(weekEnd) && tEnd >= startOfDay(weekStart);
        });
  
        // Sort tasks by start date, then duration (longer first)
        weekTasks.sort((a, b) => {
          const aStart = a.start_date ? parseISO(a.start_date).getTime() : 0;
          const bStart = b.start_date ? parseISO(b.start_date).getTime() : 0;
          if (aStart === bStart) {
             const aEnd = a.end_date ? parseISO(a.end_date).getTime() : aStart;
             const bEnd = b.end_date ? parseISO(b.end_date).getTime() : bStart;
             return (bEnd - bStart) - (aEnd - aStart);
          }
          return aStart - bStart;
        });
  
        // 3. Assign vertical slots to prevent overlaps within the week row
        const slots: Array<Array<{start: number, end: number}>> = [];
        const taskRenderData = weekTasks.map(t => {
          const tStart = t.start_date ? startOfDay(parseISO(t.start_date)) : 
                         t.end_date ? startOfDay(parseISO(t.end_date)) :
                         (t.date_created ? startOfDay(parseISO(t.date_created)) : new Date());
          const tEnd = t.end_date ? endOfDay(parseISO(t.end_date)) : 
                       t.start_date ? endOfDay(parseISO(t.start_date)) : 
                       (t.date_created ? endOfDay(parseISO(t.date_created)) : new Date());
                       
          // Clamp to week bounds
          const visibleStart = tStart < weekStart ? weekStart : tStart;
          const visibleEnd = tEnd > weekEnd ? weekEnd : tEnd;
  
          // Calculate indices (0-6)
          const startIndex = differenceInCalendarDays(visibleStart, weekStart);
          const endIndex = differenceInCalendarDays(visibleEnd, weekStart);
          const span = endIndex - startIndex + 1;
  
          // Find the first available vertical slot
          let slotIndex = 0;
          while (true) {
            if (!slots[slotIndex]) slots[slotIndex] = [];
            let collision = false;
            for (const occ of slots[slotIndex]) {
              if (!(startIndex > occ.end || endIndex < occ.start)) {
                collision = true;
                break;
              }
            }
            if (!collision) {
              slots[slotIndex].push({ start: startIndex, end: endIndex });
              break;
            }
            slotIndex++;
          }
  
          return { task: t, startIndex, span, slotIndex, tStart, tEnd };
        });
  
        // 4. Render the week row with absolute positioned event bars
        rows.push(
          <div className="grid grid-cols-7 relative" key={weekStart.toString()}>
            {days}
            
            {taskRenderData.map(({ task, startIndex, span, slotIndex, tStart, tEnd }) => {
              const topOffset = 42 + (slotIndex * 26); // 42px below the day number, 26px height per task
              
              // Check if actual dates extend beyond this week to control border radius
              const isStartRounded = tStart >= weekStart;
              const isEndRounded = tEnd <= weekEnd;
  
              let roundedClass = "rounded-md";
              if (!isStartRounded && !isEndRounded) roundedClass = "rounded-none";
              else if (!isStartRounded) roundedClass = "rounded-r-md rounded-l-none border-l-0";
              else if (!isEndRounded) roundedClass = "rounded-l-md rounded-r-none border-r-0";
  
              // Modern solid color bars
              let colorClass = "bg-slate-700 text-white border-slate-800";
              if (task.status === "Complete") colorClass = "bg-emerald-500 text-white border-emerald-600";
              else if (task.status === "In Progress") colorClass = "bg-blue-500 text-white border-blue-600";
              
              // Apply urgent/high priority styling if pending
              if (task.status === "Pending") {
                 if (task.priority === "Urgent") colorClass = "bg-rose-500 text-white border-rose-600";
                 else if (task.priority === "High") colorClass = "bg-orange-500 text-white border-orange-600";
              }

              // Override with custom color if available
              let customStyle: React.CSSProperties = {};
              if (task.color) {
                 colorClass = "text-white";
                 customStyle = { backgroundColor: task.color, borderColor: task.color };
              }
  
              return (
                <div 
                  key={task.id}
                  className={`absolute h-[22px] px-2 text-xs font-semibold flex items-center justify-between shadow-sm border ${colorClass} ${roundedClass} hover:opacity-90 cursor-pointer transition-opacity z-10`}
                  style={{
                    left: `calc(${startIndex} * (100% / ${displayDays}) + 6px)`,
                    width: `calc(${span} * (100% / ${displayDays}) - 12px)`,
                    top: `${topOffset}px`,
                    ...customStyle
                  }}
                  title={task.title}
                  onClick={() => setEditingTask(task)}
                >
                  <span className="truncate flex-1">{task.title}</span>
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex gap-1 ml-2 shrink-0 overflow-hidden">
                      {task.assignees.map((id: any) => {
                         const user = users.find((u: any) => u.user_id?.toString() === id?.toString());
                         const name = user ? `${user.user_fname} ${user.user_lname}` : 'Unknown';
                         return (
                           <span key={id} className="inline-block px-1 rounded bg-white/20 text-[9px] text-white truncate max-w-[70px]">
                             {name}
                           </span>
                         );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
  
        day = addDays(day, displayDays); // Jump by number of days displayed
      }
  
    return (
      <div className="mt-6 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-lg dark:shadow-2xl">
        {renderCalendarHeader(startDate, endDate)}
  
        {/* Days of week */}
        <div className="grid grid-cols-7 bg-white/40 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
          {weekDays.map(wd => (
             <div key={wd} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-white/10 last:border-r-0">
               {wd}
             </div>
          ))}
        </div>
        
        {/* Grid cells */}
        <div className="border-r-0 border-b-0">
          {rows}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);

    const allDayTasks: any[] = [];
    const timedTasks: any[] = [];

    tasks.forEach(t => {
      const tStart = t.start_date ? parseISO(t.start_date) : 
                     t.end_date ? startOfDay(parseISO(t.end_date)) :
                     (t.date_created ? parseISO(t.date_created) : null);
      const tEnd = t.end_date ? parseISO(t.end_date) : 
                   t.start_date ? endOfDay(parseISO(t.start_date)) : 
                   (t.date_created ? endOfDay(parseISO(t.date_created)) : null);
                   
      if (!tStart || !tEnd) return;
      
      if (tStart <= dayEnd && tEnd >= dayStart) {
        const isMultiDay = !isSameDay(tStart, tEnd);
        const startsAtMidnight = getHours(tStart) === 0 && getMinutes(tStart) === 0;
        const endsAtMidnight = getHours(tEnd) === 23 && getMinutes(tEnd) === 59;
        
        if (isMultiDay || (startsAtMidnight && endsAtMidnight)) {
          allDayTasks.push({ task: t, tStart, tEnd });
        } else {
          timedTasks.push({ task: t, tStart, tEnd });
        }
      }
    });

    timedTasks.sort((a, b) => {
      if (a.tStart.getTime() === b.tStart.getTime()) return b.tEnd.getTime() - a.tEnd.getTime();
      return a.tStart.getTime() - b.tStart.getTime();
    });

    const columns: any[][] = [];
    timedTasks.forEach(item => {
      let placed = false;
      for (const col of columns) {
        const overlaps = col.some(existing => {
          return item.tStart < existing.tEnd && item.tEnd > existing.tStart;
        });
        if (!overlaps) {
          col.push(item);
          item.colIndex = columns.indexOf(col);
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.colIndex = columns.length;
        columns.push([item]);
      }
    });
    const numColumns = Math.max(columns.length, 1);

    return (
      <div className="mt-6 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-lg dark:shadow-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur flex flex-col">
        {renderCalendarHeader(dayStart, dayEnd)}

        {/* All-Day Section */}
        {allDayTasks.length > 0 && (
          <div className="flex bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 p-2 max-h-32 overflow-y-auto">
            <div className="w-16 flex-shrink-0 text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-right pr-4 pt-1.5 uppercase tracking-wider">All Day</div>
            <div className="flex-1 flex flex-col gap-1">
              {allDayTasks.map(({ task }) => {
                let colorClass = "bg-slate-700 border-slate-800";
                if (task.status === "Complete") colorClass = "bg-emerald-500 border-emerald-600";
                else if (task.status === "In Progress") colorClass = "bg-blue-500 border-blue-600";
                
                if (task.status === "Pending") {
                   if (task.priority === "Urgent") colorClass = "bg-rose-500 border-rose-600";
                   else if (task.priority === "High") colorClass = "bg-orange-500 border-orange-600";
                }

                let customStyle = {};
                if (task.color) {
                  colorClass = "text-white border-transparent";
                  customStyle = { backgroundColor: task.color };
                }

                return (
                  <div 
                    key={task.id} 
                    onClick={() => setEditingTask(task)}
                    className={`text-white text-xs font-semibold px-2 py-1 rounded cursor-pointer hover:opacity-90 shadow-sm border flex items-center justify-between ${colorClass}`}
                    style={customStyle}
                  >
                    <span className="truncate flex-1">{task.title}</span>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex gap-1 ml-2 shrink-0 overflow-hidden">
                        {task.assignees.map((id: any) => {
                           const user = users.find((u: any) => u.user_id?.toString() === id?.toString());
                           const name = user ? `${user.user_fname} ${user.user_lname}` : 'Unknown';
                           return (
                             <span key={id} className="inline-block px-1 rounded bg-white/20 text-[9px] text-white truncate max-w-[70px]">
                               {name}
                             </span>
                           );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hourly Grid */}
        <div className="flex-1 overflow-y-auto max-h-[600px] relative">
          <div className="flex relative">
            {/* Time axis */}
            <div className="w-16 flex-shrink-0 bg-white/80 dark:bg-slate-900/50 border-r border-slate-200 dark:border-white/10 z-20 backdrop-blur-sm">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-slate-100 dark:border-white/5 flex items-start justify-end pr-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-1" style={{ height: '60px' }}>
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Grid Area */}
            <div className="flex-1 relative bg-transparent">
              {/* Horizontal Lines */}
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-slate-100 dark:border-white/5 w-full" style={{ height: '60px' }} />
              ))}
              
              {/* Timed Tasks */}
              {timedTasks.map(({ task, tStart, tEnd, colIndex }) => {
                const clampedStart = tStart < dayStart ? dayStart : tStart;
                const clampedEnd = tEnd > dayEnd ? dayEnd : tEnd;
                
                const startMinutes = getHours(clampedStart) * 60 + getMinutes(clampedStart);
                const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);
                
                const top = startMinutes;
                const height = Math.max(durationMinutes, 20);

                let colorClass = "bg-slate-700 border-slate-800";
                if (task.status === "Complete") colorClass = "bg-emerald-500 border-emerald-600";
                else if (task.status === "In Progress") colorClass = "bg-blue-500 border-blue-600";
                
                if (task.status === "Pending") {
                   if (task.priority === "Urgent") colorClass = "bg-rose-500 border-rose-600";
                   else if (task.priority === "High") colorClass = "bg-orange-500 border-orange-600";
                }

                const customStyle: any = {
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(${colIndex} * (100% / ${numColumns}) + 4px)`,
                  width: `calc(100% / ${numColumns} - 8px)`
                };
                if (task.color) {
                  colorClass = "text-white border-transparent";
                  customStyle.backgroundColor = task.color;
                }

                return (
                  <div 
                    key={task.id}
                    onClick={() => setEditingTask(task)}
                    className={`absolute rounded border text-white shadow-sm overflow-hidden p-1.5 cursor-pointer hover:opacity-90 z-10 flex flex-col justify-between ${colorClass}`}
                    style={customStyle}
                  >
                    <div>
                      <div className="text-xs font-semibold leading-tight mb-0.5 truncate">{task.title}</div>
                      <div className="text-[10px] opacity-80 leading-tight truncate">
                        {format(clampedStart, "h:mm a")} - {format(clampedEnd, "h:mm a")}
                      </div>
                    </div>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.assignees.map((id: any) => {
                           const user = users.find((u: any) => u.user_id?.toString() === id?.toString());
                           const name = user ? `${user.user_fname} ${user.user_lname}` : 'Unknown';
                           return (
                             <span key={id} className="inline-block px-1 rounded bg-white/20 text-[8px] text-white truncate max-w-[70px]">
                               {name}
                             </span>
                           );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBoard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {columns.map((col) => (
        <div 
          key={col.status} 
          className={`rounded-xl p-4 ${col.color} border border-slate-200 dark:border-white/10 min-h-[500px] transition-colors`}
          onDragOver={(e) => {
            e.preventDefault(); // allow drop
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedTaskId) {
              handleStatusChange(draggedTaskId, col.status);
              setDraggedTaskId(null);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            {col.icon}
            <h3 className="font-semibold text-slate-900 dark:text-white tracking-wide">{col.title}</h3>
            <span className="ml-auto bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-200 dark:border-white/5 shadow-inner">
              {tasks.filter((t) => t.status === col.status).length}
            </span>
          </div>
          <div className="space-y-3">
            {tasks
              .filter((t) => t.status === col.status)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedTaskId(task.id);
                    e.dataTransfer.setData("text/plain", task.id.toString());
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                  }}
                  onClick={() => setEditingTask(task)}
                  className={`bg-white dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-white/10 p-4 rounded-lg shadow-sm dark:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? "opacity-50" : ""} border-l-4 ${task.color ? "" : task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "border-l-cyan-500 dark:border-l-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30" : "border-l-slate-300 dark:border-l-slate-700"}`}
                  style={task.color ? { borderLeftColor: task.color } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h4 className="font-medium text-slate-900 dark:text-white">{task.title}</h4>
                         {task.category && (
                           <span className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 dark:border-white/5">{task.category}</span>
                         )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      
                      {/* Dates */}
                      {(task.start_date || task.end_date) && (
                        <div className={`flex flex-wrap items-center text-[10px] mt-3 gap-1.5 font-medium ${task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500"}`}>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{task.start_date ? format(parseISO(task.start_date), "MMM d, h:mm a") : "No start"}</span>
                          <span className="text-slate-400 dark:text-slate-700">→</span>
                          <span className={task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-500/30" : ""}>
                            {task.end_date ? format(parseISO(task.end_date), "MMM d, h:mm a") : "No deadline"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 cursor-pointer relative group">
                       <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        task.priority === "Urgent" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                        : task.priority === "High" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                        : task.priority === "Medium" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                      }`}
                    >
                      {task.priority}
                    </span>
                    
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                        {task.assignees.map((id: any) => {
                           const user = users.find((u: any) => u.user_id?.toString() === id?.toString());
                           const name = user ? `${user.user_fname} ${user.user_lname}` : 'Unknown';
                           return (
                             <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                               {name}
                             </span>
                           );
                        })}
                      </div>
                    )}

                    {/* Simple action buttons to move state */}
                    <div className="flex gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
                       {task.status !== "Pending" && (
                         <button onClick={() => handleStatusChange(task.id, "Pending")} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{'<'} Pending</button>
                       )}
                       {task.status === "Pending" && (
                         <button onClick={() => handleStatusChange(task.id, "In Progress")} className="text-xs text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">Start {'>'}</button>
                       )}
                       {task.status === "In Progress" && (
                         <button onClick={() => handleStatusChange(task.id, "Complete")} className="text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Finish {'>'}</button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="mt-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Activity</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Category</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Priority</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Schedule</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Assignees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr 
                  key={task.id} 
                  onClick={() => setEditingTask(task)}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {task.color && <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: task.color, color: task.color }}></div>}
                      <p className="font-medium text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{task.title}</p>
                    </div>
                    {task.description && <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {task.category && (
                      <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-white/5 uppercase tracking-wider">
                        {task.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      task.status === "Complete" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                      task.status === "In Progress" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.3)]" :
                      "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                    }`}>
                      {task.status === "Complete" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {task.status === "In Progress" && <PlayCircle className="w-3 h-3 mr-1" />}
                      {task.status === "Pending" && <Clock className="w-3 h-3 mr-1" />}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      task.priority === "Urgent" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                      : task.priority === "High" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      : task.priority === "Medium" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30"
                      : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-500">
                    {task.start_date || task.end_date ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.start_date ? format(parseISO(task.start_date), "MMM d, h:mm a") : "No start"}</span>
                        <span className="text-slate-400 dark:text-slate-600">→</span>
                        <span className={task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium border border-cyan-200 dark:border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.3)]" : ""}>
                          {task.end_date ? format(parseISO(task.end_date), "MMM d, h:mm a") : "No deadline"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {task.assignees.map((id: any) => {
                           const user = users.find((u: any) => u.user_id?.toString() === id?.toString());
                           const name = user ? `${user.user_fname} ${user.user_lname}` : 'Unknown';
                           return (
                             <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                               {name}
                             </span>
                           );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const completedTasks = tasks.filter(t => t.status === "Complete").length;
  const criticalTasks = tasks.filter(t => t.status !== "Complete" && (t.priority === "Urgent" || t.priority === "High")).length;

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen relative overflow-hidden transition-colors duration-300">
      {/* Background Glow Effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-cyan-500 rounded-full shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
            Schedule of Activities
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium tracking-wide">SYSTEM OVERVIEW & TASK SCHEDULING</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Employee Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowEmployeeFilter(!showEmployeeFilter)}
              className="flex items-center gap-2 bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300 font-medium"
            >
              <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Filter Personnel {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}</span>
            </button>
            
            {showEmployeeFilter && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-t-xl">
                  <span className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter by Employee</span>
                  {selectedEmployees.length > 0 && (
                    <button onClick={() => setSelectedEmployees([])} className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">Clear</button>
                  )}
                </div>
                <div className="py-1">
                  {users.map(u => {
                    const userId = u.user_id?.toString();
                    const isSelected = selectedEmployees.includes(userId);
                    return (
                      <label key={u.user_id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'}`}>
                           {isSelected && <CheckCircle2 className="w-3 h-3 text-white dark:text-slate-950" />}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees(prev => [...prev, userId]);
                            } else {
                              setSelectedEmployees(prev => prev.filter(id => id !== userId));
                            }
                          }}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{u.user_fname} {u.user_lname}</span>
                      </label>
                    );
                  })}
                  {users.length === 0 && <div className="p-4 text-center text-sm text-slate-500">Loading employees...</div>}
                </div>
              </div>
            )}
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-inner backdrop-blur">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "board" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "calendar" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "list" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ListIcon className="w-4 h-4" /> List
            </button>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 px-4 py-2 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-all shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.4)] dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] font-bold uppercase tracking-wider text-xs"
          >
            <Plus className="w-4 h-4" /> Add Activity
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 relative z-10">
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex items-center justify-between group hover:border-cyan-400 dark:hover:border-cyan-500/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Activities</p>
            <h3 className="text-3xl font-mono text-slate-900 dark:text-white mt-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{totalTasks}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20 shadow-inner dark:shadow-[inset_0_0_15px_rgba(34,211,238,0.1)]">
            <LayoutGrid className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex items-center justify-between group hover:border-amber-400 dark:hover:border-amber-500/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Pending</p>
            <h3 className="text-3xl font-mono text-slate-900 dark:text-white mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{pendingTasks}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-inner dark:shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex items-center justify-between group hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">In Progress</p>
            <h3 className="text-3xl font-mono text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{inProgressTasks}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-inner dark:shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex items-center justify-between group hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Completed</p>
            <h3 className="text-3xl font-mono text-slate-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{completedTasks}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-inner dark:shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg flex items-center justify-between group hover:border-rose-400 dark:hover:border-rose-500/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Critical / High</p>
            <h3 className="text-3xl font-mono text-slate-900 dark:text-white mt-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{criticalTasks}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 shadow-inner dark:shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {viewMode === "board" && renderBoard()}
      {viewMode === "calendar" && calendarView !== "day" && renderCalendar()}
      {viewMode === "calendar" && calendarView === "day" && renderDayView()}
      {viewMode === "list" && renderList()}
      
      <CreateTaskDialog 
        open={isCreating} 
        onOpenChange={setIsCreating} 
        userId={userId} 
        onSubmit={createTask} 
      />

      <EditTaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </div>
  );
}

