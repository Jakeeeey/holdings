import { useState, useEffect } from "react";
import { ExecutiveDashboardResponse } from "@/types/executive-dashboard.schema";

export function useExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/holdings/executive-dashboard");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, isLoading, error, refresh };
}
