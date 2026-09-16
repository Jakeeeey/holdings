"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertOctagon, TrendingDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAgingSlobData } from "@/modules/holdings/executive-dashboard/aging-and-slob/services/aging-slob";
import type { SlobAging } from "@/modules/holdings/executive-dashboard/aging-and-slob/types";

const formatShort = (val: number) => {
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(2)}M`;
  if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(1)}k`;
  return `${sign}₱${absVal.toFixed(2)}`;
};

interface TopSlobProduct {
  productId: number;
  productName: string;
  supplier: string;
  stockQty: number;
  stockValue: number;
  share: number;
}

interface AgingSlobPreviewCardProps {
  group: { id: number; group_name: string; [key: string]: unknown };
}

const ROW_COLORS = [
  "bg-rose-600 dark:bg-rose-500",
  "bg-amber-600 dark:bg-amber-500",
  "bg-orange-500",
  "bg-slate-500 dark:bg-slate-400",
  "bg-zinc-500 dark:bg-zinc-400",
];

export function AgingSlobPreviewCard({ group }: AgingSlobPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [totalSlobValue, setTotalSlobValue] = useState(0);
  const [topProducts, setTopProducts] = useState<TopSlobProduct[]>([]);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data: SlobAging[] = await fetchAgingSlobData(group.id);

        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          // Aggregate by product
          const map = new Map<
            string,
            {
              productId: number;
              productName: string;
              supplier: string;
              stockQty: number;
              stockValue: number;
            }
          >();

          let totalDeadValue = 0;

          data.forEach((r) => {
            const val = Number(r.stockValue || 0);
            const qty = Number(r.currentStock || 0);
            const isSlob = r.isSlob === 1;

            if (isSlob) {
              totalDeadValue += val;
              const name = (r.productName && String(r.productName).trim()) || "Unknown Item";
              const prev = map.get(name) || {
                productId: r.productId || 0,
                productName: name,
                supplier: r.supplierShortcut || "N/A",
                stockQty: 0,
                stockValue: 0,
              };

              map.set(name, {
                ...prev,
                stockQty: prev.stockQty + qty,
                stockValue: prev.stockValue + val,
              });
            }
          });

          const sorted = Array.from(map.values())
            .map((p) => ({
              ...p,
              share: totalDeadValue > 0 ? (p.stockValue / totalDeadValue) * 100 : 0,
            }))
            .sort((a, b) => b.stockValue - a.stockValue)
            .slice(0, 5);

          setTotalSlobValue(totalDeadValue);
          setTopProducts(sorted);
          setSyncPending(false);
        } else {
          setTotalSlobValue(0);
          setTopProducts([]);
          setSyncPending(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn(`Aging SLOB pending for group ${group.id}:`, err);
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

  const top5TotalValue = topProducts.reduce((acc, p) => acc + p.stockValue, 0);
  const top5Share = totalSlobValue > 0 ? (top5TotalValue / totalSlobValue) * 100 : 0;

  return (
    <Link
      href={`/holdings/executive-dashboard/sales/${group.id}/aging-and-slob`}
      className="block h-full cursor-pointer group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl shadow-sm">
        {/* Header */}
        <CardHeader className="border-b border-border/40 pb-4 pt-5 px-6 bg-muted/10">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                  {group.group_name || "Aging & SLOB Stock"}
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
                Top dead stock items &gt;60 days idle &amp; tied capital
              </p>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/40 shadow-xs text-muted-foreground group-hover:text-destructive transition-colors shrink-0">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-6 flex flex-col justify-between gap-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
              <Skeleton className="h-8 w-full rounded-lg mt-2" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((p, idx) => {
                const colorClass = ROW_COLORS[idx % ROW_COLORS.length];

                return (
                  <div key={`${p.productName}-${idx}`} className="space-y-1.5">
                    {/* Product Name & Tied Stock Value */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`h-2.5 w-2.5 rounded-xs shrink-0 ${colorClass}`} />
                        <span className="font-semibold text-sm text-foreground truncate" title={p.productName}>
                          {p.productName}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-foreground tabular-nums shrink-0">
                        {formatShort(p.stockValue)}
                      </span>
                    </div>

                    {/* Sub-row: Share %, Qty, Supplier */}
                    <div className="flex items-center justify-between text-[11px] pl-4.5">
                      <span className="text-muted-foreground">
                        {p.share.toFixed(1)}% Share &bull; {p.stockQty.toLocaleString()} Qty
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        {p.supplier}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pl-4.5">
                      <div className="relative h-1.5 w-full bg-rose-100/60 dark:bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                          style={{ width: `${Math.min(p.share, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Highlight Banner / Pill Footer */}
              <div className="mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Top 5 SLOB Stock:
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {top5Share.toFixed(1)}% of Dead Inventory ({formatShort(totalSlobValue)})
                </span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <TrendingDown className="h-8 w-8 opacity-30" />
              <p className="text-xs font-semibold uppercase tracking-wider">No SLOB Inventory Found</p>
            </div>
          )}

          {/* Footer Nav Link */}
          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] font-bold text-muted-foreground group-hover:text-destructive transition-colors">
            <span>View Detailed Aging &amp; SLOB Monitor</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
