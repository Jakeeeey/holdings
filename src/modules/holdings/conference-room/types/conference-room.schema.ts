import { z } from "zod";

export const ConferenceRoomSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  created_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_by: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_by: z.number().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

export type ConferenceRoomInput = z.infer<typeof ConferenceRoomSchema>;

export interface ConferenceRoomResponse {
  data?: ConferenceRoomInput | ConferenceRoomInput[];
  success: boolean;
  message?: string;
}
