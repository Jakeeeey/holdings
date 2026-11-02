export type AttendanceStatus = "On Time" | "Late" | "Absent" | "On Leave";

export interface CompanyAttendanceSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE";
  totalEmployees: number;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number; // percentage (0-100)
  punctualityRate: number; // percentage (0-100)
  attendanceSharePct: number;
}

export interface IntercompanyAttendanceKpis {
  totalWorkforce: number;
  totalPresent: number;
  totalOnTime: number;
  totalLate: number;
  totalAbsent: number;
  totalOnLeave: number;
  overallAttendanceRate: number; // percentage (0-100)
  overallPunctualityRate: number; // percentage (0-100)
  topAttendanceCompany: string;
  topAttendanceRate: number;
}

export interface IntercompanyAttendanceResponse {
  kpis: IntercompanyAttendanceKpis;
  companySummaries: CompanyAttendanceSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchAttendanceParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}
