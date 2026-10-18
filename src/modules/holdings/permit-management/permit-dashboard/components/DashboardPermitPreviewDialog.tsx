"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  FileQuestion,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Archive,
  FileText,
  ArrowLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPermitItem } from "../types/permit-dashboard.types";

interface DashboardPermitPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permit: DashboardPermitItem | null;
  companyPermits?: DashboardPermitItem[];
}

export const DashboardPermitPreviewDialog: React.FC<DashboardPermitPreviewDialogProps> = ({
  isOpen,
  onClose,
  permit,
  companyPermits = [],
}) => {
  const [overridePermit, setOverridePermit] = useState<DashboardPermitItem | null>(null);
  const [prevPermitId, setPrevPermitId] = useState<string | number | null>(null);

  const [hasError, setHasError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [sidebarView, setSidebarView] = useState<"active" | "archive_list">("active");

  // Pan and Zoom States
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset override permit and zoom whenever the base permit changes (React recommended pattern)
  if (permit && permit.id !== prevPermitId) {
    setPrevPermitId(permit.id);
    setOverridePermit(null);
    setHasError(false);
    setImageError(false);
    setIsAttachmentLoading(true);
    setIsCopied(false);
    setSidebarView("active");
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }

  const selectedPermit = overridePermit || permit;

  const setSelectedPermit = (p: DashboardPermitItem | null) => {
    setOverridePermit(p);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setHasError(false);
    setImageError(false);
    setIsAttachmentLoading(true);
    setIsCopied(false);
  };

  const handleCopyPermitNumber = () => {
    if (currentPermit?.permit_number) {
      navigator.clipboard.writeText(currentPermit.permit_number);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(4, Math.round((prev + 0.2) * 100) / 100));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(0.5, Math.round((prev - 0.2) * 100) / 100);
        if (next <= 1) {
          setPanPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleResetZoom();
    } else {
      setZoomScale(2);
    }
  };

  const currentPermit = selectedPermit || permit;
  const isViewingHistoryRecord = Boolean(
    permit && selectedPermit && String(permit.id) !== String(selectedPermit.id)
  );

  // Filter history: other permits of this company with the same permit_type_id
  const permitHistory = useMemo(() => {
    if (!permit || !companyPermits.length) return [];
    return companyPermits
      .filter(
        (p) =>
          String(p.permit_type_id) === String(permit.permit_type_id) &&
          String(p.id) !== String(permit.id)
      )
      .sort((a, b) => {
        const dateA = new Date(a.expiration_date || 0).getTime();
        const dateB = new Date(b.expiration_date || 0).getTime();
        return dateB - dateA;
      });
  }, [permit, companyPermits]);

  if (!currentPermit) return null;

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

  const fileUrl = getAbsoluteFileUrl(currentPermit.file_url);
  const isDirectusAsset = Boolean(currentPermit.file_url && currentPermit.file_url.includes("/assets/"));
  const isPdf = /\.pdf$/i.test(currentPermit.file_url || "");
  const isExplicitImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(currentPermit.file_url || "");
  const isImageLike = (isExplicitImage || isDirectusAsset) && !isPdf && !imageError;

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

  const isArchived = currentPermit.status === "Archived" || isViewingHistoryRecord;
  const isExpired = currentPermit.health_level === "critical" && !isArchived;
  const isExpiring = currentPermit.health_level === "warning" && !isArchived;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-none w-[96vw] max-w-[1550px] h-[92vh] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl border border-border/80 shadow-2xl bg-card"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-border bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                  {currentPermit.permit_type_name}
                </DialogTitle>

                {isViewingHistoryRecord ? (
                  <Badge variant="outline" className="text-xs bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400 gap-1 font-semibold">
                    <Archive className="h-3 w-3" />
                    Viewing Historical Record
                  </Badge>
                ) : isArchived ? (
                  <Badge variant="outline" className="text-xs bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400 gap-1 font-semibold">
                    <Archive className="h-3 w-3" />
                    Archived
                  </Badge>
                ) : isExpired ? (
                  <Badge variant="destructive" className="text-xs gap-1 font-semibold">
                    <AlertOctagon className="h-3 w-3" />
                    Expired ({Math.abs(currentPermit.days_remaining)}d overdue)
                  </Badge>
                ) : isExpiring ? (
                  <Badge variant="outline" className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    Expiring Soon ({currentPermit.days_remaining}d left)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
                    <ShieldCheck className="h-3 w-3" />
                    Active & Valid
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground truncate">
                <span className="font-semibold text-foreground truncate">
                  {currentPermit.company_name}
                </span>
                <span>•</span>
                <span className="font-mono">No: {currentPermit.permit_number}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 text-xs h-8 cursor-pointer hidden sm:inline-flex"
              >
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in New Tab
                </a>
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-4 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

        {/* 2-Column Studio Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT COLUMN: Full-Height Document Viewer Stage (65% width) */}
          <div className="lg:col-span-8 xl:col-span-8 h-full min-h-0 bg-slate-100/70 dark:bg-slate-950/80 p-3 sm:p-4 flex flex-col relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
            {/* Attachment Control Bar */}
            <div className="mb-2.5 flex items-center justify-between text-xs px-1 shrink-0 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Attachment Preview
                </span>
                {isPdf ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                    PDF Document
                  </Badge>
                ) : isImageLike ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                    Image File
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                    Document
                  </Badge>
                )}
              </div>

              {/* Pan & Zoom Toolbar for Images */}
              {isImageLike && fileUrl && !hasError && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoomScale <= 0.5}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-slate-300 cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded hover:bg-background/80 dark:hover:bg-slate-700 transition-colors text-foreground cursor-pointer"
                    title="Click to reset (100%)"
                  >
                    {Math.round(zoomScale * 100)}%
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoomScale >= 4}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-slate-300 cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>

                  {(zoomScale !== 1 || panPosition.x !== 0 || panPosition.y !== 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleResetZoom}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                      title="Reset View"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Giant High-Space Document Preview Canvas */}
            <div className="flex-1 w-full min-h-0 rounded-xl overflow-hidden border border-border/80 bg-white dark:bg-slate-900 flex items-center justify-center relative shadow-xs">
              {!fileUrl || hasError ? (
                <div className="p-8 text-center space-y-2">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/60" />
                  <p className="text-base font-semibold text-foreground">Document File Not Accessible</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No preview is available for this record or the document link has moved.
                  </p>
                </div>
              ) : isPdf ? (
                <>
                  {isAttachmentLoading && (
                    <div className="absolute inset-4 z-20 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl border border-slate-200 dark:border-slate-800 pointer-events-none transition-opacity duration-200">
                      <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-4">
                        <div className="relative flex items-center justify-center">
                          <Skeleton className="h-16 w-16 rounded-2xl bg-muted" />
                          <Loader2 className="h-7 w-7 text-primary animate-spin absolute" />
                        </div>
                        <div className="space-y-2 text-center max-w-[200px]">
                          <Skeleton className="h-3.5 w-32 mx-auto rounded" />
                          <Skeleton className="h-2.5 w-24 mx-auto rounded" />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground animate-pulse">
                          Loading PDF preview...
                        </p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={`${fileUrl}#toolbar=0&navpanes=0`}
                    className={`w-full h-full border-0 transition-opacity duration-200 ${
                      isAttachmentLoading ? "opacity-0" : "opacity-100"
                    }`}
                    title="Permit Preview"
                    onLoad={() => setIsAttachmentLoading(false)}
                    onError={() => {
                      setIsAttachmentLoading(false);
                      setHasError(true);
                    }}
                  />
                </>
              ) : isImageLike ? (
                <div
                  className={`w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center p-4 bg-slate-900/[0.04] dark:bg-slate-950/90 select-none ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheelZoom}
                  onDoubleClick={handleDoubleClick}
                >
                  {isAttachmentLoading && (
                    <div className="absolute inset-4 z-20 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl border border-slate-200 dark:border-slate-800 pointer-events-none transition-opacity duration-200">
                      <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-4">
                        <div className="relative flex items-center justify-center">
                          <Skeleton className="h-16 w-16 rounded-2xl bg-muted" />
                          <Loader2 className="h-7 w-7 text-primary animate-spin absolute" />
                        </div>
                        <div className="space-y-2 text-center max-w-[200px]">
                          <Skeleton className="h-3.5 w-32 mx-auto rounded" />
                          <Skeleton className="h-2.5 w-24 mx-auto rounded" />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground animate-pulse">
                          Loading permit preview...
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`h-full w-full flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
                      isAttachmentLoading ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                      transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 150ms ease-out",
                    }}
                  >
                    <img
                      src={fileUrl}
                      alt={currentPermit.permit_number}
                      onLoad={() => setIsAttachmentLoading(false)}
                      onError={() => {
                        // If Directus asset failed to render as image, it is likely a PDF or doc
                        setImageError(true);
                        setIsAttachmentLoading(true);
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Floating Pan/Zoom Hint */}
                  <div className="absolute bottom-3 left-3 bg-background/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 pointer-events-none shadow-sm">
                    <Move className="h-3 w-3 text-primary" />
                    <span>Drag to pan • Scroll or Double-click to zoom</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  {isAttachmentLoading && (
                    <div className="absolute inset-4 z-20 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl border border-slate-200 dark:border-slate-800 pointer-events-none transition-opacity duration-200">
                      <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-4">
                        <div className="relative flex items-center justify-center">
                          <Skeleton className="h-16 w-16 rounded-2xl bg-muted" />
                          <Loader2 className="h-7 w-7 text-primary animate-spin absolute" />
                        </div>
                        <div className="space-y-2 text-center max-w-[200px]">
                          <Skeleton className="h-3.5 w-32 mx-auto rounded" />
                          <Skeleton className="h-2.5 w-24 mx-auto rounded" />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground animate-pulse">
                          Loading document preview...
                        </p>
                      </div>
                    </div>
                  )}
                  <object
                    data={fileUrl}
                    type="application/pdf"
                    onLoad={() => setIsAttachmentLoading(false)}
                    className={`w-full h-full border-0 transition-opacity duration-200 ${
                      isAttachmentLoading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <iframe
                      src={`${fileUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-full border-0"
                      title="Permit Preview"
                      onLoad={() => setIsAttachmentLoading(false)}
                      onError={() => {
                        setIsAttachmentLoading(false);
                        setHasError(true);
                      }}
                    />
                  </object>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Page-Based Active Permit & Archive Flow (35% width) */}
          <div className="lg:col-span-4 xl:col-span-4 h-full min-h-0 flex flex-col bg-card overflow-hidden border-l border-border/80">
            {sidebarView === "active" ? (
              /* ================= PAGE 1: ACTIVE PERMIT DETAILS ================= */
              <>
                {/* Header for Page 1 */}
                <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between bg-muted/40">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-foreground">
                      Permit Information
                    </span>
                  </div>

                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 font-semibold gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Active Permit
                  </Badge>
                </div>

                {/* Body for Page 1 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Company Info Box */}
                  <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                      Registered Company
                    </span>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      {permit?.company_name || currentPermit.company_name}
                    </p>
                    {(permit?.company_code || currentPermit.company_code) && (
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Code: {permit?.company_code || currentPermit.company_code}
                      </p>
                    )}
                  </div>

                  {/* Active Status Pill */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      permit?.health_level === "critical"
                        ? "bg-destructive/[0.06] border-destructive/30 text-destructive"
                        : permit?.health_level === "warning"
                        ? "bg-amber-500/[0.06] border-amber-500/30 text-amber-800 dark:text-amber-300"
                        : "bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {permit?.health_level === "critical" ? (
                        <AlertOctagon className="h-4 w-4 text-destructive" />
                      ) : permit?.health_level === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="text-xs space-y-0.5 min-w-0">
                      <p className="font-bold">
                        {permit?.health_level === "critical"
                          ? "Permit Has Expired"
                          : permit?.health_level === "warning"
                          ? "Renewal Required Soon"
                          : "Fully Compliant & Valid"}
                      </p>
                      <p className="text-[11px] opacity-90 truncate">
                        {permit?.health_level === "critical"
                          ? `Overdue by ${Math.abs(permit.days_remaining)} days.`
                          : permit?.health_level === "warning"
                          ? `Expires in ${permit.days_remaining} days.`
                          : "Valid and up to date."}
                      </p>
                    </div>
                  </div>

                  {/* Active Key Metadata Fields */}
                  <div className="space-y-2 pt-0.5">
                    <div className="p-2.5 rounded-lg border bg-card flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Permit Number
                        </p>
                        <p className="font-mono font-bold text-xs text-foreground mt-0.5">
                          {permit?.permit_number}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPermitNumber}
                        className="h-7 px-2 text-xs gap-1 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Copy permit number"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-[11px] text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Date Issued
                        </p>
                        <p className="font-medium text-xs text-foreground">
                          {formatDate(permit?.issue_date || permit?.issued_date)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Expiration Date
                        </p>
                        <p className="font-medium text-xs text-foreground">
                          {formatDate(permit?.expiration_date || permit?.expiry_date)}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Issuing Agency
                      </p>
                      <p className="font-medium text-xs text-foreground">
                        {permit?.issuing_agency || "Government Agency"}
                      </p>
                    </div>

                    {(permit?.notes || permit?.remarks) && (
                      <div className="p-2.5 rounded-lg border bg-muted/40 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Notes & Remarks
                        </p>
                        <p className="text-xs text-foreground">
                          {permit?.notes || permit?.remarks}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Button to Next Page: View Archives */}
                  <div className="pt-3 border-t border-border">
                    {permitHistory.length > 0 ? (
                      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-bold text-foreground">
                              Archived Records Available
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold">
                            {permitHistory.length} {permitHistory.length === 1 ? "Record" : "Records"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Previous renewals and older copies are saved here for audit records.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSidebarView("archive_list")}
                          className="w-full h-8 text-xs font-semibold gap-2 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <Archive className="h-3.5 w-3.5" />
                            View Archived Records
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-amber-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border bg-muted/20 text-muted-foreground text-center space-y-1">
                        <Archive className="h-4 w-4 mx-auto text-muted-foreground/40" />
                        <p className="text-[11px] font-medium text-foreground">No Historical Archives</p>
                        <p className="text-[10px]">
                          This is the sole document on record for this permit.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ================= PAGE 2: ARCHIVE LIST & VIEWING ARCHIVED RECORD ================= */
              <>
                {/* Header for Page 2 with Back Button */}
                <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between bg-muted/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (permit) setSelectedPermit(permit);
                      setSidebarView("active");
                    }}
                    className="h-7 -ml-2 px-2 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Active Permit
                  </Button>

                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-semibold gap-1">
                    <Archive className="h-2.5 w-2.5" />
                    Archives ({permitHistory.length})
                  </Badge>
                </div>

                {/* Body for Page 2 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Selected Archived Record Details if viewing an archived file */}
                  {isViewingHistoryRecord && selectedPermit && (
                    <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/[0.04] space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Archive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-foreground">
                            Viewing Archived Record
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (permit) setSelectedPermit(permit);
                            setSidebarView("active");
                          }}
                          className="h-6 px-2 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Return to Active
                        </Button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Permit Number</span>
                          <span className="font-mono font-bold text-foreground">{selectedPermit.permit_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Expiration Date</span>
                          <span className="font-semibold text-foreground">
                            {formatDate(selectedPermit.expiration_date || selectedPermit.expiry_date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Issuing Agency</span>
                          <span className="font-medium text-foreground">{selectedPermit.issuing_agency || "Government Agency"}</span>
                        </div>
                        {(selectedPermit.notes || selectedPermit.remarks) && (
                          <div className="pt-1 text-[11px] text-muted-foreground italic">
                            Notes: {selectedPermit.notes || selectedPermit.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* List of Available Archived Documents */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Select Archived Document to View
                    </span>

                    {permitHistory.map((hist, idx) => {
                      const isSelected = String(selectedPermit?.id) === String(hist.id);

                      return (
                        <div
                          key={hist.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/[0.08] ring-1 ring-amber-500 shadow-xs"
                              : "bg-card hover:bg-muted/30 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-muted-foreground font-bold">
                                  #{idx + 1}
                                </span>
                                <p className="font-mono font-bold text-xs text-foreground">
                                  {hist.permit_number}
                                </p>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Expired: {formatDate(hist.expiration_date || hist.expiry_date)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold">
                              Archived
                            </Badge>
                          </div>

                          {(hist.notes || hist.remarks) && (
                            <p className="text-[11px] text-muted-foreground italic truncate">
                              Note: {hist.notes || hist.remarks}
                            </p>
                          )}

                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedPermit(hist)}
                            className={`w-full h-7 text-xs gap-1.5 cursor-pointer ${
                              isSelected ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            {isSelected ? "Currently Displaying in Viewer" : "View This Archive"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
