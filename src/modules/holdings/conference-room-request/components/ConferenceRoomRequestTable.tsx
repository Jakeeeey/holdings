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
      case 'approved': return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">Pending</Badge>;
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
    <Card className="shadow-sm border-muted/60">
      <CardHeader className="bg-muted/10 border-b pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          My Booking Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-b-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Title & Room</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">
                    #{request.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{request.title}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                      <MapPin className="w-3 h-3" />
                      {getRoomName(request.room_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {request.start_time ? format(new Date(request.start_time), "MMM d, yyyy h:mm a") : "TBD"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        to {request.end_time ? format(new Date(request.end_time), "MMM d, yyyy h:mm a") : "TBD"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
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
