import React from "react";
import {
  Activity,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PermitDashboardHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  healthFilter: string;
  onHealthFilterChange: (value: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PermitDashboardHeader: React.FC<PermitDashboardHeaderProps> = ({
  searchTerm,
  onSearchChange,
  healthFilter,
  onHealthFilterChange,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-border">
      {/* Top Title & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Permit Health Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of company permit compliance, 90-day renewal alerts, and archived records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Health Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Sub-Filters: Health status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-lg border w-fit">
          <button
            type="button"
            onClick={() => onHealthFilterChange("all")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              healthFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            All
          </button>
          <button
            type="button"
            onClick={() => onHealthFilterChange("critical")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              healthFilter === "critical"
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "text-muted-foreground hover:text-destructive"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Action Required: Expired
          </button>
          <button
            type="button"
            onClick={() => onHealthFilterChange("warning")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              healthFilter === "warning"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-amber-600"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Expiring Soon (90 Days)
          </button>
          <button
            type="button"
            onClick={() => onHealthFilterChange("healthy")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              healthFilter === "healthy"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-emerald-600"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Fully Compliant
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search company name or code..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
};
