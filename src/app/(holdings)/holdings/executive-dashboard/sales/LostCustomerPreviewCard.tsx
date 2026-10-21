"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserX, AlertTriangle, ChevronRight, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLostCustomerData } from "@/modules/holdings/executive-dashboard/lost-customer/providers/fetchProvider";
import type { LostCustomerReportData } from "@/modules/holdings/executive-dashboard/lost-customer/types";

interface LostCustomerPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
}

function formatPhpShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}k`;
  }
  return `₱${amount.toFixed(2)}`;
}

export function LostCustomerPreviewCard({ group }: LostCustomerPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LostCustomerReportData | null>(null);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchLostCustomerData(group.id);
        if (!isMounted) return;
        setData(res);
        setSyncPending(false);
      } catch (err) {
        if (isMounted) {
          console.warn(`Lost customer metrics pending for group ${group.id}:`, err);
          setSyncPending(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [group.id]);

  const kpis = data?.kpis;
  const tagList = (data?.taggingDistribution || []).slice(0, 3);
  const total = kpis?.totalCustomers || 1;

  return (
    <Link
      href={`/holdings/executive-dashboard/sales/${group.id}/lost-customer`}
      className="block h-full cursor-pointer group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-red-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm min-h-[290px]">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-red-500/10 transition-colors duration-500 pointer-events-none" />
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
          <UserX className="h-36 w-36 text-foreground" />
        </div>

        {/* Header */}
        <CardHeader className="border-b border-border/40 pb-3 pt-5 px-6 bg-muted/10 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                  {group.group_name || "Lost Customer Management"}
                </CardTitle>
                {syncPending && (
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-bold tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/5 shrink-0"
                  >
                    Sync Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Dormant &amp; at-risk account churn monitoring
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform shrink-0">
              <UserX className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 flex flex-col justify-between flex-1 relative z-10 gap-4">
          {loading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-32" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ) : (
            <>
              {/* Headline Stats */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 block">
                      Inactive Accounts
                    </span>
                    <div className="text-3xl font-black italic tracking-tight text-foreground flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-red-500">{(kpis?.totalCustomers ?? 0).toLocaleString()}</span>
                      <span className="text-xs font-semibold not-italic text-muted-foreground">
                        accounts
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 block">
                      Revenue at Risk
                    </span>
                    <div className="text-lg font-black tracking-tight text-amber-500 flex items-center justify-end gap-1 mt-0.5">
                      <TrendingDown className="h-4 w-4" />
                      <span>{formatPhpShort(kpis?.totalValueAtRisk ?? 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Inactivity summary badge & bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-red-500" />
                      Avg Inactivity: <strong className="text-foreground">{kpis?.avgDaysInactive ?? 0} days</strong>
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 font-bold">
                      {(kpis?.lostCount ?? 0)} Lost / {(kpis?.atRiskCount ?? 0)} At-Risk
                    </Badge>
                  </div>
                  <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                    <div
                      className="h-full bg-red-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      style={{ width: `${Math.min(100, (((kpis?.lostCount ?? 0) + (kpis?.atRiskCount ?? 0)) / total) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tagging Breakdown Highlights */}
              <div className="space-y-2.5 pt-1 border-t border-border/30">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-red-500" /> Account Status Breakdown
                  </span>
                  <span>Volume &amp; Sales</span>
                </div>

                <div className="space-y-1.5">
                  {tagList.length > 0 ? (
                    tagList.map((tag) => (
                      <div key={tag.tag} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {tag.tag}
                          </span>
                          <span className="text-muted-foreground text-[10px] font-medium">
                            {tag.count} accts • {formatPhpShort(tag.totalSales)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              tag.tag.toLowerCase().includes("lost")
                                ? "bg-red-500"
                                : tag.tag.toLowerCase().includes("risk")
                                ? "bg-amber-500"
                                : "bg-orange-500"
                            } transition-all duration-500`}
                            style={{ width: `${Math.min(100, tag.share ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-muted-foreground/70 italic text-center py-2">
                      No inactive accounts categorized
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Footer CTA */}
          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 group-hover:text-red-500 transition-colors">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              View Lost Customer Report
            </span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
