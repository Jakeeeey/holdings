export interface PermitCompany {
  company_id: number;
  company_name: string;
  company_code: string;
  company_logo?: string | null;
  company_address?: string | null;
  company_tin?: string | null;
  directus?: string | null;
  directus_token?: string | null;
  is_directus_configured?: boolean;
  connection_status?: "online" | "offline" | "unconfigured" | "unknown";
  connection_error?: string | null;
}

export interface CompanySyncResult {
  company_id: number;
  company_name: string;
  status: "success" | "failed" | "skipped";
  message?: string;
}

export interface SyncOperationReport {
  success: boolean;
  message: string;
  syncedCount: number;
  totalConfigured: number;
  results: CompanySyncResult[];
}

export interface PermitTypeItem {
  id: number | string;
  name?: string;
  permit_type_name?: string;
  code?: string;
  description?: string;
  is_active?: number | boolean;
  required_days_before_expiry?: number;
}

export interface PermitRecord {
  id?: number | string;
  company_id?: number | null;
  permit_type_id: number | string;
  permit_number: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  // Fallbacks for compatibility
  issued_date?: string | null;
  expiration_date?: string | null;
  file_url: string;
  issuing_agency?: string | null;
  status?: "Active" | "Archived" | string | null;
  sync_status?: "synced" | "unsynced" | "failed" | "unconfigured";
  notes?: string | null;
  remarks?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PermitCreationMatrixData {
  companies: PermitCompany[];
  permitTypes: PermitTypeItem[];
  permits: PermitRecord[];
}

export interface PermitFormData {
  id?: number | string;
  company_id: number;
  permit_type_id: number | string;
  permit_number: string;
  issue_date: string;
  expiry_date: string;
  file_url: string;
  issuing_agency: string;
  status: "Active" | "Archived" | string;
  notes: string;
  renew_from_id?: number | string;
}

