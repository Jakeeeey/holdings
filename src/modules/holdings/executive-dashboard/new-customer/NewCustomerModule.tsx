"use client";

import React from "react";
import {
    AlertCircle,
    Loader2,
    Users,
    BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNewCustomerReport } from "./hooks/useNewCustomerReport";
import { NewCustomerFilters } from "./components/NewCustomerFilters";
import { NewCustomerKpis } from "./components/NewCustomerKpis";
import { NewCustomerCharts } from "./components/NewCustomerCharts";
import { NewCustomerTable } from "./components/NewCustomerTable";
import { NewCustomerDetailModal } from "./components/NewCustomerDetailModal";
import { exportNewCustomersCsv } from "./utils/exportCsv";

interface NewCustomerModuleProps {
    groupId?: string | number;
    initialStartDate?: string;
    initialEndDate?: string;
}

export default function NewCustomerModule({
    groupId,
    initialStartDate,
    initialEndDate,
}: NewCustomerModuleProps) {
    const {
        filters,
        setFilters,
        setDatePreset,
        activeTab,
        setActiveTab,
        loading,
        error,
        kpis,
        filterOptions,
        filteredItems,
        paginatedItems,
        totalCount,
        registrationTrends,
        salesmanLeaderboard,
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
        loadData,
        resetFilters,
    } = useNewCustomerReport({ groupId, initialStartDate, initialEndDate });

    const handleExport = () => {
        exportNewCustomersCsv(
            filteredItems,
            `new_customers_report_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
        );
    };

    return (
        <div className="space-y-5">
            {/* Filter Section with Quick Presets */}
            <NewCustomerFilters
                filters={filters}
                onChange={setFilters}
                onPresetChange={setDatePreset}
                onReset={resetFilters}
                onReload={loadData}
                onExport={handleExport}
                loading={loading}
                filterOptions={filterOptions}
                totalFilteredCount={totalCount}
            />

            {/* Error Message */}
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
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Querying customer database...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top KPI Cards */}
            {!loading && <NewCustomerKpis kpis={kpis} />}

            {/* Navigation Tabs (Registry | Analytics) */}
            {!loading && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
                        <TabsList className="bg-muted/60 p-1 rounded-xl">
                            <TabsTrigger
                                value="registry"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                                <Users className="h-3.5 w-3.5" />
                                <span>Customer Registry ({totalCount.toLocaleString()})</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="analytics"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                                <BarChart3 className="h-3.5 w-3.5" />
                                <span>Performance &amp; Demographics</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Customer Registry Table */}
                    <TabsContent value="registry" className="space-y-4 pt-1">
                        <NewCustomerTable
                            data={paginatedItems}
                            totalCount={totalCount}
                            sortField={sortField}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                            onSelectCustomer={setSelectedCustomer}
                            loading={loading}
                        />
                    </TabsContent>

                    {/* Tab 2: Visual Analytics & Breakdown */}
                    <TabsContent value="analytics" className="space-y-4 pt-1">
                        <NewCustomerCharts
                            items={filteredItems}
                            trends={registrationTrends}
                            leaderboard={salesmanLeaderboard}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* Customer Detail Modal */}
            <NewCustomerDetailModal
                customer={selectedCustomer}
                open={Boolean(selectedCustomer)}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    );
}
