"use client";

import React from "react";
import {
    Search,
    RotateCcw,
    Download,
    RefreshCw,
    SlidersHorizontal,
    X,
    Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NewCustomerFilters as FilterType, DatePreset } from "../types";

interface NewCustomerFiltersProps {
    filters: FilterType;
    onChange: (filters: FilterType) => void;
    onPresetChange: (preset: DatePreset) => void;
    onReset: () => void;
    onReload: () => void;
    onExport: () => void;
    loading: boolean;
    filterOptions: {
        provinces: string[];
        cities: string[];
        storeTypes: string[];
        customerTypes: string[];
    };
    totalFilteredCount: number;
}

const PRESETS: { id: DatePreset; label: string }[] = [
    { id: "this-month", label: "This Month" },
    { id: "last-30-days", label: "Last 30 Days" },
    { id: "this-quarter", label: "This Quarter" },
    { id: "this-year", label: "This Year" },
    { id: "all-time", label: "All Time" },
    { id: "custom", label: "Custom" },
];

export const NewCustomerFilters: React.FC<NewCustomerFiltersProps> = ({
    filters,
    onChange,
    onPresetChange,
    onReset,
    onReload,
    onExport,
    loading,
    filterOptions,
    totalFilteredCount,
}) => {
    const handleFieldChange = (key: keyof FilterType, value: string) => {
        onChange({
            ...filters,
            [key]: value,
            preset: key === "startDate" || key === "endDate" ? "custom" : filters.preset,
        });
    };

    const hasActiveFilters =
        Boolean(filters.search) ||
        filters.province !== "ALL" ||
        filters.city !== "ALL" ||
        filters.storeType !== "ALL" ||
        filters.status !== "ALL" ||
        filters.type !== "ALL" ||
        filters.preset !== "this-month";

    return (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
            {/* Row 1: Quick Preset Buttons & Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>Period:</span>
                    </span>
                    {PRESETS.map((p) => {
                        const active = filters.preset === p.id;
                        return (
                            <Button
                                key={p.id}
                                variant={active ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPresetChange(p.id)}
                                className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all ${
                                    active
                                        ? "shadow-sm"
                                        : "border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {p.label}
                            </Button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReload}
                        disabled={loading}
                        className="h-8 gap-1.5 text-xs font-semibold rounded-lg border-border/60"
                        title="Reload Data"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={onExport}
                        disabled={loading || totalFilteredCount === 0}
                        className="h-8 gap-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        title="Export filtered records to CSV"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Row 2: Search Input and Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {/* Search */}
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search customer, store, code..."
                        value={filters.search}
                        onChange={(e) => handleFieldChange("search", e.target.value)}
                        className="h-9 pl-9 text-xs rounded-lg border-border/70 focus-visible:ring-primary/40 bg-background/50"
                    />
                    {filters.search && (
                        <button
                            onClick={() => handleFieldChange("search", "")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Province Dropdown */}
                <div>
                    <Select
                        value={filters.province}
                        onValueChange={(val) => handleFieldChange("province", val)}
                    >
                        <SelectTrigger className="h-9 text-xs rounded-lg border-border/70 bg-background/50">
                            <SelectValue placeholder="Province" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            <SelectItem value="ALL">All Provinces</SelectItem>
                            {filterOptions.provinces.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* City Dropdown */}
                <div>
                    <Select
                        value={filters.city}
                        onValueChange={(val) => handleFieldChange("city", val)}
                    >
                        <SelectTrigger className="h-9 text-xs rounded-lg border-border/70 bg-background/50">
                            <SelectValue placeholder="City / Municipality" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            <SelectItem value="ALL">All Cities</SelectItem>
                            {filterOptions.cities.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Store Type Dropdown */}
                <div>
                    <Select
                        value={filters.storeType}
                        onValueChange={(val) => handleFieldChange("storeType", val)}
                    >
                        <SelectTrigger className="h-9 text-xs rounded-lg border-border/70 bg-background/50">
                            <SelectValue placeholder="Store Type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            <SelectItem value="ALL">All Store Types</SelectItem>
                            {filterOptions.storeTypes.map((st) => (
                                <SelectItem key={st} value={st}>
                                    {st}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Active Status */}
                <div>
                    <Select
                        value={filters.status}
                        onValueChange={(val) => handleFieldChange("status", val)}
                    >
                        <SelectTrigger className="h-9 text-xs rounded-lg border-border/70 bg-background/50">
                            <SelectValue placeholder="Active Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active Only</SelectItem>
                            <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Row 3: Custom Date Range Inputs + Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <SlidersHorizontal className="h-3 w-3 text-primary" />
                        <span>Date Range:</span>
                    </span>
                    <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFieldChange("startDate", e.target.value)}
                        className="h-8 w-36 text-xs rounded-md border-border/70 bg-background/50"
                    />
                    <span className="text-muted-foreground font-semibold">to</span>
                    <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFieldChange("endDate", e.target.value)}
                        className="h-8 w-36 text-xs rounded-md border-border/70 bg-background/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-md">
                        {totalFilteredCount.toLocaleString()} {totalFilteredCount === 1 ? "Record" : "Records"}
                    </Badge>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset Filters</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
