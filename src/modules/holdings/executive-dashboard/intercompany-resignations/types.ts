export type ResignationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED"
  | "RECORDED"
  | string;

export interface CompanyResignationSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE";
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  avgNoticeDays: number;
  complianceRate: number; // % with >= 30 days notice
  totalEmployees: number;
  turnoverRate: number; // percentage (0-100)
  sharePercentage: number;
}

export interface IntercompanyResignationKpis {
  totalResignations: number;
  pendingCount: number;
  approvedCount: number;
  turnoverRate: number; // percentage (0-100)
  complianceRate: number; // % with >= 30 days notice
  avgNoticeDays: number;
  topResignationReason: string;
  highestTurnoverCompany: string;
  highestTurnoverRate: number;
}

export interface IntercompanyResignationResponse {
  kpis: IntercompanyResignationKpis;
  companySummaries: CompanyResignationSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchResignationsParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}

