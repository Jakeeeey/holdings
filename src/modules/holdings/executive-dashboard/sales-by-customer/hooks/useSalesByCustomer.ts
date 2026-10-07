"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fetchSalesByCustomerData } from "../providers/fetchProvider";
import {
  SalesReportItemizedRecord,
  CustomerSummary,
  CustomerFilters,
  CustomerKpis,
  SupplierBreakdown,
  SalesmanBreakdown,
  CustomerTransactionRecord,
} from "../types";

export interface UseSalesByCustomerOptions {
  groupId?: string | number;
}

export function useSalesByCustomer(options?: UseSalesByCustomerOptions) {
  const groupId = options?.groupId;
  const today = new Date();
  const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const [filters, setFilters] = useState<CustomerFilters>({
    startDate: defaultStart,
    endDate: defaultEnd,
    search: "",
    division: "ALL",
    supplier: "ALL",
    salesman: "ALL",
    storeType: "ALL",
  });

  const [rawData, setRawData] = useState<SalesReportItemizedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected customer for drill-down modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof CustomerSummary>("totalSales");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalesByCustomerData(filters.startDate, filters.endDate, groupId);
      setRawData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load sales data";
      setError(msg);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract Unique Filter Options from rawData
  const filterOptions = useMemo(() => {
    const divs = new Set<string>();
    const sups = new Set<string>();
    const smen = new Set<string>();
    const types = new Set<string>();

    rawData.forEach((item) => {
      if (item.divisionName?.trim()) divs.add(item.divisionName.trim());
      const sup = (item.productSupplier || item.supplierName)?.trim();
      if (sup) sups.add(sup);
      const smName = (item.salesman || item.salesmanName)?.trim();
      if (smName) smen.add(smName);
      const type = (item.storeType || item.storeTypeLabel)?.trim();
      if (type) types.add(type);
    });

    return {
      divisions: Array.from(divs).sort(),
      suppliers: Array.from(sups).sort(),
      salesmen: Array.from(smen).sort(),
      storeTypes: Array.from(types).sort(),
    };
  }, [rawData]);

  // Filter Raw Data based on dropdowns
  const filteredRawData = useMemo(() => {
    return rawData.filter((item) => {
      if (filters.division !== "ALL" && item.divisionName?.trim() !== filters.division) {
        return false;
      }
      const itemSup = (item.productSupplier || item.supplierName)?.trim();
      if (filters.supplier !== "ALL" && itemSup !== filters.supplier) {
        return false;
      }
      const smName = (item.salesman || item.salesmanName)?.trim();
      if (filters.salesman !== "ALL" && smName !== filters.salesman) {
        return false;
      }
      const type = (item.storeType || item.storeTypeLabel)?.trim();
      if (filters.storeType !== "ALL" && type !== filters.storeType) {
        return false;
      }
      return true;
    });
  }, [rawData, filters.division, filters.supplier, filters.salesman, filters.storeType]);

  // Group and Aggregate by Customer
  const { customerSummaries, kpis, totalFilteredSales } = useMemo(() => {
    const map = new Map<
      string,
      {
        customerName: string;
        customerCode: string;
        storeType: string;
        divisionName: string;
        customerAddress: string;
        province: string;
        city: string;
        totalSales: number;
        transactionCount: number;
        suppliers: Map<string, number>;
        salesmen: Map<string, number>;
      }
    >();

    let totalSales = 0;
    let totalTransactions = 0;

    filteredRawData.forEach((item) => {
      const customerName = (item.customerName || item.storeName || "Unknown Customer").trim();
      const amount = Number(item.productNetAmount ?? item.productSalesAmount ?? item.totalAmount ?? item.amount ?? item.netAmount ?? 0);

      totalSales += amount;
      totalTransactions += 1;

      if (!map.has(customerName)) {
        map.set(customerName, {
          customerName,
          customerCode: item.customerCode || "-",
          storeType: item.storeType || item.storeTypeLabel || "Standard",
          divisionName: item.divisionName || "N/A",
          customerAddress: item.customerAddress || "",
          province: item.province || "",
          city: item.city || "",
          totalSales: 0,
          transactionCount: 0,
          suppliers: new Map(),
          salesmen: new Map(),
        });
      }

      const current = map.get(customerName)!;
      current.totalSales += amount;
      current.transactionCount += 1;

      // Track supplier breakdown
      const sup = (item.productSupplier || item.supplierName || "Other").trim();
      current.suppliers.set(sup, (current.suppliers.get(sup) || 0) + amount);

      // Track salesman breakdown
      const sm = (item.salesman || item.salesmanName || "Other").trim();
      current.salesmen.set(sm, (current.salesmen.get(sm) || 0) + amount);
    });

    const summaries: CustomerSummary[] = Array.from(map.values()).map((c) => {
      // Find top supplier
      let topSup = "N/A";
      let maxSupAmount = -Infinity;
      c.suppliers.forEach((val, key) => {
        if (val > maxSupAmount) {
          maxSupAmount = val;
          topSup = key;
        }
      });

      // Find top salesman
      let topSm = "N/A";
      let maxSmAmount = -Infinity;
      c.salesmen.forEach((val, key) => {
        if (val > maxSmAmount) {
          maxSmAmount = val;
          topSm = key;
        }
      });

      const percentageShare = totalSales > 0 ? (c.totalSales / totalSales) * 100 : 0;
      const averageOrderValue = c.transactionCount > 0 ? c.totalSales / c.transactionCount : 0;

      return {
        customerName: c.customerName,
        customerCode: c.customerCode,
        storeType: c.storeType,
        divisionName: c.divisionName,
        customerAddress: c.customerAddress,
        province: c.province,
        city: c.city,
        totalSales: c.totalSales,
        transactionCount: c.transactionCount,
        averageOrderValue,
        percentageShare,
        topSupplier: topSup,
        topSalesman: topSm,
      };
    });

    const calculatedKpis: CustomerKpis = {
      totalSales,
      totalCustomers: summaries.length,
      totalTransactions,
      averageSalesPerCustomer: summaries.length > 0 ? totalSales / summaries.length : 0,
    };

    return {
      customerSummaries: summaries,
      kpis: calculatedKpis,
      totalFilteredSales: totalSales,
    };
  }, [filteredRawData]);

  // Filter by search query
  const searchedSummaries = useMemo(() => {
    if (!filters.search.trim()) return customerSummaries;
    const q = filters.search.toLowerCase().trim();
    return customerSummaries.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.storeType.toLowerCase().includes(q) ||
        c.divisionName.toLowerCase().includes(q) ||
        c.customerAddress.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q),
    );
  }, [customerSummaries, filters.search]);

  // Sort Customer Summaries
  const sortedSummaries = useMemo(() => {
    return [...searchedSummaries].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchedSummaries, sortField, sortOrder]);

  // Paginated Customer Summaries
  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSummaries.slice(start, start + pageSize);
  }, [sortedSummaries, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedSummaries.length / pageSize));

  const handleSort = (field: keyof CustomerSummary) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Customer Detail Breakdown for modal
  const customerDetailData = useMemo(() => {
    if (!selectedCustomer) {
      return {
        suppliers: [] as SupplierBreakdown[],
        salesmen: [] as SalesmanBreakdown[],
        transactions: [] as CustomerTransactionRecord[],
      };
    }

    const customerTransactions = filteredRawData.filter(
      (item) =>
        (item.customerName || item.storeName || "Unknown Customer").trim() ===
        selectedCustomer.customerName,
    );

    const supMap = new Map<string, { totalSales: number; count: number }>();
    const smMap = new Map<string, { totalSales: number; count: number }>();
    const txList: CustomerTransactionRecord[] = [];

    customerTransactions.forEach((tx) => {
      const amount = Number(tx.productNetAmount ?? tx.productSalesAmount ?? tx.totalAmount ?? tx.amount ?? tx.netAmount ?? 0);
      const supName = (tx.productSupplier || tx.supplierName || "Other").trim();
      const smName = (tx.salesman || tx.salesmanName || "Other").trim();

      const sCurr = supMap.get(supName) || { totalSales: 0, count: 0 };
      sCurr.totalSales += amount;
      sCurr.count += 1;
      supMap.set(supName, sCurr);

      const mCurr = smMap.get(smName) || { totalSales: 0, count: 0 };
      mCurr.totalSales += amount;
      mCurr.count += 1;
      smMap.set(smName, mCurr);

      txList.push({
        transactionDate: tx.invoiceDate || tx.transactionDate || "-",
        invoiceNo: tx.invoiceNo || "-",
        divisionName: tx.divisionName || "N/A",
        salesmanName: smName,
        supplierName: supName,
        productName: tx.productName,
        netAmount: amount,
      });
    });

    const suppliers: SupplierBreakdown[] = Array.from(supMap.entries())
      .map(([supplierName, data]) => ({
        supplierName,
        totalSales: data.totalSales,
        transactionCount: data.count,
        percentage:
          selectedCustomer.totalSales > 0
            ? (data.totalSales / selectedCustomer.totalSales) * 100
            : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const salesmen: SalesmanBreakdown[] = Array.from(smMap.entries())
      .map(([salesmanName, data]) => ({
        salesmanName,
        totalSales: data.totalSales,
        transactionCount: data.count,
        percentage:
          selectedCustomer.totalSales > 0
            ? (data.totalSales / selectedCustomer.totalSales) * 100
            : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    txList.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

    return { suppliers, salesmen, transactions: txList };
  }, [selectedCustomer, filteredRawData]);

  const resetFilters = () => {
    setFilters({
      startDate: defaultStart,
      endDate: defaultEnd,
      search: "",
      division: "ALL",
      supplier: "ALL",
      salesman: "ALL",
      storeType: "ALL",
    });
    setCurrentPage(1);
  };

  return {
    filters,
    setFilters,
    loading,
    error,
    kpis,
    filterOptions,
    customerSummaries: sortedSummaries,
    paginatedSummaries,
    totalCustomersCount: sortedSummaries.length,
    totalFilteredSales,
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    selectedCustomer,
    setSelectedCustomer,
    customerDetailData,
    loadData,
    resetFilters,
  };
}
