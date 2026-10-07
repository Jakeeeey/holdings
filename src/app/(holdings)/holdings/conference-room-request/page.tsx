"use client";

import React, { useState } from "react";
import { ConferenceRoomRequestProvider } from "@/modules/holdings/conference-room-request/providers/ConferenceRoomRequestProvider";
import { ConferenceRoomRequestTable } from "@/modules/holdings/conference-room-request/components/ConferenceRoomRequestTable";
import { ConferenceRoomRequestForm } from "@/modules/holdings/conference-room-request/components/ConferenceRoomRequestForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

import { ConferenceRoomCalendar } from "@/modules/holdings/conference-room-request/components/ConferenceRoomCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List } from "lucide-react";

const RequestPageContent = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conference Room Requests</h2>
          <p className="text-muted-foreground mt-1">Book and manage your conference room schedules globally.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-sm">
          <PlusCircle className="w-4 h-4" />
          Request Room
        </Button>
      </div>

      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <div className="flex items-center mb-4">
          <TabsList className="bg-slate-100 border border-slate-200 p-1">
            <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <List className="w-4 h-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 mt-0 border-none p-0 outline-none">
          <ConferenceRoomRequestTable />
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 mt-0 border-none p-0 outline-none">
          <ConferenceRoomCalendar />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Conference Room</DialogTitle>
            <DialogDescription>
              Select an available global room and submit your booking request.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ConferenceRoomRequestForm 
              onSuccess={() => setIsFormOpen(false)} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function ConferenceRoomRequestPage() {
  return (
    <ConferenceRoomRequestProvider>
      <RequestPageContent />
    </ConferenceRoomRequestProvider>
  );
}
