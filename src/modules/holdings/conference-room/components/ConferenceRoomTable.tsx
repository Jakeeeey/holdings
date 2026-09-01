"use client";
import React, { useState } from "react";
import { useConferenceRoomContext } from "../providers/ConferenceRoomProvider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConferenceRoomForm } from "./ConferenceRoomForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Search, Calendar, Users, Building } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ConferenceRoomTable = () => {
  const { data, isLoading, removeConferenceRoom } = useConferenceRoomContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedId(null);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: number) => {
    setRoomToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    if (roomToDelete !== null) {
      await removeConferenceRoom(roomToDelete);
      setIsAlertOpen(false);
      setRoomToDelete(null);
    }
  };

  const filteredData = data.filter((room) => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conference Rooms</h2>
          <p className="text-muted-foreground mt-1">Manage all available conference spaces and their weekly schedules.</p>
        </div>
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>

      <Card className="border-muted shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              Room Directory
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search rooms..." 
                className="pl-9 h-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-16 pl-6">Image</TableHead>
                <TableHead>Room Details</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building className="h-10 w-10 mb-2 opacity-20" />
                      <p>No conference rooms found.</p>
                      {searchQuery && <p className="text-sm">Try clearing your search query.</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((room) => (
                  <TableRow key={room.id} className="group hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-6">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/assets/${room.image}`} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {room.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{room.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]" title={room.description || ""}>
                        {room.description || "No description provided"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {room.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          const s = typeof room.weekly_schedule === 'string' ? JSON.parse(room.weekly_schedule) : room.weekly_schedule;
                          
                          if (s && typeof s === 'object' && !Array.isArray(s) && s.type) {
                            if (s.type === 'specific' && s.specific) {
                              return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Calendar className="mr-1 h-3 w-3" /> Specific Dates</Badge>;
                            }
                            if (s.type === 'weekly' && s.days) {
                              const activeDays = s.days.filter((day: { isActive: boolean }) => day.isActive);
                              if (activeDays.length === 0) return <Badge variant="secondary" className="bg-muted text-muted-foreground">No schedule</Badge>;
                              if (activeDays.length === 7) return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Calendar className="mr-1 h-3 w-3" /> Everyday</Badge>;
                              return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Calendar className="mr-1 h-3 w-3" /> {activeDays.length} days active</Badge>;
                            }
                          }

                          if (Array.isArray(s)) {
                            const activeDays = s.filter((day: { isActive: boolean }) => day.isActive);
                            if (activeDays.length === 0) return <Badge variant="secondary" className="bg-muted text-muted-foreground">No schedule</Badge>;
                            if (activeDays.length === 7) return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Calendar className="mr-1 h-3 w-3" /> Everyday</Badge>;
                            return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Calendar className="mr-1 h-3 w-3" /> {activeDays.length} days active</Badge>;
                          }
                        } catch (e) {}
                        return <Badge variant="secondary" className="bg-muted">Not set</Badge>;
                      })()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(room.id!)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(room.id!)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedId ? "Edit Conference Room" : "Create Conference Room"}</DialogTitle>
            <DialogDescription>
              {selectedId ? "Update the details and availability for this room." : "Add a new conference space to the directory."}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <ConferenceRoomForm 
              id={selectedId} 
              onSuccess={() => setIsFormOpen(false)} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conference Room</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove this room and its schedule from the directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoomToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Room</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
