import { z } from "zod";

export const kpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  trend: z.number().optional(), // percentage
  trendDirection: z.enum(["up", "down", "neutral"]).optional(),
});

export const chartDataSchema = z.object({
  name: z.string(),
  value: z.number(),
  secondaryValue: z.number().optional(),
});

export const executiveDashboardResponseSchema = z.object({
  kpis: z.array(kpiSchema),
  revenueChart: z.array(chartDataSchema),
  patientActivityChart: z.array(chartDataSchema),
});

export type KPI = z.infer<typeof kpiSchema>;
export type ChartData = z.infer<typeof chartDataSchema>;
export type ExecutiveDashboardResponse = z.infer<typeof executiveDashboardResponseSchema>;
