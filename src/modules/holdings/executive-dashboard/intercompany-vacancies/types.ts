export type VacancyUrgency = "Critical" | "Moderate" | "Normal";

export interface CompanyVacanciesSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: "ACTIVE" | "OFFLINE";
  openVacancies: number;
  totalNeeded: number;
  hiredCount: number;
  activeRequisitions: number;
  criticalCount: number;
  avgAgingDays: number;
  sharePercentage: number;
}

export interface IntercompanyVacanciesKpis {
  totalOpenVacancies: number;
  totalRequisitions: number;
  replacementRoles: number;
  newPositionRoles: number;
  avgAgingDays: number;
  criticalRolesCount: number;
  topVacanciesCompany: string;
  topVacanciesCount: number;
}

export interface IntercompanyVacanciesResponse {
  kpis: IntercompanyVacanciesKpis;
  companySummaries: CompanyVacanciesSummary[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchVacanciesParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  force?: boolean;
}
