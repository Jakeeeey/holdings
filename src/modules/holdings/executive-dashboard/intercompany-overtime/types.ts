export type CompanyStatus = "ACTIVE" | "OFFLINE" | "INACTIVE";

export interface CompanyOvertimeSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: CompanyStatus;
  totalEmployees: number;
  totalOtRequests: number;
  approvedOtRequests: number;
  pendingOtRequests: number;
  rejectedOtRequests: number;
  totalFiledOtHours: number;
  totalApprovedOtHours: number;
  totalActualOtHours: number;
  otApprovalRate: number; // percentage
  headcountSharePct: number;
  otHoursSharePct: number;
}

export interface IntercompanyOvertimeKpis {
  totalEmployees: number;
  totalOtRequests: number;
  totalApprovedOtRequests: number;
  totalPendingOtRequests: number;
  totalRejectedOtRequests: number;
  totalFiledOtHours: number;
  totalApprovedOtHours: number;
  totalActualOtHours: number;
  otApprovalRate: number; // percentage
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  topOtCompany: string;
  topOtHours: number;
}

export interface IntercompanyOvertimeResponse {
  startDate: string;
  endDate: string;
  generatedAt: string;
  kpis: IntercompanyOvertimeKpis;
  companySummaries: CompanyOvertimeSummary[];
}

