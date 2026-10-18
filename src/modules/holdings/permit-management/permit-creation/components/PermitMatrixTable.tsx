"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from "react";
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Eye,
  Building2,
  Shield,
  Landmark,
  Flame,
  FileText,
  Building,
  FileCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PermitCompany,
  PermitTypeItem,
  PermitRecord,
} from "../types/permit-creation.types";

interface PermitMatrixTableProps {
  companies: PermitCompany[];
  permitTypes: PermitTypeItem[];
  totalActiveTypes?: number;
  permitMap: Map<string, PermitRecord>;
  isLoading: boolean;
  onAddPermitForCell: (company: PermitCompany, permitType: PermitTypeItem) => void;
  onViewPermitDetails: (permit: PermitRecord, company: PermitCompany, permitType: PermitTypeItem) => void;
  onOpenAddPermitType?: () => void;
}

// Tailored avatar gradient palette based on string hash
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

// Thematic icon matcher based on permit type name
const getPermitTypeIcon = (typeName: string) => {
  const lower = typeName.toLowerCase();
  if (lower.includes("barangay")) return Shield;
  if (lower.includes("mayor") || lower.includes("business")) return Landmark;
  if (lower.includes("fire") || lower.includes("fsic")) return Flame;
  if (lower.includes("bir") || lower.includes("cor") || lower.includes("tax")) return FileText;
  if (lower.includes("dti") || lower.includes("sec")) return Building;
  return FileCheck;
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

const CompanyAvatar: React.FC<{
  logo?: string | null;
  name: string;
  code?: string;
  gradient: string;
}> = ({ logo, name, code, gradient }) => {
  const [hasError, setHasError] = React.useState(false);
  const logoUrl = getCompanyLogoUrl(logo);

  const initials = code
    ? code.substring(0, 2).toUpperCase()
    : name.substring(0, 2).toUpperCase();

  if (logoUrl && !hasError) {
    return (
      <div className="w-16 h-11 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-xs p-1">
        <img
          src={logoUrl}
          alt={name}
          onError={() => setHasError(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-16 h-11 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs font-mono`}
    >
      {initials}
    </div>
  );
};

export const PermitMatrixTable: React.FC<PermitMatrixTableProps> = ({
  companies,
  permitTypes,
  totalActiveTypes,
  permitMap,
  isLoading,
  onAddPermitForCell,
  onViewPermitDetails,
}) => {
  // Pre-calculate count of registered permits per column
  const columnRegisteredCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const type of permitTypes) {
      let count = 0;
      for (const comp of companies) {
        const key = `${comp.company_id}_${type.id}`;
        if (permitMap.has(key)) count++;
      }
      counts.set(String(type.id), count);
    }
    return counts;
  }, [permitTypes, companies, permitMap]);

  // Pre-calculate count of registered permits per company row
  const rowRegisteredCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const comp of companies) {
      let count = 0;
      for (const type of permitTypes) {
        const key = `${comp.company_id}_${type.id}`;
        if (permitMap.has(key)) count++;
      }
      counts.set(comp.company_id, count);
    }
    return counts;
  }, [companies, permitTypes, permitMap]);

  const getPermitStatus = (expiryDateStr: string, currentStatus?: string | null) => {
    if (!expiryDateStr) {
      return {
        label: currentStatus || "No Expiry Date",
        variant: "secondary" as const,
        icon: AlertCircle,
        className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
        borderAccent: "border-l-slate-400 dark:border-l-slate-400",
        cardBg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700",
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
        label: "Expired",
        variant: "destructive" as const,
        icon: AlertCircle,
        className: "bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/40 dark:border-rose-500/60 font-semibold",
        borderAccent: "border-l-rose-500 dark:border-l-rose-400",
        cardBg: "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300/80 dark:border-rose-500/50 shadow-sm dark:shadow-rose-950/20",
        diffDays,
      };
    } else if (diffDays <= 90) {
      return {
        label: `Expires in ${diffDays}d`,
        variant: "outline" as const,
        icon: AlertTriangle,
        className: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/40 dark:border-amber-500/60 font-semibold",
        borderAccent: "border-l-amber-500 dark:border-l-amber-400",
        cardBg: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-500/50 shadow-sm dark:shadow-amber-950/20",
        diffDays,
      };
    } else {
      return {
        label: "Active",
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-500/60 font-semibold",
        borderAccent: "border-l-emerald-500 dark:border-l-emerald-400",
        cardBg: "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/50 shadow-sm dark:shadow-emerald-950/20",
        diffDays,
      };
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
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
          month: "short",
          day: "numeric",
        });
      }
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800 dark:bg-slate-900">
                {/* Company Header Skeleton */}
                <th className="px-5 py-4 w-[350px] min-w-[350px] max-w-[350px] border-r border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-4 rounded bg-slate-700" />
                      <Skeleton className="h-4 w-20 rounded bg-slate-700" />
                    </div>
                    <Skeleton className="h-5 w-6 rounded-full bg-slate-700" />
                  </div>
                </th>
                {/* 5 Column Header Skeletons */}
                {[1, 2, 3, 4, 5].map((col) => (
                  <th key={col} className="px-4 py-3 min-w-[240px] max-w-[290px] border-r border-slate-700">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-md bg-slate-700 shrink-0" />
                        <Skeleton className="h-4 w-32 rounded bg-slate-700 flex-1" />
                      </div>
                      <div className="pl-6 flex items-center gap-1.5">
                        <Skeleton className="h-2 w-2 rounded-full bg-slate-700" />
                        <Skeleton className="h-3 w-28 rounded bg-slate-700" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 5 Row Skeletons */}
              {[1, 2, 3, 4, 5].map((rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-800/80">
                  {/* Company Column Cell Skeleton */}
                  <td className="px-5 py-4 w-[350px] min-w-[350px] max-w-[350px] border-r border-slate-200 dark:border-slate-800 bg-background/50">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-3 w-44 rounded" />
                      </div>
                    </div>
                  </td>
                  {/* Cell Skeletons */}
                  {[1, 2, 3, 4, 5].map((cellIdx) => (
                    <td key={cellIdx} className="px-3 py-3 min-w-[240px] max-w-[290px] border-r border-slate-100 dark:border-slate-800/80">
                      <div className="h-20 w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3.5 w-24 rounded" />
                          <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <Skeleton className="h-3 w-16 rounded" />
                          <Skeleton className="h-3 w-10 rounded" />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center bg-card">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold">No Companies Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Try modifying your search keyword or ensure companies are registered in the system.
        </p>
      </div>
    );
  }

  if (permitTypes.length === 0) {
    return (
      <div className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center bg-card">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold">No Columns Selected</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Please select at least one permit type column from the &ldquo;Columns&rdquo; filter dropdown above to view compliance matrix data.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700/80 rounded-xl bg-card shadow-sm dark:shadow-2xl">
      <div className="overflow-auto flex-1 h-full relative">
        <table className="w-full text-left border-separate border-spacing-0 text-sm">

          {/* ── THEAD ── */}
          <thead className="sticky top-0 z-30">
            <tr>
              {/* Top-Left: Company Header - Fixed 350px */}
              <th className="sticky top-0 left-0 z-50 bg-slate-900 dark:bg-slate-950 px-4 py-4 font-semibold text-white border-r border-b border-slate-700 dark:border-slate-700 w-[350px] min-w-[350px] max-w-[350px] shadow-[4px_0_12px_-2px_rgba(0,0,0,0.30)] dark:shadow-[6px_0_16px_-2px_rgba(0,0,0,0.60)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-300" />
                    <span className="text-sm font-bold tracking-wide text-white">Company</span>
                  </div>
                  {/* Count badge */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/25 text-white border border-primary/40 font-mono">
                    {companies.length}
                  </span>
                </div>
              </th>

              {/* Permit Type Columns */}
              {permitTypes.map((type) => {
                const typeName = type.name || type.permit_type_name || `Permit ${type.id}`;
                const TypeIcon = getPermitTypeIcon(typeName);
                const registeredCount = columnRegisteredCount.get(String(type.id)) || 0;

                return (
                  <th
                    key={String(type.id)}
                    className="sticky top-0 z-30 bg-slate-800 dark:bg-slate-900 px-4 py-3 font-semibold text-slate-100 border-r border-b border-slate-700 dark:border-slate-700/90 min-w-[240px] max-w-[290px]"
                  >
                    <div className="flex flex-col gap-1.5">
                      {/* Top Row: Icon + Permit Type Name + Optional Code Chip */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-primary/25 border border-primary/40 text-white shrink-0">
                          <TypeIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span
                          className="truncate font-semibold text-xs tracking-tight text-white flex-1"
                          title={typeName}
                        >
                          {typeName}
                        </span>
                        {type.code && (
                          <span className="text-slate-300 font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-700/80 border border-slate-600 shrink-0">
                            {type.code}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Left-aligned clean registration count indicator */}
                      <div className="flex items-center gap-1.5 pl-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-[11px] font-normal text-slate-300">
                          <strong className="font-semibold text-slate-100">{registeredCount}</strong> of {companies.length} companies registered
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── TBODY ── */}
          <tbody>
            {companies.map((company, companyIdx) => {
              const companyRegistered = rowRegisteredCount.get(company.company_id) || 0;
              const avatarGradient = getAvatarGradient(company.company_name);
              const isEven = companyIdx % 2 === 0;

              // 100% solid, fully opaque row & sticky colors with deep contrast
              const rowBgClass = isEven
                ? "bg-white dark:bg-slate-950"
                : "bg-slate-50 dark:bg-slate-900";
              const stickyBgClass = isEven
                ? "bg-white dark:bg-slate-950 group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                : "bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800";
              const cellHoverClass = isEven
                ? "group-hover:bg-slate-100/70 dark:group-hover:bg-slate-900/80"
                : "group-hover:bg-slate-100/70 dark:group-hover:bg-slate-800/80";

              return (
                <tr
                  key={company.company_id}
                  className={`group ${rowBgClass} transition-colors`}
                >
                  {/* Sticky Company Column - 100% Solid & Fixed 350px Width */}
                  <td
                    className={`sticky left-0 z-20 ${stickyBgClass} px-4 py-3 border-r border-b border-slate-200 dark:border-slate-700 w-[350px] min-w-[350px] max-w-[350px] align-middle shadow-[4px_0_12px_-2px_rgba(0,0,0,0.10)] dark:shadow-[6px_0_16px_-2px_rgba(0,0,0,0.60)] transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <CompanyAvatar
                        logo={company.company_logo}
                        name={company.company_name}
                        code={company.company_code}
                        gradient={avatarGradient}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="font-semibold text-foreground leading-tight text-sm truncate"
                            title={company.company_name}
                          >
                            {company.company_name}
                          </p>
                          <span
                            className="text-[10px] text-muted-foreground font-medium shrink-0 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                            title={`Registered in ${companyRegistered} of ${totalActiveTypes || permitTypes.length} active compliance requirements`}
                          >
                            {companyRegistered}/{totalActiveTypes || permitTypes.length}
                          </span>
                        </div>

                        {/* TIN & Address info */}
                        <div className="mt-1 space-y-0.5">
                          {company.company_tin ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded shrink-0">
                                TIN: {company.company_tin}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-muted-foreground/60 italic">
                                No TIN provided
                              </span>
                            </div>
                          )}

                          {company.company_address ? (
                            <div className="flex items-start gap-1 text-[11px] text-muted-foreground leading-snug">
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70 mt-0.5" />
                              <span className="truncate" title={company.company_address}>
                                {company.company_address}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50 italic">
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                              <span className="truncate">No Address</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Matrix Cells */}
                  {permitTypes.map((permitType) => {
                    const key = `${company.company_id}_${permitType.id}`;
                    const permit = permitMap.get(key);

                    return (
                      <td
                        key={String(permitType.id)}
                        className={`px-3 py-2.5 border-r border-b border-slate-200 dark:border-slate-700/80 align-middle ${cellHoverClass} transition-colors`}
                      >
                        {permit ? (
                          /* Existing Permit Card */
                          (() => {
                            const expiryStr = permit.expiry_date || permit.expiration_date || "";
                            const status = getPermitStatus(expiryStr, permit.status);
                            const StatusIcon = status.icon;

                            return (
                              <div
                                className={`relative p-2.5 rounded-lg border border-l-4 ${status.borderAccent} ${status.cardBg} hover:shadow-md transition-all duration-200 flex flex-col gap-1.5`}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <span
                                    className="font-mono font-bold text-xs text-foreground truncate max-w-[130px]"
                                    title={`Permit #: ${permit.permit_number}`}
                                  >
                                    {permit.permit_number}
                                  </span>
                                  <Badge
                                    variant={status.variant}
                                    className={`text-[10px] px-1.5 py-0 h-4.5 font-medium gap-1 shrink-0 ${status.className}`}
                                  >
                                    <StatusIcon className="h-2.5 w-2.5" />
                                    {status.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Calendar className="h-3 w-3 shrink-0" />
                                  <span>Expires: {formatDate(expiryStr)}</span>
                                </div>

                                {/* Card footer divider */}
                                <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                                  <span
                                    className="text-[10px] text-muted-foreground truncate max-w-[110px]"
                                    title={permit.issuing_agency || "No agency stated"}
                                  >
                                    {permit.issuing_agency || "No agency stated"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewPermitDetails(permit, company, permitType)}
                                    className="h-5 px-1.5 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1 font-medium rounded cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          /* Empty Slot with visible dashed border & depth */
                          <div
                            onClick={() => onAddPermitForCell(company, permitType)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                onAddPermitForCell(company, permitType);
                              }
                            }}
                            className="group/cell h-14 w-full rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600/90 dark:bg-slate-900/50 hover:border-primary dark:hover:border-primary hover:bg-primary/[0.04] dark:hover:bg-primary/[0.12] flex items-center justify-center cursor-pointer transition-all duration-150"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 dark:text-slate-400 group-hover/cell:text-primary group-hover/cell:font-medium transition-colors">
                              <div className="h-6 w-6 rounded-full border border-dashed border-slate-400 dark:border-slate-500 group-hover/cell:border-primary group-hover/cell:bg-primary/10 flex items-center justify-center transition-all">
                                <Plus className="h-3.5 w-3.5" />
                              </div>
                              <span className="hidden group-hover/cell:inline transition-all text-xs">
                                Add Permit
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
