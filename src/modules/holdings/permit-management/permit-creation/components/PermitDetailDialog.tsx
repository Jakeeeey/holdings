"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
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
  Calendar,
  FileText,
  Clock,
  Landmark,
  Pencil,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Copy,
  Check,
  FileQuestion,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  Loader2,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PermitRecord,
  PermitCompany,
  PermitTypeItem,
} from "../types/permit-creation.types";

interface PermitDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permit: PermitRecord | null;
  company: PermitCompany | null;
  permitType: PermitTypeItem | null;
  onEdit: (permit: PermitRecord) => void;
  onRenew?: (permit: PermitRecord) => void;
  onDelete: (permitId: number | string) => Promise<boolean>;
  isDeleting: boolean;
}

const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-600 to-teal-700",
  "from-violet-600 to-purple-700",
  "from-amber-600 to-orange-700",
  "from-cyan-600 to-blue-700",
  "from-rose-600 to-pink-700",
];

const getAvatarGradient = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const getCompanyLogoUrl = (logo?: string | null) => {
  if (!logo || typeof logo !== "string" || !logo.trim()) return null;
  const trimmed = logo.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return `${baseUrl}/assets/${trimmed}`;
};

export const PermitDetailDialog: React.FC<PermitDetailDialogProps> = ({
  isOpen,
  onClose,
  permit,
  company,
  permitType,
  onEdit,
  onRenew,
  onDelete,
  isDeleting,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Pan and Zoom States
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [prevPermitKey, setPrevPermitKey] = useState("");
  const currentPermitKey = `${isOpen ? "open" : "closed"}_${permit?.id || ""}_${permit?.file_url || ""}`;

  if (currentPermitKey !== prevPermitKey) {
    setPrevPermitKey(currentPermitKey);
    if (isOpen) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageError(false);
      setIsCopied(false);
      setIsAttachmentLoading(true);
    }
  }

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
    // Only zoom when mouse is directly interacting
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

  if (!permit) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not specified";
    try {
      const clean = dateString.substring(0, 10);
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (expiryDateStr: string) => {
    if (!expiryDateStr) {
      return {
        label: "No Expiry Date",
        variant: "secondary" as const,
        icon: AlertCircle,
        className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
        diffDays: 0,
        canRenew: false,
        summary: "No validity period is associated with this document.",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = expiryDateStr.substring(0, 10).split("-");
    const expiry =
      parts.length === 3
        ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        : new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"} ago)`,
        variant: "destructive" as const,
        icon: AlertCircle,
        className: "bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/40 dark:border-rose-500/60 font-semibold",
        diffDays,
        canRenew: true,
        summary: `This permit expired ${Math.abs(diffDays)} days ago. Renewal registration is required to maintain compliance standing.`,
      };
    } else if (diffDays <= 90) {
      return {
        label: `Expiring Soon (${diffDays} ${diffDays === 1 ? "day" : "days"} left)`,
        variant: "outline" as const,
        icon: AlertTriangle,
        className: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/40 dark:border-amber-500/60 font-semibold",
        diffDays,
        canRenew: true,
        summary: `This permit will lapse in ${diffDays} days (within 3 months). It is recommended to initiate the renewal process immediately.`,
      };
    } else {
      return {
        label: `Active (${diffDays} days left)`,
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-500/60 font-semibold",
        diffDays,
        canRenew: false,
        summary: `This permit is currently active, valid, and fully compliant with regulatory standards.`,
      };
    }
  };

  const status = getStatusInfo(permit.expiry_date || permit.expiration_date || "");
  const StatusIcon = status.icon;

  const getAbsoluteFileUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    if (url.startsWith("/assets/")) {
      return `${baseUrl}${url}`;
    }
    return url;
  };

  const fileUrl = getAbsoluteFileUrl(permit.file_url);
  const isDirectusAsset = Boolean(permit.file_url && permit.file_url.startsWith("/assets/"));
  const isPdf = /\.pdf$/i.test(permit.file_url || "");
  const isExplicitImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(permit.file_url || "");
  const displayDocumentTitle = permitType?.name || permitType?.permit_type_name
    ? `${permitType.name || permitType.permit_type_name} Certificate`
    : "Official Permit Certificate";

  const handleCopyPermitNumber = () => {
    if (permit.permit_number) {
      navigator.clipboard.writeText(permit.permit_number);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const companyLogoUrl = getCompanyLogoUrl(company?.company_logo);
  const companyGradient = getAvatarGradient(company?.company_name || "Company");
  const companyInitials = company?.company_code
    ? company.company_code.substring(0, 2).toUpperCase()
    : (company?.company_name || "CO").substring(0, 2).toUpperCase();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setImageError(false);
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-none w-[96vw] max-w-[1400px] h-[94vh] p-0 overflow-hidden flex flex-col gap-0 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[0_0_60px_-15px_rgba(0,0,0,0.95)] rounded-2xl bg-card"
      >
        {/* Header Bar */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Permit Information & Document Preview
                </DialogTitle>
                <Badge variant={status.variant} className={`text-xs gap-1.5 py-0.5 font-medium ${status.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Document validity, registered details, and attached certificate preview.
              </DialogDescription>
            </div>

            {/* Quick Actions at Header */}
            {fileUrl && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 border-slate-300 dark:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  <a href={fileUrl} target="_blank" rel="noreferrer" download>
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 border-slate-300 dark:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  <a href={fileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Tab
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* 2-Column Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* LEFT COLUMN: Large Document Previewer */}
          <div className="md:col-span-8 bg-slate-900/[0.03] dark:bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700/80 flex flex-col h-full min-h-0 relative overflow-hidden">
            {/* Preview Toolbar with Human-Readable Title */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/80 bg-background/95 dark:bg-slate-900/90 backdrop-blur-xs text-xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-foreground truncate max-w-[280px] sm:max-w-[340px] block" title={displayDocumentTitle}>
                    {displayDocumentTitle}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono px-2 py-0.5 border border-slate-200 dark:border-slate-700 shrink-0">
                  {isPdf ? "PDF Document" : isExplicitImage || isDirectusAsset ? "Image / Document" : "Attachment"}
                </Badge>
              </div>

              {/* Pan & Zoom Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shrink-0">
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
            </div>

            {/* Viewer Stage */}
            <div
              className={`flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center p-4 bg-slate-900/[0.04] dark:bg-slate-950/90 select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheelZoom}
              onDoubleClick={handleDoubleClick}
            >
              {fileUrl ? (
                <>
                  {/* Attachment Loading State with Skeleton + Spinner */}
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

                  {isPdf ? (
                    <iframe
                      src={`${fileUrl}#toolbar=0&navpanes=0`}
                      title="Permit PDF Preview"
                      onLoad={() => setIsAttachmentLoading(false)}
                      className={`w-full h-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white shadow-xs transition-opacity duration-200 ${
                        isAttachmentLoading ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  ) : (isExplicitImage || isDirectusAsset) && !imageError ? (
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
                        alt="Permit Attachment"
                        onLoad={() => setIsAttachmentLoading(false)}
                        onError={() => {
                          setIsAttachmentLoading(false);
                          setImageError(true);
                        }}
                        onDragStart={(e) => e.preventDefault()}
                        className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  ) : (
                    <object
                      data={fileUrl}
                      type="application/pdf"
                      onLoad={() => setIsAttachmentLoading(false)}
                      className={`w-full h-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white ${
                        isAttachmentLoading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                        <FileQuestion className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-xs font-medium text-foreground">Preview not directly embeddable</p>
                        <p className="text-[11px] mt-1 mb-3">You can view or download the file directly.</p>
                        <Button size="sm" variant="outline" asChild className="h-8 text-xs border-slate-300 dark:border-slate-600">
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Open Document
                          </a>
                        </Button>
                      </div>
                    </object>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-medium text-foreground">No Document Attached</p>
                  <p className="text-[11px] mt-0.5">Edit this record to attach a permit document.</p>
                </div>
              )}

              {(isExplicitImage || isDirectusAsset) && !imageError && (
                <div className="absolute bottom-3 left-3 bg-background/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 pointer-events-none shadow-sm">
                  <Move className="h-3 w-3 text-primary" />
                  <span>Drag to pan • Scroll or Double-click to zoom</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Rich Permit Information & Compliance Status */}
          <div className="md:col-span-4 p-5 sm:p-6 overflow-y-auto space-y-4 flex flex-col justify-between h-full bg-background dark:bg-slate-900/40">
            <div className="space-y-4">
              {/* 1. Company Card with Logo & Identifiers */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5 shadow-xs">
                {companyLogoUrl && !logoError ? (
                  <div className="w-14 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center shrink-0 p-1 shadow-2xs">
                    <img
                      src={companyLogoUrl}
                      alt={company?.company_name || "Company"}
                      onError={() => setLogoError(true)}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className={`w-14 h-12 rounded-lg bg-gradient-to-br ${companyGradient} text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-2xs font-mono`}>
                    {companyInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Registered Company
                  </span>
                  <p className="font-bold text-foreground text-sm truncate leading-tight mt-0.5" title={company?.company_name}>
                    {company?.company_name || "N/A"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {company?.company_code && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                        {company.company_code}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Enterprise Member
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Validity & Compliance Alert Banner (Fills void & clarifies status) */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-xs transition-colors ${
                  status.diffDays < 0
                    ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-300/80 dark:border-rose-500/50 text-rose-900 dark:text-rose-200"
                    : status.diffDays <= 90
                    ? "bg-amber-500/10 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-500/50 text-amber-900 dark:text-amber-200"
                    : "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {status.diffDays < 0 ? (
                    <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  ) : status.diffDays <= 90 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold tracking-tight">
                    {status.diffDays < 0
                      ? "Compliance Action Required"
                      : status.diffDays <= 90
                      ? "Upcoming Expiration Warning"
                      : "Document Verified & Compliant"}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {status.summary}
                  </p>
                </div>
              </div>

              {/* 3. Permit Identification */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-card dark:bg-slate-900/90 space-y-2.5 shadow-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Permit Classification</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {permitType?.name || permitType?.permit_type_name || "General Compliance Permit"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground font-medium">Permit Number</span>
                    <p className="font-mono font-bold text-xs text-foreground mt-0.5">
                      {permit.permit_number}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPermitNumber}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 border-slate-200 dark:border-slate-600 text-foreground dark:text-slate-200 cursor-pointer"
                    title="Copy Permit Number"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 4. Dates Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-card dark:bg-slate-900/90 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium">Date Issued</span>
                  </div>
                  <p className="font-semibold text-foreground text-xs">
                    {formatDate(permit.issue_date || permit.issued_date)}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-card dark:bg-slate-900/90 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-medium">Expiration Date</span>
                  </div>
                  <p className="font-semibold text-foreground text-xs">
                    {formatDate(permit.expiry_date || permit.expiration_date)}
                  </p>
                </div>
              </div>

              {/* 5. Issuing Agency & Authority */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-card dark:bg-slate-900/90 shadow-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium">Issuing Agency / Authority</span>
                </div>
                <p className="font-medium text-foreground text-xs">
                  {permit.issuing_agency || "Not specified"}
                </p>
              </div>

              {/* 6. Remarks / Notes */}
              {(permit.notes || permit.remarks) && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-card dark:bg-slate-900/90 shadow-xs">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Remarks / Processing Notes</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {permit.notes || permit.remarks}
                  </p>
                </div>
              )}
            </div>

            {/* Structured Bottom Action Bar */}
            <div className="pt-3.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
              {/* Left Action: Delete */}
              <div>
                {permit.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    className="h-8 px-2.5 text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                ) : null}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {status.canRenew && onRenew && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onRenew(permit);
                      onClose();
                    }}
                    className="h-8 px-3.5 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Renew Permit</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(permit);
                    onClose();
                  }}
                  className="h-8 px-3 text-xs gap-1.5 font-medium border-slate-300 dark:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-3.5 text-xs font-medium border border-slate-200 dark:border-slate-600 text-foreground dark:text-slate-200 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Delete Permit Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete permit <strong className="text-foreground">#{permit.permit_number}</strong> for <strong className="text-foreground">{company?.company_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="h-8 text-xs cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async () => {
                if (permit.id) {
                  const success = await onDelete(permit.id);
                  if (success) {
                    setIsConfirmDeleteOpen(false);
                    onClose();
                  }
                }
              }}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete Permit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
