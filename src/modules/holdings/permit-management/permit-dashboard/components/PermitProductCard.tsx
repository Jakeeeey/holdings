"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  Calendar,
  Eye,
  FileText,
  FileQuestion,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardPermitItem } from "../types/permit-dashboard.types";

interface PermitProductCardProps {
  permit: DashboardPermitItem;
  onView: (permit: DashboardPermitItem) => void;
  isArchivedMode?: boolean;
}

export const PermitProductCard: React.FC<PermitProductCardProps> = ({
  permit,
  onView,
  isArchivedMode = false,
}) => {
  const [loadError, setLoadError] = useState(false);

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

  const fileUrl = getAbsoluteFileUrl(permit.file_url);
  const isPdf = /\.pdf$/i.test(permit.file_url || "");
  const isExplicitImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(permit.file_url || "");
  const isDirectusAsset = Boolean(permit.file_url && permit.file_url.includes("/assets/"));
  const isImage = (isExplicitImage || isDirectusAsset) && !isPdf && !loadError;

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

  const isArchived = permit.status === "Archived" || isArchivedMode;
  const isExpired = permit.health_level === "critical" && !isArchived;
  const isExpiring = permit.health_level === "warning" && !isArchived;

  return (
    <div
      onClick={() => onView(permit)}
      className="group relative rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer select-none"
    >
      {/* Top Image / Document Showcase Canvas */}
      <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center border-b border-border/60">
        {fileUrl && !loadError && isImage ? (
          <img
            src={fileUrl}
            alt={permit.permit_number}
            onError={() => setLoadError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : fileUrl && !loadError && isPdf ? (
          <div className="w-full h-full relative overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
            <object
              data={`${fileUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              onError={() => setLoadError(true)}
              className="w-full h-full object-cover pointer-events-none scale-100 group-hover:scale-105 transition-transform duration-300"
            >
              <iframe
                src={`${fileUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0 pointer-events-none"
                title="PDF Preview"
                onError={() => setLoadError(true)}
              />
            </object>
          </div>
        ) : fileUrl && !loadError ? (
          <img
            src={fileUrl}
            alt={permit.permit_number}
            onError={() => setLoadError(true)}
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
          {isArchived ? (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 bg-slate-900/80 text-slate-100 border-slate-700 backdrop-blur-xs font-semibold gap-1"
            >
              <Archive className="h-3 w-3" />
              Archived
            </Badge>
          ) : isExpired ? (
            <Badge
              variant="destructive"
              className="text-[10px] h-5 px-1.5 font-bold shadow-xs gap-1"
            >
              <AlertOctagon className="h-3 w-3" />
              {permit.days_remaining < 0
                ? `${Math.abs(permit.days_remaining)}d overdue`
                : "Expired"}
            </Badge>
          ) : isExpiring ? (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 bg-amber-500/90 text-white border-amber-600 backdrop-blur-xs font-bold shadow-xs gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              {permit.days_remaining}d left
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 bg-emerald-600/90 text-white border-emerald-700 backdrop-blur-xs font-semibold shadow-xs gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              Active
            </Badge>
          )}
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

          {!isArchived && (
            <span
              className={`font-semibold shrink-0 ${
                isExpired
                  ? "text-destructive"
                  : isExpiring
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {isExpired ? "Expired" : isExpiring ? "Expiring" : "Valid"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
