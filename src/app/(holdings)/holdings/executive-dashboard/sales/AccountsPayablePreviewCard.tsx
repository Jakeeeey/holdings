"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Briefcase,
    Wallet,
    PhilippinePeso,
    AlertCircle,
    TrendingUp,
    Download,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    transformAPRows,
    deriveMetrics,
    buildCategoryBreakdown,
    formatPeso,
} from "@/modules/holdings/executive-dashboard/accounts-payable/utils";
import type {
    RawAPRow,
    APRecord,
    APMetrics,
    APCategoryBreakdown,
} from "@/modules/holdings/executive-dashboard/accounts-payable/types";

interface AccountsPayablePreviewCardProps {
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
                    "text-[11px] font-bold tabular-nums truncate mt-0.5",
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

function CategoryCard({
    data,
    label,
    icon,
    gradient,
}: {
    data: APCategoryBreakdown;
    label: "Trade" | "Non-Trade";
    icon: React.ReactNode;
    gradient: string;
}) {
    const { totalPayable, totalPaid, totalOutstanding, totalRecords, overdueCount, paidPct } = data;
    const deltaTone = paidPct >= 80 ? "up" : paidPct >= 40 ? "neutral" : "down";

    return (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs hover:border-border transition-all">
            <div
                className={cn("absolute inset-0 opacity-[0.04] pointer-events-none", gradient)}
                aria-hidden
            />
            <div className="relative p-3 sm:p-3.5 flex flex-col justify-between h-full">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs shrink-0",
                                gradient
                            )}
                        >
                            {icon}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                                {label} Payables
                            </p>
                            <p className="text-lg sm:text-xl font-black tracking-tight tabular-nums leading-tight mt-0.5">
                                {formatPeso(totalOutstanding)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                        <Stat
                            icon={<PhilippinePeso className="h-2.5 w-2.5" />}
                            label="Payable"
                            value={formatPeso(totalPayable)}
                        />
                        <Stat
                            icon={<Wallet className="h-2.5 w-2.5" />}
                            label="Paid"
                            value={formatPeso(totalPaid)}
                            tone="up"
                        />
                        <Stat
                            icon={
                                overdueCount > 0 ? (
                                    <AlertCircle className="h-2.5 w-2.5 text-rose-500" />
                                ) : (
                                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                                )
                            }
                            label={overdueCount > 0 ? "Overdue" : "Healthy"}
                            value={`${overdueCount} inv`}
                            tone={overdueCount > 0 ? "down" : "up"}
                        />
                    </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        <span>Settlement Rate</span>
                        <span className="tabular-nums font-mono font-bold text-foreground">
                            {paidPct.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                deltaTone === "up" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                                deltaTone === "down" && "bg-gradient-to-r from-rose-500 to-rose-400",
                                deltaTone === "neutral" && "bg-gradient-to-r from-amber-500 to-amber-400"
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, paidPct))}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                        <span>
                            <span className="font-bold text-foreground">{totalRecords}</span> records on file
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AccountsPayablePreviewCard({
    group,
    startDate,
    endDate,
}: AccountsPayablePreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<APRecord[]>([]);
    const [metrics, setMetrics] = useState<APMetrics | null>(null);

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
                    `/api/holdings/executive-dashboard/sales/${group.id}/accounts-payable?${params}`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);

                const result = await res.json();
                const rows: RawAPRow[] = Array.isArray(result)
                    ? result
                    : (result.rows ?? result.data ?? result.content ?? result.transactions ?? []);

                const parsed = transformAPRows(rows);
                if (!isMounted) return;

                setRecords(parsed);
                setMetrics(deriveMetrics(parsed));
            } catch (err) {
                if (isMounted) {
                    console.warn(`AP metrics pending for group ${group.id}:`, err);
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

    const [trade, nonTrade] = useMemo(() => {
        const breakdown = buildCategoryBreakdown(records);
        return [breakdown[0], breakdown[1]];
    }, [records]);

    const totalOutstanding = (trade?.totalOutstanding ?? 0) + (nonTrade?.totalOutstanding ?? 0);
    const tradePct = totalOutstanding > 0 ? ((trade?.totalOutstanding ?? 0) / totalOutstanding) * 100 : 0;
    const nonTradePct = totalOutstanding > 0 ? ((nonTrade?.totalOutstanding ?? 0) / totalOutstanding) * 100 : 0;

    const exportToPDF = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
        ]);
        const doc = new jsPDF({ orientation: "landscape" });
        const pageW = doc.internal.pageSize.getWidth();
        const totalPayable = metrics?.totalPayable ?? 0;
        const formattedPayable = `PHP ${totalPayable.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
        const formattedOutstanding = `PHP ${totalOutstanding.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(`Accounts Payable Summary (${group.group_name || "Holdings"})`, 14, 16);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const totalLabel = `Outstanding: ${formattedOutstanding}   |   Total Payables: ${formattedPayable}`;
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
                "Ref. No.", "Supplier", "Invoice No.", "Division", "Due Date",
                "Amount Payable (PHP)", "Amount Paid (PHP)", "Outstanding (PHP)", "Status", "Category"
            ]],
            body: records.slice(0, 500).map((r) => [
                r.refNo,
                r.supplier,
                r.invoiceNo !== "—" ? r.invoiceNo : "",
                r.division,
                r.dueDate ? r.dueDate.split(" ")[0] : "—",
                r.amountPayable.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.outstandingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.status,
                r.apCategory,
            ]),
            margin: { left: 14, right: 14 },
        });

        doc.save(`ap-summary-${group.id}-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const targetUrl = `/holdings/executive-dashboard/sales/${group.id}/accounts-payable`;

    return (
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 w-full">
            <Card className="relative overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 sm:p-4 space-y-2.5">
                    {/* Compact Header Banner */}
                    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-amber-500/5 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Financial Monitoring
                                </p>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                                    {group.group_name || "Accounts Payable"}
                                </h3>
                                <span className="text-[11px] text-muted-foreground truncate hidden md:inline font-medium">
                                    • Trade vs Non-Trade payables, aging &amp; supplier exposure
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {!loading && (
                                <div className="hidden sm:flex items-center gap-3.5 text-right border-r border-border/60 pr-3.5">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Outstanding Balance
                                        </p>
                                        <p className="text-base sm:text-lg font-black font-mono text-foreground leading-tight">
                                            {formatPeso(totalOutstanding)}
                                        </p>
                                    </div>
                                    <div className="border-l border-border/50 pl-3.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Total Payables
                                        </p>
                                        <p className="text-base sm:text-lg font-black font-mono text-primary leading-tight">
                                            {formatPeso(metrics?.totalPayable ?? 0)}
                                        </p>
                                    </div>
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
                            {/* Two Side-by-Side Cards: Trade & Non-Trade */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <CategoryCard
                                    data={trade}
                                    label="Trade"
                                    icon={<Briefcase className="h-4 w-4" />}
                                    gradient="bg-gradient-to-br from-sky-500 to-indigo-500"
                                />
                                <CategoryCard
                                    data={nonTrade}
                                    label="Non-Trade"
                                    icon={<Wallet className="h-4 w-4" />}
                                    gradient="bg-gradient-to-br from-amber-500 to-rose-500"
                                />
                            </div>

                            {/* Compact Stacked Composition Bar */}
                            <div className="rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-2xs">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                                    <span>Composition by Outstanding Amount</span>
                                    <div className="flex items-center gap-2 font-mono">
                                        <span className="text-muted-foreground font-medium hidden sm:inline">
                                            Total Payables: <strong className="text-foreground">{formatPeso(metrics?.totalPayable ?? 0)}</strong>
                                        </span>
                                        <span className="hidden sm:inline text-border">|</span>
                                        <span className="text-foreground font-bold">
                                            {formatPeso(totalOutstanding)} OUTSTANDING BALANCE
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden bg-muted flex">
                                    <div
                                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                                        style={{ width: `${tradePct}%` }}
                                        title={`Trade: ${tradePct.toFixed(1)}%`}
                                    />
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                                        style={{ width: `${nonTradePct}%` }}
                                        title={`Non-Trade: ${nonTradePct.toFixed(1)}%`}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1.5 text-[10px]">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
                                        Trade <span className="font-bold font-mono text-foreground">{tradePct.toFixed(1)}%</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                                        Non-Trade <span className="font-bold font-mono text-foreground">{nonTradePct.toFixed(1)}%</span>
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AccountsPayablePreviewCard;
