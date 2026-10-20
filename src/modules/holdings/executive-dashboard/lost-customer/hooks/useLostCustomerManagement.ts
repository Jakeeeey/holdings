import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LostCustomerFilters,
  LostCustomerRecord,
  LostCustomerKpis,
  SortField,
  SortOrder,
  TaggingDistributionItem,
  InactivityRangeDistribution,
} from "../types";
import { fetchLostCustomerData } from "../providers/fetchProvider";

interface UseLostCustomerManagementOptions {
  groupId?: string | number;
}

export function useLostCustomerManagement(options: UseLostCustomerManagementOptions = {}) {
  const { groupId } = options;

  const [filters, setFilters] = useState<LostCustomerFilters>({
    customerCode: "",
    customerName: "",
    tagging: "ALL",
    minDaysNoSales: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<LostCustomerRecord[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("minDaysNoSales");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] =
    useState<LostCustomerRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLostCustomerData(groupId, filters);
      setCustomers(data.records);
      setPage(1);
    } catch (err: unknown) {
      console.error("[useLostCustomerManagement] loadData error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load lost customer records";
      setError(msg);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters({
      customerCode: "",
      customerName: "",
      tagging: "ALL",
      minDaysNoSales: "",
    });
    setSearchQuery("");
  }, []);

  // Distinct tags
  const uniqueTaggings = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach((c) => {
      if (c.tagging && c.tagging.trim()) {
        tags.add(c.tagging.trim());
      }
    });
    return Array.from(tags).sort();
  }, [customers]);

  // Client-side quick filter
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.customerCode.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.tagging.toLowerCase().includes(q) ||
          (c.salesmanName && c.salesmanName.toLowerCase().includes(q)) ||
          (c.branchName && c.branchName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [customers, searchQuery]);

  // Client-side sorting
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, page, pageSize]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortOrder("desc");
      return field;
    });
  }, []);

  // KPIs
  const kpis = useMemo<LostCustomerKpis>(() => {
    const total = filteredCustomers.length;
    let atRisk = 0;
    let dormant = 0;
    let lost = 0;
    let totalDays = 0;
    let totalValue = 0;

    filteredCustomers.forEach((c) => {
      const lower = c.tagging.toLowerCase();
      if (lower.includes("risk")) atRisk++;
      else if (lower.includes("dormant")) dormant++;
      else if (lower.includes("lost")) lost++;

      totalDays += c.minDaysNoSales;
      totalValue += c.totalHistoricalSales;
    });

    return {
      totalCustomers: total,
      atRiskCount: atRisk,
      dormantCount: dormant,
      lostCount: lost,
      avgDaysInactive: total > 0 ? Math.round(totalDays / total) : 0,
      totalValueAtRisk: totalValue,
    };
  }, [filteredCustomers]);

  // Tagging Distribution
  const taggingDistribution = useMemo<TaggingDistributionItem[]>(() => {
    const map = new Map<string, { count: number; totalSales: number }>();

    filteredCustomers.forEach((c) => {
      const t = c.tagging || "Unassigned";
      const existing = map.get(t) || { count: 0, totalSales: 0 };
      map.set(t, {
        count: existing.count + 1,
        totalSales: existing.totalSales + c.totalHistoricalSales,
      });
    });

    const totalCount = filteredCustomers.length;
    return Array.from(map.entries())
      .map(([tag, val]) => ({
        tag,
        count: val.count,
        totalSales: val.totalSales,
        share: totalCount > 0 ? (val.count / totalCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCustomers]);

  // Inactivity Range Distribution
  const inactivityDistribution = useMemo<InactivityRangeDistribution[]>(() => {
    const buckets: Record<string, { count: number; totalSales: number }> = {
      "30-60 Days": { count: 0, totalSales: 0 },
      "61-90 Days": { count: 0, totalSales: 0 },
      "91-180 Days": { count: 0, totalSales: 0 },
      "180+ Days": { count: 0, totalSales: 0 },
    };

    filteredCustomers.forEach((c) => {
      const days = c.minDaysNoSales;
      if (days >= 180) {
        buckets["180+ Days"].count++;
        buckets["180+ Days"].totalSales += c.totalHistoricalSales;
      } else if (days >= 91) {
        buckets["91-180 Days"].count++;
        buckets["91-180 Days"].totalSales += c.totalHistoricalSales;
      } else if (days >= 61) {
        buckets["61-90 Days"].count++;
        buckets["61-90 Days"].totalSales += c.totalHistoricalSales;
      } else {
        buckets["30-60 Days"].count++;
        buckets["30-60 Days"].totalSales += c.totalHistoricalSales;
      }
    });

    return Object.entries(buckets).map(([range, val]) => ({
      range,
      count: val.count,
      totalSales: val.totalSales,
    }));
  }, [filteredCustomers]);

  // Top at-risk customers by historical value
  const topAtRiskCustomers = useMemo(() => {
    return [...filteredCustomers]
      .sort((a, b) => b.totalHistoricalSales - a.totalHistoricalSales)
      .slice(0, 5);
  }, [filteredCustomers]);

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    filteredCustomers,
    paginatedCustomers,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedCustomer,
    setSelectedCustomer,
    uniqueTaggings,
    kpis,
    taggingDistribution,
    inactivityDistribution,
    topAtRiskCustomers,
    loadData,
    resetFilters,
  };
}
