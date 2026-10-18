"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  BellRing,
  Eye,
  FileText,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardPermitItem } from "../types/permit-dashboard.types";
import { DashboardPermitPreviewDialog } from "./DashboardPermitPreviewDialog";

interface UpcomingExpiryAlertsProps {
  urgentPermits: DashboardPermitItem[];
  allCompanyPermits?: DashboardPermitItem[];
}

export const UpcomingExpiryAlerts: React.FC<UpcomingExpiryAlertsProps> = ({
  urgentPermits,
  allCompanyPermits = [],
}) => {
  const [previewPermit, setPreviewPermit] = useState<DashboardPermitItem | null>(null);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string | number) => {
    setFailedUrls((prev) => ({ ...prev, [id]: true }));
  };

  const getAbsoluteFileUrl = (url?: string | null) => {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    if (url.startsWith("/assets/")) {
      return `${baseUrl}${url}`;
    }
    return url;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const clean = dateStr.substring(0, 10);
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (urgentPermits.length === 0) {
    return (
      <div className="border border-emerald-500/30 bg-emerald-500/[0.04] rounded-xl p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            All Monitored Permits Are In Good Standing
          </h4>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
            No active permits are expired or expiring within 90 days (3 months).
          </p>
        </div>
      </div>
    );
  }

  const expiredCount = urgentPermits.filter((p) => p.health_level === "critical").length;
  const expiringCount = urgentPermits.filter((p) => p.health_level === "warning").length;

  return (
    <>
      <div className="border border-amber-500/30 bg-amber-500/[0.02] rounded-xl p-4.5 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Permits Requiring Immediate Attention
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold font-mono"
                >
                  {urgentPermits.length}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                List of permits currently expired or expiring within 90 days (3 months)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {expiredCount > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-destructive/15 text-destructive font-semibold flex items-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5" />
                {expiredCount} Expired
              </span>
            )}
            {expiringCount > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {expiringCount} Expiring Soon
              </span>
            )}
          </div>
        </div>

        {/* Grid of Highlighted Alert Cards matching PermitProductCard visual hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {urgentPermits.map((permit) => {
            const isExpired = permit.health_level === "critical";
            const fileUrl = getAbsoluteFileUrl(permit.file_url);
            const isPdf = /\.pdf$/i.test(permit.file_url || "");
            const isExplicitImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(permit.file_url || "");
            const isDirectusAsset = Boolean(permit.file_url && permit.file_url.includes("/assets/"));
            const hasFailed = Boolean(failedUrls[permit.id]);
            const isImage = (isExplicitImage || isDirectusAsset) && !isPdf && !hasFailed;

            return (
              <div
                key={permit.id}
                onClick={() => setPreviewPermit(permit)}
                className="group relative rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer select-none"
              >
                {/* Top Image / Document Showcase Canvas with object-cover and graceful fallback */}
                <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center border-b border-border/60">
                  {fileUrl && !hasFailed && isImage ? (
                    <img
                      src={fileUrl}
                      alt={permit.permit_number}
                      onError={() => handleImageError(permit.id)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : fileUrl && !hasFailed && isPdf ? (
                    <div className="w-full h-full relative overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                      <object
                        data={`${fileUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        onError={() => handleImageError(permit.id)}
                        className="w-full h-full object-cover pointer-events-none scale-100 group-hover:scale-105 transition-transform duration-300"
                      >
                        <iframe
                          src={`${fileUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-full border-0 pointer-events-none"
                          title="PDF Preview"
                          onError={() => handleImageError(permit.id)}
                        />
                      </object>
                    </div>
                  ) : fileUrl && !hasFailed ? (
                    <img
                      src={fileUrl}
                      alt={permit.permit_number}
                      onError={() => handleImageError(permit.id)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : fileUrl ? (
                    /* Graceful Document Card Fallback when file cannot be rendered as raw image */
                    <div className="w-full h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/90 flex flex-col items-center justify-center p-3 relative">
                      <div className="w-16 h-20 bg-white dark:bg-slate-700/80 rounded-lg shadow-xs border border-border/80 flex flex-col items-center justify-center p-1.5 gap-1.5 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        <div className="p-1 rounded bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="w-9 h-1 bg-muted rounded-full" />
                        <div className="w-6 h-1 bg-muted rounded-full" />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground mt-2 font-medium">
                        Official Document
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                      <FileQuestion className="h-7 w-7" />
                      <span className="text-[10px] font-medium">No Attachment</span>
                    </div>
                  )}

                  {/* Top-Right Floating Status Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10 shadow-xs">
                    {isExpired ? (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-5 px-1.5 font-bold shadow-xs gap-1"
                      >
                        <AlertOctagon className="h-3 w-3" />
                        {permit.days_remaining < 0
                          ? `${Math.abs(permit.days_remaining)}d overdue`
                          : "Expired"}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 bg-amber-500/90 text-white border-amber-600 backdrop-blur-xs font-bold shadow-xs gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {permit.days_remaining}d left
                      </Badge>
                    )}
                  </div>

                  {/* Top-Left Company Pill for Immediate Identification */}
                  <div className="absolute top-2.5 left-2.5 z-10 max-w-[65%]">
                    <span
                      className="px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-100 text-[10px] font-semibold backdrop-blur-xs truncate block border border-slate-700/60 shadow-xs"
                      title={permit.company_name}
                    >
                      {permit.company_name}
                    </span>
                  </div>

                  {/* Hover Overlay with Eye Icon and Hand Cursor */}
                  <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer">
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 cursor-pointer hover:bg-slate-100">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      View Permit
                    </span>
                  </div>
                </div>

                {/* Bottom Details Section */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-2 bg-card">
                  <div>
                    <h4
                      className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1"
                      title={permit.permit_type_name}
                    >
                      {permit.permit_type_name}
                    </h4>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      No: {permit.permit_number}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Exp: {formatDate(permit.expiration_date || permit.expiry_date)}
                      </span>
                    </div>

                    <span
                      className={`font-semibold shrink-0 ${
                        isExpired
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isExpired
                        ? `${Math.abs(permit.days_remaining)}d overdue`
                        : `${permit.days_remaining}d left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DashboardPermitPreviewDialog
        isOpen={Boolean(previewPermit)}
        onClose={() => setPreviewPermit(null)}
        permit={previewPermit}
        companyPermits={allCompanyPermits}
      />
    </>
  );
};
