import { z } from "zod";

export const SlobAgingSchema = z.object({
  id: z.string().optional(),
  branchId: z.number().optional(),
  branchName: z.string().optional(),
  productId: z.number().optional(),
  productName: z.string().optional(),
  supplierId: z.number().optional(),
  supplierShortcut: z.string().nullable().optional(),
  currentStock: z.number().optional(),
  costPerUnit: z.number().optional(),
  stockValue: z.number().optional(),
  lastOutboundDate: z.string().nullable().optional(),
  isSlob: z.number().optional(),
  slobDaysThreshold: z.number().optional(),
});

export type SlobAging = z.infer<typeof SlobAgingSchema>;
