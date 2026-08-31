"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConferenceRoomSchema, ConferenceRoomInput } from "../types/conference-room.schema";
import { useConferenceRoomContext } from "../providers/ConferenceRoomProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ConferenceRoomFormProps {
  id?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ConferenceRoomForm: React.FC<ConferenceRoomFormProps> = ({ id, onSuccess, onCancel }) => {
  const { data, addConferenceRoom, updateConferenceRoom } = useConferenceRoomContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
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

    // Return the UUID or URL returned from Directus
    // Assuming Directus returns the file ID in result.data.id
    return result.data.id;
  };

  const onSubmit = async (values: ConferenceRoomInput) => {
    try {
      let imageValue = values.image;

      if (selectedFile) {
        setIsUploading(true);
        try {
          imageValue = await uploadFile(selectedFile);
        } catch (uploadError: unknown) {
          setIsUploading(false);
          toast.error(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
          return; // Stop submission if upload fails
        }
        setIsUploading(false);
      }

      const finalValues = { ...values, image: imageValue };

      if (id) {
        await updateConferenceRoom(id, finalValues);
      } else {
        await addConferenceRoom(finalValues);
      }
      
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error is handled in the hook (toasts)
    }
  };

  const isSubmitting = form.formState.isSubmitting || isUploading;

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
        <Label htmlFor="imageFile">Image Upload</Label>
        <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} />
        
        {/* Preview Section */}
        {(selectedFile || form.watch("image")) && (
          <div className="mt-2 flex flex-col space-y-2">
            <span className="text-sm font-medium">Image Preview:</span>
            <div className="relative w-40 h-40 border rounded-md overflow-hidden bg-muted">
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              ) : form.watch("image") ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/assets/${form.watch("image")}`}
                  alt="Current"
                  className="object-cover w-full h-full"
                />
              ) : null}
            </div>
            {!selectedFile && (
              <p className="text-xs text-gray-500">Current Image ID: {form.watch("image")}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};