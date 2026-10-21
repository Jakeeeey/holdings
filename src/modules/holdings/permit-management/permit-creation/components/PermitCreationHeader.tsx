"use client";

import React from "react";
import { Search, FileCheck2, ChevronDown, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PermitTypeItem } from "../types/permit-creation.types";

interface PermitCreationHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTypeIds: string[];
  onToggleType: (id: string) => void;
  onSelectAllTypes: () => void;
  onUnselectAllTypes: () => void;
  permitTypes: PermitTypeItem[];
  totalCompanies: number;
  totalPermits?: number;
  isLoading?: boolean;
  isSyncing?: boolean;
  onRefresh?: () => void;
  onSyncCompanies?: () => void;
  onOpenNewPermit?: () => void;
  onOpenAddPermitType?: () => void;
}

export const PermitCreationHeader: React.FC<PermitCreationHeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedTypeIds,
  onToggleType,
  onSelectAllTypes,
  onUnselectAllTypes,
  permitTypes,
  totalCompanies,
  isSyncing,
  onSyncCompanies,
  onOpenAddPermitType,
}) => {
  const allCount = permitTypes.length;
  const selectedCount = selectedTypeIds.length;

  const getTriggerLabel = () => {
    if (selectedCount === allCount && allCount > 0) {
      return "All Permit Types";
    }
    if (selectedCount === 0) {
      return "None Selected";
    }
    return `${selectedCount} Types Selected`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs transition-colors">
      {/* Left: Refined Title Section */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:border-primary/40 flex items-center justify-center shrink-0 shadow-xs">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Permit Creation
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 tracking-wide font-mono">
              {totalCompanies} Companies
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Company compliance matrix and permit management
          </p>
        </div>
      </div>

      {/* Right: Inline Controls with Elevated Aesthetics */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 transition-colors peer-focus:text-primary" />
          <Input
            type="text"
            placeholder="Search company name or code..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="peer pl-9 h-9 text-xs rounded-lg border-slate-300 dark:border-slate-700 bg-background hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Multi-Select Dropdown */}
        <div className="w-full sm:w-56">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full h-9 justify-between text-xs font-medium px-3 rounded-lg border-slate-300 dark:border-slate-700 bg-background hover:border-slate-400 dark:hover:border-slate-600 hover:bg-accent/50 text-foreground transition-all"
              >
                <span className="truncate">{getTriggerLabel()}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground ml-1.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="w-72 p-0 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-popover text-popover-foreground z-50 backdrop-blur-md"
            >
              {/* Header with Quick Actions */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs">
                <span className="font-semibold text-foreground">
                  Columns ({selectedCount}/{allCount})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAllTypes}
                    className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground/40">•</span>
                  <button
                    type="button"
                    onClick={onUnselectAllTypes}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Unselect All
                  </button>
                </div>
              </div>

              {/* Checklist of Permit Types */}
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                {permitTypes.map((type) => {
                  const strId = String(type.id);
                  const isChecked = selectedTypeIds.includes(strId);
                  const label = type.name || type.permit_type_name || `Type ${type.id}`;

                  return (
                    <div
                      key={strId}
                      onClick={() => onToggleType(strId)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs select-none transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleType(strId)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 border-slate-400 dark:border-slate-600 data-[state=checked]:border-primary data-[state=checked]:bg-primary cursor-pointer"
                      />
                      <span className="truncate text-xs font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                  );
                })}
                {permitTypes.length === 0 && (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No permit types found.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sync Companies Button */}
        {onSyncCompanies && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSyncCompanies}
            disabled={isSyncing}
            className="h-9 px-3.5 gap-2 text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700 bg-background hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-all cursor-pointer shadow-2xs"
            title="Synchronize permit requirements with all company Directus instances"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Companies"}</span>
          </Button>
        )}

        {/* Primary Action Button: Manage Permit Types */}
        {onOpenAddPermitType && (
          <Button
            type="button"
            size="sm"
            onClick={onOpenAddPermitType}
            className="h-9 px-4 gap-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer"
            title="Manage permit requirement types"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Manage Permit Types</span>
          </Button>
        )}
      </div>
    </div>
  );
};
