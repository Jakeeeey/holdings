"use client";
import React from "react";
import { useConferenceRoomRequestContext } from "../providers/ConferenceRoomRequestProvider";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, MapPin } from "lucide-react";

export const ConferenceRoomRequestTable: React.FC = () => {
  const { requests, rooms, isLoading } = useConferenceRoomRequestContext();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading requests...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 text-white font-bold">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 font-bold">Rejected</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-slate-500 border-slate-300 font-bold bg-slate-50">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-sm shadow-amber-500/10 font-bold">Pending</Badge>;
    }
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : `Room #${roomId}`;
  };

  if (requests.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CalendarClock className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Requests Found</h3>
          <p className="text-muted-foreground max-w-sm">
            You haven't requested any conference rooms yet. Click the button above to make your first booking request!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl shadow-black/10 border-border/60 overflow-hidden bg-background rounded-2xl">
      <CardHeader className="bg-slate-900 text-white border-b border-border/40 pb-5 px-6 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3 tracking-tight">
            <div className="bg-white/10 p-2.5 rounded-xl text-white shadow-inner">
              <CalendarClock className="w-5 h-5" />
            </div>
            My Booking Requests
          </CardTitle>
          <Badge variant="outline" className="bg-white/5 text-white/90 border-white/20 px-3 py-1 text-xs">
            {requests.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] font-bold text-slate-600 h-12 uppercase text-xs tracking-wider">Ref ID</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 uppercase text-xs tracking-wider">Booking Details</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 uppercase text-xs tracking-wider">Schedule</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 uppercase text-xs tracking-wider">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-600 h-12 uppercase text-xs tracking-wider">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-blue-50/50 transition-colors group cursor-default">
                  <TableCell className="font-medium">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">
                      #{request.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 tracking-tight text-[15px]">{request.title}</div>
                    <div className="flex items-center text-xs text-slate-500 mt-1.5 gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {getRoomName(request.room_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {request.start_time ? format(new Date(request.start_time), "MMM d, yyyy h:mm a") : "TBD"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        to {request.end_time ? format(new Date(request.end_time), "MMM d, yyyy h:mm a") : "TBD"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-500">
                    {request.created_at ? format(new Date(request.created_at), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
