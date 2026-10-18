"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Building2,
  MapPin,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CompanyHealthRecord, DashboardPermitItem } from "../types/permit-dashboard.types";
import { DashboardPermitPreviewDialog } from "./DashboardPermitPreviewDialog";
import { PermitProductCard } from "./PermitProductCard";

interface CompanyHealthTableProps {
  companies: CompanyHealthRecord[];
  isLoading: boolean;
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
      <div className="w-16 h-11 rounded-lg overflow-hidden border border-border/80 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-xs p-1">
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

export const CompanyHealthTable: React.FC<CompanyHealthTableProps> = ({ companies, isLoading }) => {
  const [expandedCompanies, setExpandedCompanies] = useState<Record<number, boolean>>({});
  const [previewPermit, setPreviewPermit] = useState<DashboardPermitItem | null>(null);
  const [selectedCompanyPermits, setSelectedCompanyPermits] = useState<DashboardPermitItem[]>([]);

  const toggleExpand = (companyId: number) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full border rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] bg-card text-muted-foreground gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium">Analyzing company permit health records...</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="w-full border rounded-xl p-12 text-center bg-card">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold">No Companies Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Try resetting the health filter or searching for another company keyword.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Company Permit Health Overview
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed tracking of compliance rates, valid documents, and permits requiring renewal
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            <span className="font-bold text-foreground">{companies.length}</span> Entities
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            {/* Elevated Table Header with Strong Visual Hierarchy */}
            <thead className="bg-slate-900 text-slate-100 shadow-md">
              <tr>
                <th className="px-4 py-3.5 min-w-[280px] font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>Company</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 min-w-[190px] font-semibold text-slate-100">Health Status</th>
                <th className="px-4 py-3.5 min-w-[200px] font-semibold text-slate-100">Compliance Rate</th>
                <th className="px-4 py-3.5 min-w-[220px] font-semibold text-slate-100">Permit Summary</th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((comp) => {
                const isExpanded = Boolean(expandedCompanies[comp.company_id]);
                const avatarGradient = getAvatarGradient(comp.company_name);

                // Health badge styling with clean English terms
                let healthBadge = {
                  label: "Fully Compliant",
                  className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                  icon: ShieldCheck,
                };

                if (comp.health_level === "unmonitored" || comp.total_permits === 0) {
                  healthBadge = {
                    label: "No Permits Recorded",
                    className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
                    icon: AlertCircle,
                  };
                } else if (comp.health_level === "critical") {
                  healthBadge = {
                    label: "Action Required: Expired",
                    className: "bg-destructive/15 text-destructive border-destructive/30",
                    icon: AlertOctagon,
                  };
                } else if (comp.health_level === "warning") {
                  healthBadge = {
                    label: "Expiring Soon (Within 90 Days)",
                    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
                    icon: AlertTriangle,
                  };
                }

                const HealthIcon = healthBadge.icon;
                const activePermits = comp.permits;

                return (
                  <React.Fragment key={comp.company_id}>
                    <tr
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors ${
                        comp.health_level === "critical"
                          ? "bg-destructive/[0.02]"
                          : comp.health_level === "warning"
                          ? "bg-amber-500/[0.02]"
                          : ""
                      }`}
                    >
                      {/* Company Column - Rich Details Mirroring Permit Creation */}
                      <td className="px-4 py-3.5 max-w-[320px]">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar
                            logo={comp.company_logo}
                            name={comp.company_name}
                            code={comp.company_code}
                            gradient={avatarGradient}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="font-semibold text-foreground leading-tight text-sm truncate"
                                title={comp.company_name}
                              >
                                {comp.company_name}
                              </p>
                            </div>

                            {/* TIN & Address info */}
                            <div className="mt-1 space-y-0.5">
                              {comp.company_tin ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded shrink-0">
                                    TIN: {comp.company_tin}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-muted-foreground/60 italic">
                                    No TIN provided
                                  </span>
                                </div>
                              )}

                              {comp.company_address ? (
                                <div className="flex items-start gap-1 text-[11px] text-muted-foreground leading-snug">
                                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70 mt-0.5" />
                                  <span className="truncate" title={comp.company_address}>
                                    {comp.company_address}
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

                      {/* Health Status Column */}
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className={`gap-1.5 py-1 text-xs font-semibold ${healthBadge.className}`}>
                          <HealthIcon className="h-3.5 w-3.5" />
                          {healthBadge.label}
                        </Badge>
                      </td>

                      {/* Compliance Progress Column */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5 max-w-[180px]">
                          {comp.total_permits === 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-medium bg-muted px-2 py-0.5 rounded text-[11px]">
                                No permits recorded
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">
                                  {comp.compliance_percentage}%
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                  {comp.active_count + comp.expiring_count} / {comp.total_permits} valid
                                </span>
                              </div>
                              <Progress
                                value={comp.compliance_percentage}
                                className={`h-2 ${
                                  comp.health_level === "critical"
                                    ? "[&>div]:bg-destructive"
                                    : comp.health_level === "warning"
                                    ? "[&>div]:bg-amber-500"
                                    : "[&>div]:bg-emerald-500"
                                }`}
                              />
                            </>
                          )}
                        </div>
                      </td>

                      {/* Permit Counts Breakdown Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                            {comp.active_count} Active
                          </span>
                          {comp.expiring_count > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                              {comp.expiring_count} Expiring
                            </span>
                          )}
                          {comp.expired_count > 0 && (
                            <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-bold">
                              {comp.expired_count} Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(comp.company_id)}
                          className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-3.5 w-3.5" />
                              View Permits ({comp.total_permits})
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded Row: Product Card Showcase Grid without redundant sub-tab */}
                    {isExpanded && (
                      <tr className="bg-muted/15">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="rounded-xl border bg-card p-4 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b pb-2.5">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-foreground">
                                  Current Monitored Permits ({activePermits.length})
                                </span>
                              </div>

                              <span className="text-xs text-muted-foreground font-semibold">
                                {comp.company_name}
                              </span>
                            </div>

                            {activePermits.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-6 italic text-center">
                                No active permits recorded for this company.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                {activePermits.map((p) => (
                                  <PermitProductCard
                                    key={p.id}
                                    permit={p}
                                    isArchivedMode={false}
                                    onView={(selected) => {
                                      setSelectedCompanyPermits([
                                        ...comp.permits,
                                        ...comp.archived_permits,
                                      ]);
                                      setPreviewPermit(selected);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DashboardPermitPreviewDialog
        isOpen={Boolean(previewPermit)}
        onClose={() => setPreviewPermit(null)}
        permit={previewPermit}
        companyPermits={selectedCompanyPermits}
      />
    </>
  );
};
