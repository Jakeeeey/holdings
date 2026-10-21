"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  PermitDashboardSummary,
  CompanyHealthRecord,
  DashboardPermitItem,
  HealthLevel,
} from "../types/permit-dashboard.types";

const defaultSummary: PermitDashboardSummary = {
  total_companies: 0,
  total_permits: 0,
  active_count: 0,
  expiring_count: 0,
  expired_count: 0,
  archived_count: 0,
  overall_compliance_rate: 100,
  critical_permits_count: 0,
};

export const usePermitDashboard = () => {
  const [summary, setSummary] = useState<PermitDashboardSummary>(defaultSummary);
  const [companiesHealth, setCompaniesHealth] = useState<CompanyHealthRecord[]>([]);
  const [urgentExpiries, setUrgentExpiries] = useState<DashboardPermitItem[]>([]);
  const [archivedPermits, setArchivedPermits] = useState<DashboardPermitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/holdings/permit-management/permit-dashboard");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load permit health dashboard.");
      }
      setSummary(result.data?.summary || defaultSummary);
      setCompaniesHealth(result.data?.companies_health || []);
      setUrgentExpiries(result.data?.urgent_expiries || []);
      setArchivedPermits(result.data?.archived_permits || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCompanies = useMemo(() => {
    return companiesHealth.filter((c) => {
      // Health filter
      if (healthFilter !== "all" && c.health_level !== (healthFilter as HealthLevel)) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.company_name.toLowerCase().includes(term);
        const matchesCode = c.company_code.toLowerCase().includes(term);
        return matchesName || matchesCode;
      }
      return true;
    });
  }, [companiesHealth, healthFilter, searchTerm]);

  const filteredArchivedPermits = useMemo(() => {
    if (!searchTerm.trim()) return archivedPermits;
    const term = searchTerm.toLowerCase();
    return archivedPermits.filter(
      (p) =>
        p.company_name.toLowerCase().includes(term) ||
        p.company_code.toLowerCase().includes(term) ||
        p.permit_number.toLowerCase().includes(term) ||
        p.permit_type_name.toLowerCase().includes(term)
    );
  }, [archivedPermits, searchTerm]);

  // Single company test/sync state
  const [syncingCompanyId, setSyncingCompanyId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync a single company
  const syncCompany = async (companyId: number) => {
    setSyncingCompanyId(companyId);
    try {
      const res = await fetch("/api/holdings/permit-management/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-single-company", company_id: companyId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to test connection.");
      }
      toast.success(result.message || "Company connected and synchronized!");
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection test failed.";
      toast.error(msg);
      return false;
    } finally {
      setSyncingCompanyId(null);
    }
  };

  // Convert companiesHealth to PermitCompany[] format for SyncCenterDialog
  const syncDialogCompanies = useMemo(() => {
    return companiesHealth.map((c) => ({
      company_id: c.company_id,
      company_name: c.company_name,
      company_code: c.company_code,
      company_logo: c.company_logo,
      company_address: c.company_address,
      company_tin: c.company_tin,
      directus: c.directus,
      is_directus_configured: c.is_directus_configured,
      connection_status: c.connection_status,
      connection_error: c.connection_error,
    }));
  }, [companiesHealth]);

  // Convert all permits for SyncCenterDialog
  const allPermitsForSync = useMemo(() => {
    return companiesHealth.flatMap((c) =>
      c.permits.map((p) => ({
        id: p.id,
        company_id: p.company_id,
        permit_type_id: p.permit_type_id,
        permit_number: p.permit_number,
        issue_date: p.issue_date || p.issued_date,
        expiry_date: p.expiration_date || p.expiry_date,
        file_url: p.file_url || "",
      }))
    );
  }, [companiesHealth]);

  return {
    summary,
    companiesHealth: filteredCompanies,
    allCompaniesHealth: companiesHealth,
    allCompaniesCount: companiesHealth.length,
    syncDialogCompanies,
    allPermitsForSync,
    urgentExpiries,
    archivedPermits: filteredArchivedPermits,
    totalArchivedCount: archivedPermits.length,
    isLoading,
    isSyncing,
    syncingCompanyId,
    setIsSyncing,
    syncCompany,
    error,
    searchTerm,
    setSearchTerm,
    healthFilter,
    setHealthFilter,
    refetch: fetchData,
  };
};
