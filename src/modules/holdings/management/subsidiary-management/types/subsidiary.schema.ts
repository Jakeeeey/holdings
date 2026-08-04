import { z } from "zod";

export const SubsidiarySchema = z.object({
  company_id: z.number().optional(),
  company_name: z.string().min(1, "Company Name is required").max(255).nullable().optional(),
  company_type_id: z.number().nullable().optional(),
  company_code: z.string().min(1, "Company Code is required").max(255),
  company_address: z.string().max(255).nullable().optional(),
  company_brgy: z.string().max(255).nullable().optional(),
  company_city: z.string().max(255).nullable().optional(),
  company_province: z.string().max(255).nullable().optional(),
  company_zipCode: z.string().max(20).nullable().optional(),
  company_registrationNumber: z.string().max(255).nullable().optional(),
  company_tin: z.string().max(20).nullable().optional(),
  company_dateAdmitted: z.string().nullable().optional(), // Expected format: YYYY-MM-DD
  company_contact: z.string().max(255).nullable().optional(),
  company_email: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  company_outlook: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  company_gmail: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  company_department: z.string().max(100).nullable().optional(),
  company_logo: z.string().nullable().optional(),
  company_facebook: z.string().max(255).nullable().optional(),
  company_website: z.string().max(255).nullable().optional(),
  company_tags: z.string().max(255).nullable().optional(),
  directus: z.string().max(255).nullable().optional(),
  springboot: z.string().max(255).nullable().optional(),
  subscription_id: z.number().nullable().optional(),
  created_date: z.string().nullable().optional(), // Timestamp
  created_by: z.string().max(255).nullable().optional(),
  status: z.string().max(255).nullable().optional(),
  directus_token: z.string().max(255).nullable().optional(),
  springboot_token: z.string().max(255).nullable().optional(),
});

export type SubsidiaryInput = z.infer<typeof SubsidiarySchema>;

export interface SubsidiaryResponse {
  data?: SubsidiaryInput | SubsidiaryInput[];
  success: boolean;
  message?: string;
}
