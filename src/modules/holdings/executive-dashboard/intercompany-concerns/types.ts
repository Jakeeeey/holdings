export type ConcernStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "CLOSED"
  | "DISMISSED"
  | string;

export interface CompanyConcernsSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE";
  totalConcerns: number;
  pendingCount: number;
  inReviewCount: number;
  resolvedCount: number;
  closedCount: number;
  anonymousCount: number;
  resolutionRate: number; // percentage (0-100)
  sharePercentage: number;
}

export interface IntercompanyConcernsKpis {
  totalConcerns: number;
  pendingCount: number;
  inReviewCount: number;
  resolvedCount: number;
  closedCount: number;
  anonymousCount: number;
  anonymousPercentage: number;
  resolutionRate: number; // percentage (0-100)
  topConcernCategory: string;
  topConcernCompany: string;
  topConcernCount: number;
}

export interface IntercompanyConcernsResponse {
  kpis: IntercompanyConcernsKpis;
  companySummaries: CompanyConcernsSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchConcernsParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}

