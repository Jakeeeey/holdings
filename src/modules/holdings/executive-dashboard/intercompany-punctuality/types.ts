export type PunctualityStatus =
  | "On Time"
  | "Grace Period"
  | "Moderate Late"
  | "Severe Late"
  | "Undertime"
  | "Absent";

export interface CompanyPunctualitySummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE";
  totalEmployees: number;
  totalLogs: number;
  onTimeCount: number;
  gracePeriodCount: number;
  moderateLateCount: number;
  severeLateCount: number;
  totalLateCount: number;
  undertimeCount: number;
  punctualityRate: number; // percentage (0-100)
  avgDelayMinutes: number;
  punctualitySharePct: number;
}

export interface IntercompanyPunctualityKpis {
  totalStaff: number;
  totalPresentLogs: number;
  onTimeCount: number;
  totalLateCount: number;
  gracePeriodCount: number;
  undertimeCount: number;
  overallPunctualityRate: number; // percentage (0-100)
  avgDelayMinutes: number;
  topPunctualCompany: string;
  topPunctualRate: number;
}

export interface IntercompanyPunctualityResponse {
  kpis: IntercompanyPunctualityKpis;
  companySummaries: CompanyPunctualitySummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchPunctualityParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}

