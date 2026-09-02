import { z } from "zod";

export const ConferenceRoomRequestSchema = z.object({
  id: z.number().optional(),
  room_id: z.number(),
  title: z.string().min(1, "Title is required"),
  purpose: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  requested_by: z.number().optional(),
  requested_by_name: z.string().optional(),
  company_id: z.number().optional(),
  created_at: z.string().optional(),
});

export type ConferenceRoomRequestInput = z.infer<typeof ConferenceRoomRequestSchema>;

export type ConferenceRoomRequestResponse = {
  success: boolean;
  message?: string;
  data?: ConferenceRoomRequestInput | ConferenceRoomRequestInput[];
};
