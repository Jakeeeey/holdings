"use client";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConferenceRoomRequestSchema, ConferenceRoomRequestInput } from "../types/conference-room-request.schema";
import { useConferenceRoomRequestContext } from "../providers/ConferenceRoomRequestProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarClock, Info, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConferenceRoomRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ConferenceRoomRequestForm: React.FC<ConferenceRoomRequestFormProps> = ({ onSuccess, onCancel }) => {
  const { rooms, submitRequest } = useConferenceRoomRequestContext();
  const [mainTab, setMainTab] = useState<"room" | "details">("room");

  const form = useForm<ConferenceRoomRequestInput>({
    resolver: zodResolver(ConferenceRoomRequestSchema),
    defaultValues: {
      title: "",
      purpose: "",
      start_time: "",
      end_time: "",
      status: "pending",
      // Hardcoded values for now, ideally retrieved from auth context
      requested_by: 1, 
      requested_by_name: "John Doe",
      company_id: 1,
    },
  });

  const selectedRoomId = form.watch("room_id");
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const onSubmit: SubmitHandler<ConferenceRoomRequestInput> = async (values) => {
    try {
      await submitRequest(values);
      toast.success("Conference room requested successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request room");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <Tabs value={mainTab} onValueChange={(val) => setMainTab(val as "room" | "details")} className="flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="room" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> 1. Select Room
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedRoomId}>
            <Info className="w-4 h-4" /> 2. Booking Details
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-[350px]">
          <TabsContent value="room" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Available Global Conference Rooms</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div 
                    key={room.id}
                    onClick={() => {
                      form.setValue("room_id", room.id as number, { shouldValidate: true });
                      setMainTab("details");
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRoomId === room.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex gap-4">
                      {room.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/assets/${room.image}`} alt={room.name} className="w-20 h-20 object-cover rounded-md border" />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                          <MapPin className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-lg">{room.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{room.description || "No description"}</p>
                        <p className="text-xs font-medium mt-2 bg-secondary text-secondary-foreground w-fit px-2 py-0.5 rounded-full">
                          Capacity: {room.capacity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No global conference rooms available to book.</p>
                  </div>
                )}
              </div>
              {form.formState.errors.room_id && (
                <p className="text-xs text-destructive mt-2">{form.formState.errors.room_id.message}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {selectedRoom && (
              <div className="bg-muted/30 border rounded-lg p-4 mb-6 flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Booking: {selectedRoom.name}</p>
                  <p className="text-xs text-muted-foreground">Please select a time within the room's available schedule.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Meeting Title</Label>
                  <Input id="title" {...form.register("title")} placeholder="e.g. Quarterly Review" className="bg-background" />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-sm font-medium">Purpose / Notes</Label>
                  <Textarea id="purpose" {...form.register("purpose")} placeholder="Briefly describe the purpose of the meeting..." className="bg-background min-h-[120px] resize-none" />
                </div>
              </div>

              <div className="space-y-4 bg-muted/10 p-4 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Date & Time</Label>
                  <Input 
                    id="start_time" 
                    type="datetime-local" 
                    {...form.register("start_time")}
                    className="bg-background"
                  />
                  {form.formState.errors.start_time && (
                    <p className="text-xs text-destructive">{form.formState.errors.start_time.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Date & Time</Label>
                  <Input 
                    id="end_time" 
                    type="datetime-local" 
                    {...form.register("end_time")}
                    className="bg-background"
                  />
                  {form.formState.errors.end_time && (
                    <p className="text-xs text-destructive">{form.formState.errors.end_time.message}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-between items-center pt-6 mt-auto border-t">
        <div className="text-xs text-muted-foreground hidden sm:block">
          {mainTab === "room" ? "Step 1 of 2" : "Step 2 of 2"}
        </div>
        <div className="flex justify-end gap-3 w-full sm:w-auto">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          {mainTab === "room" ? (
            <Button 
              key="next-btn" 
              type="button" 
              onClick={(e) => { e.preventDefault(); setMainTab("details"); }} 
              disabled={!selectedRoomId}
              className="min-w-[120px] shadow-sm"
            >
              Next: Details
            </Button>
          ) : (
            <Button key="submit-btn" type="submit" disabled={isSubmitting} className="min-w-[120px] shadow-sm">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
