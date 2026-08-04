import { useState, useEffect, useCallback } from "react";
import { SubsidiaryInput } from "../types/subsidiary.schema";
import { toast } from "sonner"; // Assuming sonner is used for toasts based on package.json

export const useSubsidiary = () => {
  const [data, setData] = useState<SubsidiaryInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubsidiaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/holdings/management/subsidiary");
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch subsidiaries");
      }
      setData(result.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(err instanceof Error ? err : new Error(message));
      toast.error(message || "An error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubsidiaries();
  }, [fetchSubsidiaries]);

  const addSubsidiary = async (payload: SubsidiaryInput) => {
    try {
      const res = await fetch("/api/holdings/management/subsidiary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create subsidiary");
      }
      toast.success("Subsidiary created successfully!");
      fetchSubsidiaries(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create subsidiary");
      throw err;
    }
  };

  const updateSubsidiary = async (id: number, payload: Partial<SubsidiaryInput>) => {
    try {
      const res = await fetch(`/api/holdings/management/subsidiary/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update subsidiary");
      }
      toast.success("Subsidiary updated successfully!");
      fetchSubsidiaries(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update subsidiary");
      throw err;
    }
  };

  const removeSubsidiary = async (id: number) => {
    try {
      const res = await fetch(`/api/holdings/management/subsidiary/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to delete subsidiary");
      }
      toast.success("Subsidiary deleted successfully!");
      fetchSubsidiaries(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subsidiary");
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: fetchSubsidiaries,
    addSubsidiary,
    updateSubsidiary,
    removeSubsidiary,
  };
};
