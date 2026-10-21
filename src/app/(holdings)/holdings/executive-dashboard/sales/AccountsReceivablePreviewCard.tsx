"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Receipt,
    PhilippinePeso,
    AlertCircle,
    TrendingDown,
    Download,
    ChevronRight,
    CheckCircle2,
    Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    transformRawInvoices,
    deriveMetrics,
    buildAgingBuckets,
    formatPeso,
} from "@/modules/holdings/executive-dashboard/accounts-receivable/utils";
import type {
    RawInvoiceRow,
    Invoice,
    ARMetricsSummary,
    AgingBucket,
} from "@/modules/holdings/executive-dashboard/accounts-receivable/types";

interface AccountsReceivablePreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

function Stat({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: "up" | "down" | "neutral";
}) {
    return (
        <div className="rounded-md border border-border/50 bg-background/70 px-2 py-1">
            <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                {icon}
                {label}
            </div>
            <p
                className={cn(
                    "text-[11px] font-bold tabular-nums truncate mt-0.5 font-mono",
                    tone === "up" && "text-emerald-600 dark:text-emerald-400",
                    tone === "down" && "text-rose-600 dark:text-rose-400",
                    (!tone || tone === "neutral") && "text-foreground"
                )}
                title={value}
            >
                {value}
            </p>
        </div>
    );
}

export function AccountsReceivablePreviewCard({
    group,
    startDate,
    endDate,
}: AccountsReceivablePreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<Invoice[]>([]);
    const [metrics, setMetrics] = useState<ARMetricsSummary | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    startDate: startDate || "2020-01-01",
                    endDate: endDate || new Date().toISOString().split("T")[0],
                });

                const res = await fetch(
                    `/api/holdings/executive-dashboard/sales/${group.id}/accounts-receivable?${params}`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);

                const result = await res.json();
                const rows: RawInvoiceRow[] = Array.isArray(result)
                    ? result
                    : (result.rows ?? result.data ?? result.content ?? result.invoices ?? []);

                const parsed = transformRawInvoices(rows);
                if (!isMounted) return;

                setRecords(parsed);
                setMetrics(deriveMetrics(parsed));
            } catch (err) {
                if (isMounted) {
                    console.warn(`AR metrics pending for group ${group.id}:`, err);
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
    }, [group.id, startDate, endDate]);

    const agingData: AgingBucket[] = useMemo(() => buildAgingBuckets(records), [records]);

    const totalOutstanding = metrics?.totalOutstanding ?? 0;
    const totalReceivable = metrics?.totalReceivable ?? 0;
    const totalPaid = metrics?.totalPaid ?? 0;
    const totalOverdue = metrics?.totalOverdue ?? 0;
    const collectionRate = metrics?.collectionRate ?? 0;
    const overdueRate = totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

    const exportToPDF = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
        ]);
        const doc = new jsPDF({ orientation: "landscape" });
        const pageW = doc.internal.pageSize.getWidth();
        const total = totalReceivable;
        const formattedTotal = `PHP ${total.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(`Accounts Receivable Summary (${group.group_name || "Holdings"})`, 14, 16);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const totalLabel = `Grand Total: ${formattedTotal}`;
        const totalLabelX = Math.max(pageW / 2, pageW - 14 - doc.getTextWidth(totalLabel));
        doc.text(totalLabel, totalLabelX, 16);

        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(14, 20, pageW - 14, 20);

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
            `Exported: ${new Date().toLocaleString("en-PH")}   Total Records: ${records.length}`,
            14,
            26
        );

        autoTable(doc, {
            startY: 32,
            headStyles: { fillColor: [24, 24, 27], fontSize: 7, textColor: 255 },
            bodyStyles: { fontSize: 7 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            head: [[
                "Invoice No.", "Customer", "Salesman", "Due Date",
                "Net Receivable (PHP)", "Paid (PHP)", "Outstanding (PHP)", "Overdue", "Status"
            ]],
            body: records.slice(0, 500).map((r) => [
                r.invoiceNo,
                r.customer,
                r.salesman,
                r.due ? r.due.split(" ")[0] : "—",
                r.netReceivable.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.outstanding.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.overdue !== null && r.overdue > 0 ? `${r.overdue}d` : "—",
                r.status,
            ]),
            margin: { left: 14, right: 14 },
        });

        doc.save(`ar-summary-${group.id}-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const targetUrl = `/holdings/executive-dashboard/sales/${group.id}/accounts-receivable`;

    return (
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 w-full">
            <Card className="relative overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 sm:p-4 space-y-2.5">
                    {/* Compact Header Banner */}
                    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-emerald-500/5 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Financial Monitoring
                                </p>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                                    {group.group_name || "Accounts Receivable"}
                                </h3>
                                <span className="text-[11px] text-muted-foreground truncate hidden md:inline font-medium">
                                    • Customer aging, overdue receivables &amp; collection efficiency
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {!loading && (
                                <div className="text-right border-r border-border/60 pr-3 hidden sm:block">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        Total Receivable
                                    </p>
                                    <p className="text-base sm:text-lg font-black font-mono text-primary leading-tight">
                                        {formatPeso(totalReceivable)}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToPDF}
                                    className="h-7 px-2.5 text-[11px] gap-1 shadow-2xs font-semibold"
                                    disabled={loading || records.length === 0}
                                >
                                    <Download className="h-3 w-3" />
                                    Export PDF
                                </Button>
                                <Button asChild size="sm" className="h-7 px-3 text-[11px] gap-1 font-bold shadow-2xs">
                                    <Link href={targetUrl}>
                                        View Full Report
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-2.5 pt-0.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <Skeleton className="h-36 rounded-xl" />
                                <Skeleton className="h-36 rounded-xl" />
                            </div>
                            <Skeleton className="h-14 rounded-lg" />
                        </div>
                    ) : (
                        <>
                            {/* Two Side-by-Side Cards: Active Receivables & Aging Exposure */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {/* Left: Active Receivables */}
                                <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs hover:border-border transition-all">
                                    <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-br from-blue-500 to-sky-500 pointer-events-none" />
                                    <div className="relative p-3 sm:p-3.5 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs bg-gradient-to-br from-blue-500 to-sky-500 shrink-0">
                                                    <Receipt className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                                                        Outstanding Receivables
                                                    </p>
                                                    <p className="text-lg sm:text-xl font-black font-mono tracking-tight tabular-nums leading-tight mt-0.5">
                                                        {formatPeso(totalOutstanding)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                                                <Stat
                                                    icon={<Receipt className="h-2.5 w-2.5" />}
                                                    label="Receivable"
                                                    value={formatPeso(totalReceivable)}
                                                />
                                                <Stat
                                                    icon={<CheckCircle2 className="h-2.5 w-2.5" />}
                                                    label="Collected"
                                                    value={formatPeso(totalPaid)}
                                                    tone="up"
                                                />
                                                <Stat
                                                    icon={<Users className="h-2.5 w-2.5" />}
                                                    label="Customers"
                                                    value={`${metrics?.activeCustomers ?? 0} cust`}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-border/40">
                                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                <span>Collection Efficiency</span>
                                                <span className="tabular-nums font-mono font-bold text-foreground">
                                                    {collectionRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                                                <span>
                                                    <span className="font-bold text-foreground">{records.length}</span> total invoices on file
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Past Due & Overdue Exposure */}
                                <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs hover:border-border transition-all">
                                    <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-br from-rose-500 to-amber-500 pointer-events-none" />
                                    <div className="relative p-3 sm:p-3.5 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs bg-gradient-to-br from-rose-500 to-amber-500 shrink-0">
                                                    <AlertCircle className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                                                        Past Due Exposure
                                                    </p>
                                                    <p className="text-lg sm:text-xl font-black font-mono tracking-tight tabular-nums leading-tight mt-0.5 text-rose-600 dark:text-rose-400">
                                                        {formatPeso(totalOverdue)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                                                <Stat
                                                    icon={<AlertCircle className="h-2.5 w-2.5" />}
                                                    label="Overdue"
                                                    value={`${metrics?.overdueCount ?? 0} inv`}
                                                    tone={metrics?.overdueCount ? "down" : "up"}
                                                />
                                                <Stat
                                                    icon={<PhilippinePeso className="h-2.5 w-2.5" />}
                                                    label="Avg Days"
                                                    value={`${metrics?.avgOverdueDays ?? 0} days`}
                                                    tone={metrics?.avgOverdueDays ? "down" : "neutral"}
                                                />
                                                <Stat
                                                    icon={<TrendingDown className="h-2.5 w-2.5" />}
                                                    label="Due Invoices"
                                                    value={`${records.length - (metrics?.overdueCount ?? 0)} due`}
                                                    tone="neutral"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-border/40">
                                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                <span>Overdue Share of Outstanding</span>
                                                <span className="tabular-nums font-mono font-bold text-foreground">
                                                    {overdueRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, overdueRate))}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                                                <span>
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">{metrics?.overdueCount ?? 0}</span> invoices need immediate escalation
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Stacked Aging Composition Bar */}
                            <div className="rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-2xs">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                                    <span>Composition by Aging Range</span>
                                    <div className="flex items-center gap-2 font-mono">
                                        <span className="text-muted-foreground font-medium hidden sm:inline">
                                            Total Receivable: <strong className="text-foreground">{formatPeso(totalReceivable)}</strong>
                                        </span>
                                        <span className="hidden sm:inline text-border">|</span>
                                        <span className="text-foreground font-bold">
                                            {formatPeso(totalOutstanding)} OUTSTANDING
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden bg-muted flex">
                                    {agingData.map((bucket, idx) => {
                                        const colors = [
                                            "bg-emerald-500", // 0-30
                                            "bg-amber-500",   // 31-60
                                            "bg-orange-500",  // 61-90
                                            "bg-rose-500",    // 90+
                                        ];
                                        return (
                                            <div
                                                key={bucket.range}
                                                className={cn("h-full transition-all duration-500", colors[idx % colors.length])}
                                                style={{ width: `${bucket.percentage || 0}%` }}
                                                title={`${bucket.range}: ${formatPeso(bucket.amount)} (${(bucket.percentage || 0).toFixed(1)}%)`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-between mt-1.5 text-[10px]">
                                    {agingData.map((bucket, idx) => {
                                        const dotColors = [
                                            "bg-emerald-500",
                                            "bg-amber-500",
                                            "bg-orange-500",
                                            "bg-rose-500",
                                        ];
                                        return (
                                            <span key={bucket.range} className="flex items-center gap-1 text-muted-foreground font-medium">
                                                <span className={cn("inline-block w-2 h-2 rounded-full", dotColors[idx % dotColors.length])} />
                                                <span>{bucket.range.replace(' Days', 'd')}</span>{" "}
                                                <span className="font-bold font-mono text-foreground">
                                                    {(bucket.percentage || 0).toFixed(0)}%
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AccountsReceivablePreviewCard;
