export type CompanyStatus = "ACTIVE" | "OFFLINE" | "INACTIVE";

export interface CompanyMasterlistSummary {
  companyId: number;
  companyName: string;
  companyCode: string;
  status: CompanyStatus;
  totalEmployees: number;
  activeCount: number;
  separatedCount: number;
  regularCount: number;
  probationaryCount: number;
  otherStatusCount: number;
  newHiresThisYear: number;
  departmentCount: number;
  avgTenureYears: number;
  maleCount: number;
  femaleCount: number;
  headcountSharePct: number;
}

export interface IntercompanyEmployeeMasterlistKpis {
  totalEmployees: number;
  regularCount: number;
  probationaryCount: number;
  otherStatusCount: number;
  newHiresThisYear: number;
  avgTenureYears: number;
  maleCount: number;
  femaleCount: number;
  activeCompaniesCount: number;
  totalCompaniesCount: number;
  largestCompanyName: string;
  largestCompanyCount: number;
}

export interface IntercompanyEmployeeMasterlistResponse {
  generatedAt: string;
  kpis: IntercompanyEmployeeMasterlistKpis;
  companySummaries: CompanyMasterlistSummary[];
}

