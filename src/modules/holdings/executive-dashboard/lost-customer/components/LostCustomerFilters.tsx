"use client";

import React from "react";
import {
  Search,
  RotateCcw,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LostCustomerFilters as FiltersType } from "../types";

interface LostCustomerFiltersProps {
  filters: FiltersType;
  onChange: React.Dispatch<React.SetStateAction<FiltersType>>;
  uniqueTaggings: string[];
  onReset: () => void;
  onReload: () => void;
  onExport: () => void;
  loading: boolean;
  totalCount: number;
}

const MIN_DAYS_PRESETS = [
  { label: "Any Inactivity", value: "" },
  { label: "30+ Days", value: "30" },
  { label: "60+ Days", value: "60" },
  { label: "90+ Days", value: "90" },
  { label: "120+ Days", value: "120" },
  { label: "180+ Days", value: "180" },
  { label: "365+ Days", value: "365" },
];

export function LostCustomerFilters({
  filters,
  onChange,
  uniqueTaggings,
  onReset,
  onReload,
  onExport,
  loading,
  totalCount,
}: LostCustomerFiltersProps) {
  const activeFiltersCount = [
    Boolean(filters.customerCode),
    Boolean(filters.customerName),
    filters.tagging && filters.tagging !== "ALL",
    Boolean(filters.minDaysNoSales),
  ].filter(Boolean).length;

  const handleFieldChange = (key: keyof FiltersType, val: string) => {
    onChange((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Account Filters
          </span>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            >
              {activeFiltersCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            disabled={loading || totalCount === 0}
            className="h-8 gap-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Customer Name Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Customer / Store Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="e.g. Acme Store, John..."
              value={filters.customerName}
              onChange={(e) => handleFieldChange("customerName", e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-xl bg-muted/20 border-border/80"
            />
            {filters.customerName && (
              <button
                type="button"
                onClick={() => handleFieldChange("customerName", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Code Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Customer Code
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="e.g. CUST-1049..."
              value={filters.customerCode}
              onChange={(e) => handleFieldChange("customerCode", e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-xl bg-muted/20 border-border/80 font-mono"
            />
            {filters.customerCode && (
              <button
                type="button"
                onClick={() => handleFieldChange("customerCode", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status / Tagging Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3 text-red-500" />
            <span>Tagging / Churn Status</span>
          </label>
          <Select
            value={filters.tagging}
            onValueChange={(val) => handleFieldChange("tagging", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/20 border-border/80">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {uniqueTaggings.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Days Inactive Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-amber-500" />
            <span>Min Days Inactive</span>
          </label>
          <Select
            value={filters.minDaysNoSales}
            onValueChange={(val) => handleFieldChange("minDaysNoSales", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/20 border-border/80">
              <SelectValue placeholder="Any Inactivity" />
            </SelectTrigger>
            <SelectContent>
              {MIN_DAYS_PRESETS.map((p) => (
                <SelectItem key={p.value || "all"} value={p.value || "ALL"}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
