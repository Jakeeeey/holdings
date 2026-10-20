"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Users,
  UserX,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useLostCustomerManagement } from "./hooks/useLostCustomerManagement";
import { LostCustomerFilters } from "./components/LostCustomerFilters";
import { LostCustomerKpis } from "./components/LostCustomerKpis";
import { LostCustomerCharts } from "./components/LostCustomerCharts";
import { LostCustomerTable } from "./components/LostCustomerTable";
import { LostCustomerDetailModal } from "./components/LostCustomerDetailModal";
import { exportLostCustomersCsv } from "./utils/exportCsv";

interface LostCustomerModuleProps {
  groupId?: string | number;
}

export default function LostCustomerModule({ groupId }: LostCustomerModuleProps) {
  const {
    filters,
    setFilters,
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
  } = useLostCustomerManagement({ groupId });

  const [activeTab, setActiveTab] = useState("accounts");

  const handleExport = () => {
    exportLostCustomersCsv(
      filteredCustomers,
      `lost_customers_${filters.tagging || "all"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="space-y-5 pt-1">
      {/* Filter Bar */}
      <LostCustomerFilters
        filters={filters}
        onChange={setFilters}
        uniqueTaggings={uniqueTaggings}
        onReset={resetFilters}
        onReload={loadData}
        onExport={handleExport}
        loading={loading}
        totalCount={filteredCustomers.length}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center p-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">
                Querying lost customer database...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Summary Cards */}
      {!loading && <LostCustomerKpis kpis={kpis} />}

      {/* Tabs: Accounts Registry vs Analytics Breakdown */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger
                value="accounts"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Inactive Accounts ({filteredCustomers.length.toLocaleString()})</span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Churn Analytics &amp; High-Risk</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Accounts Table */}
          <TabsContent value="accounts" className="space-y-4 pt-1">
            <LostCustomerTable
              data={paginatedCustomers}
              totalCount={filteredCustomers.length}
              currentPage={page}
              pageSize={pageSize}
              totalPages={totalPages}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              onSelectCustomer={setSelectedCustomer}
              loading={loading}
            />
          </TabsContent>

          {/* Tab 2: Analytics & Priority Accounts */}
          <TabsContent value="analytics" className="space-y-4 pt-1">
            <LostCustomerCharts
              taggingDistribution={taggingDistribution}
              inactivityDistribution={inactivityDistribution}
              topAtRiskCustomers={topAtRiskCustomers}
              onSelectCustomer={setSelectedCustomer}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Detail Modal */}
      <LostCustomerDetailModal
        customer={selectedCustomer}
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
