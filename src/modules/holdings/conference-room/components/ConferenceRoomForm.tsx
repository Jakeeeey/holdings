"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConferenceRoomSchema, ConferenceRoomInput } from "../types/conference-room.schema";
import { useConferenceRoomContext } from "../providers/ConferenceRoomProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConferenceRoomFormProps {
  id?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ConferenceRoomForm: React.FC<ConferenceRoomFormProps> = ({ id, onSuccess, onCancel }) => {
  const { data, addConferenceRoom, updateConferenceRoom } = useConferenceRoomContext();
  
  const form = useForm<ConferenceRoomInput>({
    resolver: zodResolver(ConferenceRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
    },
  });

  useEffect(() => {
    if (id) {
      const room = data.find((r) => r.id === id);
      if (room) {
        form.reset(room);
      }
    } else {
      form.reset({ name: "", description: "", image: "" });
    }
  }, [id, data, form]);

  const onSubmit = async (values: ConferenceRoomInput) => {
    try {
      if (id) {
        await updateConferenceRoom(id, values);
      } else {
        await addConferenceRoom(values);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error is handled in the hook (toasts)
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} placeholder="Enter room name" />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} placeholder="Enter description" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" {...form.register("image")} placeholder="https://example.com/image.jpg" />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};