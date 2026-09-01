"use client";
import React, { useEffect, useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConferenceRoomSchema, ConferenceRoomInput } from "../types/conference-room.schema";
import { useConferenceRoomContext } from "../providers/ConferenceRoomProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UploadCloud, Image as ImageIcon, X, Calendar as CalendarIcon, Info, CalendarClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ConferenceRoomFormProps {
  id?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultWeeklySchedule = [
  { day: "Monday", isActive: true, startTime: "08:00", endTime: "22:00" },
  { day: "Tuesday", isActive: true, startTime: "08:00", endTime: "22:00" },
  { day: "Wednesday", isActive: true, startTime: "08:00", endTime: "22:00" },
  { day: "Thursday", isActive: true, startTime: "08:00", endTime: "22:00" },
  { day: "Friday", isActive: true, startTime: "08:00", endTime: "22:00" },
  { day: "Saturday", isActive: false, startTime: "08:00", endTime: "22:00" },
  { day: "Sunday", isActive: false, startTime: "08:00", endTime: "22:00" },
];

export const ConferenceRoomForm: React.FC<ConferenceRoomFormProps> = ({ id, onSuccess, onCancel }) => {
  const { data, addConferenceRoom, updateConferenceRoom } = useConferenceRoomContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [mainTab, setMainTab] = useState<"details" | "schedule">("details");
  const [scheduleType, setScheduleType] = useState<"weekly" | "specific">("weekly");
  const [schedule, setSchedule] = useState(defaultWeeklySchedule);
  const [specificSchedule, setSpecificSchedule] = useState({ start: "", end: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ConferenceRoomInput>({
    resolver: zodResolver(ConferenceRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      capacity: 1,
      weekly_schedule: "",
    },
  });

  useEffect(() => {
    if (id) {
      const room = data.find((r) => r.id === id);
      if (room) {
        form.reset({
          ...room,
          capacity: room.capacity ?? 1,
        });
        
        if (room.weekly_schedule) {
          try {
            const parsed = typeof room.weekly_schedule === 'string' ? JSON.parse(room.weekly_schedule) : room.weekly_schedule;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.type) {
              setScheduleType(parsed.type);
              if (parsed.type === "weekly" && parsed.days) {
                setSchedule(parsed.days);
              } else if (parsed.type === "specific" && parsed.specific) {
                setSpecificSchedule(parsed.specific);
              }
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              // Legacy format support
              setScheduleType("weekly");
              setSchedule(parsed);
            }
          } catch (e) {
            console.error("Failed to parse schedule", e);
          }
        }
      }
    } else {
      form.reset({ name: "", description: "", image: "", capacity: 1, weekly_schedule: "" });
      setMainTab("details");
      setScheduleType("weekly");
      setSchedule(defaultWeeklySchedule);
      setSpecificSchedule({ start: "", end: "" });
    }
  }, [id, data, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/holdings/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || "File upload failed");
    }
    return result.data.id;
  };

  const updateScheduleItem = (index: number, field: string, value: string | boolean) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const onSubmit: SubmitHandler<ConferenceRoomInput> = async (values) => {
    try {
      let imageValue = values.image;

      if (selectedFile) {
        setIsUploading(true);
        try {
          imageValue = await uploadFile(selectedFile);
        } catch (uploadError: unknown) {
          setIsUploading(false);
          toast.error(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
          return;
        }
        setIsUploading(false);
      }

      const schedulePayload = {
        type: scheduleType,
        days: scheduleType === "weekly" ? schedule : undefined,
        specific: scheduleType === "specific" ? specificSchedule : undefined,
      };

      const finalValues = { 
        ...values, 
        image: imageValue,
        weekly_schedule: JSON.stringify(schedulePayload)
      };

      if (id) {
        await updateConferenceRoom(id, finalValues);
      } else {
        await addConferenceRoom(finalValues);
      }
      
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Handled in hook
    }
  };

  const isSubmitting = form.formState.isSubmitting || isUploading;
  const currentImage = form.watch("image");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <Tabs value={mainTab} onValueChange={(val) => setMainTab(val as "details" | "schedule")} className="flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Room Details
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> Availability Schedule
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-[350px]">
          <TabsContent value="details" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Room Name</Label>
                  <Input id="name" {...form.register("name")} placeholder="e.g. Executive Boardroom" className="bg-muted/50" />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-sm font-medium">Capacity (People)</Label>
                  <Input id="capacity" type="number" min="1" {...form.register("capacity", { valueAsNumber: true })} placeholder="e.g. 50" className="bg-muted/50 w-full" />
                  {form.formState.errors.capacity && (
                    <p className="text-xs text-destructive">{form.formState.errors.capacity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea id="description" {...form.register("description")} placeholder="Describe the room layout, equipment, etc." className="bg-muted/50 min-h-[120px] resize-none" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Room Image</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-muted/20 relative group transition-colors hover:bg-muted/40"
                  style={{ minHeight: "225px" }}
                >
                  <Input 
                    id="imageFile" 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={handleFileChange} 
                    ref={fileInputRef}
                  />
                  
                  {selectedFile || currentImage ? (
                    <div className="absolute inset-2 rounded-md overflow-hidden bg-black/5">
                      <img
                        src={selectedFile ? URL.createObjectURL(selectedFile) : `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/assets/${currentImage}`}
                        alt="Room Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <p className="text-white font-medium flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center pointer-events-none text-muted-foreground">
                      <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                        <ImageIcon className="w-6 h-6 text-primary/60" />
                      </div>
                      <p className="text-sm font-medium">Click or drag image to upload</p>
                      <p className="text-xs opacity-70 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                  )}
                  
                  {selectedFile && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-3 -right-3 h-6 w-6 rounded-full z-20 shadow-md"
                      onClick={(e) => { e.preventDefault(); clearFile(); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Tabs value={scheduleType} onValueChange={(val) => setScheduleType(val as "weekly" | "specific")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 border">
                <TabsTrigger value="weekly">Weekly Recurring Schedule</TabsTrigger>
                <TabsTrigger value="specific">Specific Dates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-24">Day</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((item, index) => (
                        <TableRow key={item.day} className={item.isActive ? "bg-background" : "bg-muted/10 opacity-70"}>
                          <TableCell className="font-medium">{item.day.substring(0, 3)}</TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={item.isActive} 
                              onCheckedChange={(checked) => updateScheduleItem(index, 'isActive', checked)} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="time" 
                              value={item.startTime} 
                              disabled={!item.isActive}
                              onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)}
                              className="h-8 bg-muted/50 w-full max-w-[120px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="time" 
                              value={item.endTime} 
                              disabled={!item.isActive}
                              onChange={(e) => updateScheduleItem(index, 'endTime', e.target.value)}
                              className="h-8 bg-muted/50 w-full max-w-[120px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="specific" className="space-y-4">
                <div className="bg-muted/10 p-6 rounded-lg border flex flex-col items-center justify-center gap-6">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <div className="w-full max-w-md space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date & Time</Label>
                      <Input 
                        id="start_date" 
                        type="datetime-local" 
                        value={specificSchedule.start} 
                        onChange={(e) => setSpecificSchedule({...specificSchedule, start: e.target.value})}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date & Time</Label>
                      <Input 
                        id="end_date" 
                        type="datetime-local" 
                        value={specificSchedule.end} 
                        onChange={(e) => setSpecificSchedule({...specificSchedule, end: e.target.value})}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-between items-center pt-6 mt-auto border-t">
        <div className="text-xs text-muted-foreground hidden sm:block">
          {mainTab === "details" ? "Step 1 of 2" : "Step 2 of 2"}
        </div>
        <div className="flex justify-end gap-3 w-full sm:w-auto">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          {mainTab === "details" ? (
            <Button key="next-btn" type="button" onClick={(e) => { e.preventDefault(); setMainTab("schedule"); }} className="min-w-[120px] shadow-sm">
              Next: Schedule
            </Button>
          ) : (
            <Button key="submit-btn" type="submit" disabled={isSubmitting} className="min-w-[120px] shadow-sm">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : (
                "Save Room"
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};