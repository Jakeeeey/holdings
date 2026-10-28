"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  FileCheck2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PermitCompany, PermitRecord } from "../types/permit-creation.types";

export type CompanySyncState = "idle" | "syncing" | "success" | "offline" | "unconfigured";

interface SyncCenterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companies: PermitCompany[];
  permits: PermitRecord[];
  onFinishSync: () => Promise<void>;
}

export const SyncCenterDialog: React.FC<SyncCenterDialogProps> = ({
  isOpen,
  onClose,
  companies,
  permits,
  onFinishSync,
}) => {
  // Track individual status for each company
  const [companyStatusMap, setCompanyStatusMap] = useState<
    Record<number, { state: CompanySyncState; message?: string }>
  >({});
  const [activeCompanyIndex, setActiveCompanyIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const companiesRef = useRef(companies);
  const onFinishSyncRef = useRef(onFinishSync);
  const hasRunForCurrentOpen = useRef(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    companiesRef.current = companies;
    onFinishSyncRef.current = onFinishSync;
  }, [companies, onFinishSync]);

  // Initialize status map based on company states
  const initStatuses = useCallback(() => {
    const initialMap: Record<number, { state: CompanySyncState; message?: string }> = {};
    for (const c of companiesRef.current) {
      if (!c.is_directus_configured) {
        initialMap[c.company_id] = { state: "unconfigured", message: "No credentials" };
      } else if (c.connection_status === "offline") {
        initialMap[c.company_id] = { state: "idle", message: "Ready to check" };
      } else {
        initialMap[c.company_id] = { state: "idle", message: "Ready to sync" };
      }
    }
    setCompanyStatusMap(initialMap);
    setActiveCompanyIndex(-1);
    setIsCompleted(false);
  }, []);

  // Sequential runner: processes companies one-by-one with fast feedback
  const runSequentialSync = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    initStatuses();
    setIsProcessing(true);
    setIsCompleted(false);

    const targetCompanies = [...companiesRef.current];

    for (let i = 0; i < targetCompanies.length; i++) {
      const comp = targetCompanies[i];
      setActiveCompanyIndex(i);

      if (!comp.is_directus_configured) {
        setCompanyStatusMap((prev) => ({
          ...prev,
          [comp.company_id]: { state: "unconfigured", message: "Credentials missing" },
        }));
        continue;
      }

      // Set current company to syncing state
      setCompanyStatusMap((prev) => ({
        ...prev,
        [comp.company_id]: { state: "syncing", message: "Checking connection..." },
      }));

      try {
        const res = await fetch("/api/holdings/permit-management/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync-single-company", company_id: comp.company_id }),
        });
        const result = await res.json();

        if (res.ok && result.status === "success") {
          setCompanyStatusMap((prev) => ({
            ...prev,
            [comp.company_id]: { state: "success", message: result.message || "Synced" },
          }));
        } else {
          setCompanyStatusMap((prev) => ({
            ...prev,
            [comp.company_id]: {
              state: "offline",
              message: result.message || "Connection timeout / offline",
            },
          }));
        }
      } catch {
        setCompanyStatusMap((prev) => ({
          ...prev,
          [comp.company_id]: { state: "offline", message: "Unreachable" },
        }));
      }

      // Small 100ms micro-pause for smooth visual progression
      await new Promise((r) => setTimeout(r, 100));
    }

    setActiveCompanyIndex(-1);
    setIsProcessing(false);
    setIsCompleted(true);
    isRunningRef.current = false;

    // Toast notification appears only after the syncing run completes
    toast.success("Company synchronization completed.");
  }, [initStatuses]);

  // Trigger sync strictly ONCE when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!hasRunForCurrentOpen.current) {
        hasRunForCurrentOpen.current = true;
        const timer = setTimeout(() => {
          runSequentialSync();
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      hasRunForCurrentOpen.current = false;
      isRunningRef.current = false;
    }
  }, [isOpen, runSequentialSync]);

  // When user clicks Done or closes the modal after completing, refresh parent data
  const handleDone = async () => {
    if (isCompleted) {
      await onFinishSyncRef.current();
    }
    onClose();
  };

  // Stats calculation
  const syncedCount = Object.values(companyStatusMap).filter(
    (s) => s.state === "success"
  ).length;
  const offlineCount = Object.values(companyStatusMap).filter(
    (s) => s.state === "offline"
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && handleDone()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl w-[96vw] p-0 overflow-hidden flex flex-col gap-0 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl bg-card max-h-[85vh]"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:border-primary/40 flex items-center justify-center shrink-0 shadow-xs">
              <RefreshCw className={`h-5 w-5 ${isProcessing ? "animate-spin text-primary" : ""}`} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                Company Synchronization
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isProcessing
                  ? "Checking company connections and synchronizing permit compliance..."
                  : isCompleted
                  ? "Synchronization process completed for all entities."
                  : "Company connection and permit sync overview."}
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDone}
            disabled={isProcessing}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Status Summary Strip */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-muted/20">
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Online & Synced</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {syncedCount} <span className="text-xs font-normal opacity-80">companies</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-2xs">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <XCircle className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-1">
              {offlineCount} <span className="text-xs font-normal opacity-80">companies</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-background/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Total Permits</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {permits.length} <span className="text-xs font-normal text-muted-foreground">records</span>
            </p>
          </div>
        </div>

        {/* Company Sync List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 max-h-[44vh]">
          {companies.map((company, idx) => {
            const companyPermitCount = permits.filter(
              (p) => Number(p.company_id) === company.company_id
            ).length;
            const statusInfo = companyStatusMap[company.company_id] || { state: "idle" };
            const isCurrentlySyncing = isProcessing && activeCompanyIndex === idx;

            return (
              <div
                key={company.company_id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 shadow-2xs ${
                  isCurrentlySyncing
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30"
                    : "border-slate-200 dark:border-slate-700/80 bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 border ${
                      isCurrentlySyncing
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-primary/10 border-primary/20 text-primary"
                    }`}
                  >
                    {company.company_code ? company.company_code.substring(0, 2).toUpperCase() : "CO"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate max-w-[280px]">
                      {company.company_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCheck2 className="h-3 w-3 text-primary/70" />
                        {companyPermitCount} permits loaded
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {statusInfo.state === "syncing" || isCurrentlySyncing ? (
                    <span className="text-[11px] text-primary flex items-center gap-1.5 font-medium animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Checking...
                    </span>
                  ) : statusInfo.state === "success" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 h-5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 gap-1 font-semibold"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Synced
                    </Badge>
                  ) : statusInfo.state === "offline" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 h-5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 gap-1 cursor-help font-semibold"
                      title={statusInfo.message || "Company API is currently offline."}
                    >
                      <XCircle className="h-2.5 w-2.5" />
                      Offline
                    </Badge>
                  ) : statusInfo.state === "unconfigured" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                    >
                      Unconfigured
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground">
            {isProcessing ? (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Synchronizing ({activeCompanyIndex + 1} of {companies.length})...
              </span>
            ) : isCompleted ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Synchronization completed
              </span>
            ) : (
              <span>Ready to synchronize</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runSequentialSync}
              disabled={isProcessing}
              className="h-8 text-xs px-3 gap-1.5 border-slate-300 dark:border-slate-600 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isProcessing ? "animate-spin" : ""}`} />
              <span>{isProcessing ? "Syncing..." : "Sync Again"}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDone}
              disabled={isProcessing}
              className="h-8 text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
