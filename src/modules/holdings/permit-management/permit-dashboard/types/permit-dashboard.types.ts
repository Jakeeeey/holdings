export type HealthLevel = "healthy" | "warning" | "critical" | "unmonitored";

export interface DashboardPermitItem {
  id: number | string;
  company_id: number;
  company_name: string;
  company_code: string;
  permit_type_id: number | string;
  permit_type_name: string;
  permit_number: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  issued_date?: string | null;
  expiration_date: string;
  file_url?: string;
  issuing_agency?: string | null;
  days_remaining: number;
  status_label: "Expired" | "Expiring Soon" | "Active";
  health_level: HealthLevel;
  status?: "Active" | "Archived" | string | null;
  notes?: string | null;
  remarks?: string | null;
}

export interface CompanyHealthRecord {
  company_id: number;
  company_name: string;
  company_code: string;
  company_logo?: string | null;
  company_address?: string | null;
  company_tin?: string | null;
  total_permits: number;
  active_count: number;
  expiring_count: number;
  expired_count: number;
  compliance_percentage: number;
  health_level: HealthLevel;
  permits: DashboardPermitItem[];
  archived_permits: DashboardPermitItem[];
}

export interface PermitDashboardSummary {
  total_companies: number;
  total_permits: number;
  active_count: number;
  expiring_count: number;
  expired_count: number;
  archived_count: number;
  overall_compliance_rate: number;
  critical_permits_count: number;
}

export interface PermitDashboardData {
  summary: PermitDashboardSummary;
  companies_health: CompanyHealthRecord[];
  urgent_expiries: DashboardPermitItem[];
  archived_permits: DashboardPermitItem[];
}
