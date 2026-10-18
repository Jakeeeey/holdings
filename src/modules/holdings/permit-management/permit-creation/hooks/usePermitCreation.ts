"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  PermitCompany,
  PermitTypeItem,
  PermitRecord,
  PermitFormData,
} from "../types/permit-creation.types";

export const usePermitCreation = () => {
  const [companies, setCompanies] = useState<PermitCompany[]>([]);
  const [permitTypes, setPermitTypes] = useState<PermitTypeItem[]>([]);
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [hasInitializedTypes, setHasInitializedTypes] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/holdings/permit-management/permit-creation");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load permit data.");
      }
      const loadedCompanies = result.data?.companies || [];
      const loadedTypes: PermitTypeItem[] = result.data?.permitTypes || [];
      const loadedPermits = result.data?.permits || [];

      setCompanies(loadedCompanies);
      setPermitTypes(loadedTypes);
      setPermits(loadedPermits);

      // Only active permit types are shown by default and selected on first load
      const activeTypes = loadedTypes.filter((t) => t.is_active !== 0 && t.is_active !== false);

      // Initialize all active checkboxes as checked by default on first load
      if (!hasInitializedTypes && loadedTypes.length > 0) {
        setSelectedTypeIds(activeTypes.map((t) => String(t.id)));
        setHasInitializedTypes(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [hasInitializedTypes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Active permit types only
  const activePermitTypes = useMemo(() => {
    return permitTypes.filter((t) => t.is_active !== 0 && t.is_active !== false);
  }, [permitTypes]);

  // Fast permit lookup map by `${company_id}_${permit_type_id}`
  // Excludes or deprioritizes Archived permits so the active/renewed permit is displayed in the matrix
  const permitMap = useMemo(() => {
    const map = new Map<string, PermitRecord>();
    for (const p of permits) {
      if (p.status === "Archived") continue; // Archived records are preserved in audit history, but not shown as matrix cell
      const key = `${p.company_id}_${p.permit_type_id}`;
      if (!map.has(key)) {
        map.set(key, p);
      }
    }
    return map;
  }, [permits]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.company_name.toLowerCase().includes(term) ||
        c.company_code.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  // Filtered permit types based on multi-select checkboxes and active status
  const visiblePermitTypes = useMemo(() => {
    if (selectedTypeIds.length === 0) return [];
    const idSet = new Set(selectedTypeIds);
    return activePermitTypes.filter((t) => idSet.has(String(t.id)));
  }, [activePermitTypes, selectedTypeIds]);

  // Multi-select toggle helpers
  const toggleTypeSelection = useCallback((id: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAllTypes = useCallback(() => {
    setSelectedTypeIds(activePermitTypes.map((t) => String(t.id)));
  }, [activePermitTypes]);

  const unselectAllTypes = useCallback(() => {
    setSelectedTypeIds([]);
  }, []);

  const addPermit = async (payload: PermitFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/holdings/permit-management/permit-creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to add permit.");
      }
      toast.success("Permit record added successfully!");
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add permit.";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePermit = async (id: number | string, payload: Partial<PermitFormData>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/holdings/permit-management/permit-creation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update permit.");
      }
      toast.success("Permit record updated successfully!");
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update permit.";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePermit = async (id: number | string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/holdings/permit-management/permit-creation/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete permit.");
      }
      toast.success("Permit record deleted successfully!");
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete permit.";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPermitType = async (name: string, isActive: boolean = true) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/holdings/permit-management/permit-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_active: isActive ? 1 : 0 }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to create permit type.");
      }
      toast.success("Permit type created successfully!");
      
      // Auto-include the new type in selected columns
      if (result.data?.id) {
        setSelectedTypeIds((prev) => [...prev, String(result.data.id)]);
      }
      
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create permit type.";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePermitType = async (id: number | string, data: { name?: string; is_active?: boolean | number }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/holdings/permit-management/permit-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update permit type.");
      }
      toast.success(result.message || "Permit type updated successfully!");
      await fetchData();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update permit type.";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    companies: filteredCompanies,
    totalCompanies: companies.length,
    permitTypes: visiblePermitTypes,
    activePermitTypes,
    allPermitTypes: permitTypes,
    permits,
    permitMap,
    isLoading,
    isSubmitting,
    error,
    searchTerm,
    setSearchTerm,
    selectedTypeIds,
    setSelectedTypeIds,
    toggleTypeSelection,
    selectAllTypes,
    unselectAllTypes,
    refetch: fetchData,
    addPermit,
    updatePermit,
    deletePermit,
    createPermitType,
    updatePermitType,
  };
};
