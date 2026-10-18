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

  return {
    summary,
    companiesHealth: filteredCompanies,
    allCompaniesCount: companiesHealth.length,
    urgentExpiries,
    archivedPermits: filteredArchivedPermits,
    totalArchivedCount: archivedPermits.length,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    healthFilter,
    setHealthFilter,
    refetch: fetchData,
  };
};
