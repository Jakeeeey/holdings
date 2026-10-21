"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Receipt,
    PhilippinePeso,
    AlertCircle,
    Clock,
    Info,
    Download,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/modules/holdings/executive-dashboard/accounts-receivable/utils";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

interface AccountsReceivablePreviewCardProps {
    group: { id: number; group_name: string; [key: string]: unknown };
    startDate?: string;
    endDate?: string;
}

interface ARMetrics {
    totalReceivable: number;
    totalOutstanding: number;
    totalUnposted: number;
    realOutstanding: number;
    avgOverdue: number;
    overdueCount: number;
    invoiceCount: number;
    totalPendingCancellation: number;
}

interface AgingBucketItem {
    range: string;
    amount: number;
}

interface SalesmanItem {
    name: string;
    value: number;
    unposted: number;
}

interface MetricCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    type: "receivable" | "outstanding" | "unposted" | "exposure" | "overdue";
    explanation?: React.ReactNode;
}

function MetricStat({ label, value, sub, icon, type, explanation }: MetricCardProps) {
    const config = {
        receivable: {
            border: "border-blue-500/20 dark:border-blue-500/30",
            bg: "bg-blue-500/[0.03] dark:bg-blue-500/[0.06]",
            text: "text-blue-600 dark:text-blue-400",
            iconBg: "bg-blue-50 dark:bg-blue-950/60",
        },
        outstanding: {
            border: "border-amber-500/20 dark:border-amber-500/30",
            bg: "bg-amber-500/[0.03] dark:bg-amber-500/[0.06]",
            text: "text-amber-600 dark:text-amber-400",
            iconBg: "bg-amber-50 dark:bg-amber-950/60",
        },
        unposted: {
            border: "border-purple-500/20 dark:border-purple-500/30",
            bg: "bg-purple-500/[0.03] dark:bg-purple-500/[0.06]",
            text: "text-purple-600 dark:text-purple-400",
            iconBg: "bg-purple-50 dark:bg-purple-950/60",
        },
        exposure: {
            border: "border-emerald-500/20 dark:border-emerald-500/30",
            bg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
            text: "text-emerald-600 dark:text-emerald-400",
            iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
        },
        overdue: {
            border: "border-rose-500/20 dark:border-rose-500/30",
            bg: "bg-rose-500/[0.03] dark:bg-rose-500/[0.06]",
            text: "text-rose-600 dark:text-rose-400",
            iconBg: "bg-rose-50 dark:bg-rose-950/60",
        },
    }[type];

    return (
        <div
            className={cn(
                "flex flex-col justify-between rounded-xl border p-3.5 shadow-2xs transition-all duration-200 relative overflow-hidden bg-card",
                config.border,
                config.bg
            )}
        >
            <div className="flex items-center justify-between gap-1.5 z-10">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 truncate">
                        {label}
                    </span>
                    {explanation && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-0.5 rounded-full text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                                    title="More info"
                                >
                                    <Info className="h-3 w-3" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80 p-3.5 border border-border bg-popover text-popover-foreground shadow-xl rounded-xl z-50 text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {explanation}
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <span
                    className={cn(
                        "p-1.5 rounded-full shrink-0 flex items-center justify-center",
                        config.iconBg,
                        config.text
                    )}
                >
                    {icon}
                </span>
            </div>
            <div className="mt-1.5 z-10">
                <div className="text-lg sm:text-xl font-black text-foreground tracking-tight tabular-nums leading-tight">
                    {value}
                </div>
                {sub && (
                    <div className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                        {sub}
                    </div>
                )}
            </div>
        </div>
    );
}

export function AccountsReceivablePreviewCard({
    group,
    startDate,
    endDate,
}: AccountsReceivablePreviewCardProps) {
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [metrics, setMetrics] = useState<ARMetrics | null>(null);
    const [agingData, setAgingData] = useState<AgingBucketItem[]>([]);
    const [salesmanData, setSalesmanData] = useState<SalesmanItem[]>([]);
    const [rawRows, setRawRows] = useState<Array<Record<string, unknown>>>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                if (!isMounted) return;

                if (result.metrics) {
                    setMetrics(result.metrics);
                }
                if (Array.isArray(result.agingData)) {
                    setAgingData(result.agingData);
                }
                if (Array.isArray(result.salesmanData)) {
                    setSalesmanData(result.salesmanData);
                }
                if (Array.isArray(result.rows)) {
                    setRawRows(result.rows);
                }
            } catch (err) {
                if (isMounted) {
                    console.warn(`AR metrics error for group ${group.id}:`, err);
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

    const exportToPDF = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
        ]);
        const doc = new jsPDF({ orientation: "landscape" });
        const pageW = doc.internal.pageSize.getWidth();
        const total = metrics?.totalReceivable ?? 0;
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
            `Exported: ${new Date().toLocaleString("en-PH")}   Total Invoices: ${metrics?.invoiceCount ?? rawRows.length}`,
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
            body: rawRows.slice(0, 500).map((r) => [
                String(r.invoiceNo || ""),
                String(r.customerName || r.customer || ""),
                String(r.salesman || ""),
                r.calculatedDueDate || r.due ? String(r.calculatedDueDate || r.due).split("T")[0] : "—",
                Number(r.netReceivable || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                Number(r.totalPaid || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                Number(r.outstandingBalance || r.outstanding || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }),
                r.daysOverdue !== null && Number(r.daysOverdue) > 0 ? `${r.daysOverdue}d` : "—",
                String(r.arStatus || r.paymentStatus || r.status || "—"),
            ]),
            margin: { left: 14, right: 14 },
        });

        doc.save(`ar-summary-${group.id}-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const targetUrl = `/holdings/executive-dashboard/sales/${group.id}/accounts-receivable`;

    const totalReceivable = metrics?.totalReceivable ?? 0;
    const totalOutstanding = metrics?.totalOutstanding ?? 0;
    const totalUnposted = metrics?.totalUnposted ?? 0;
    const realOutstanding = metrics?.realOutstanding ?? 0;
    const avgOverdue = metrics?.avgOverdue ?? 0;
    const overdueCount = metrics?.overdueCount ?? 0;
    const invoiceCount = metrics?.invoiceCount ?? 0;
    const totalPendingCancellation = metrics?.totalPendingCancellation ?? 0;

    return (
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 w-full">
            <Card className="relative overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 sm:p-4 space-y-3">
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
                                    • Customer aging, overdue receivables &amp; salesman exposure
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
                                    disabled={loading || rawRows.length === 0}
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
                        <div className="space-y-3 pt-0.5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 rounded-xl" />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Skeleton className="h-56 rounded-xl" />
                                <Skeleton className="h-56 rounded-xl" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Row 1: 5 Stat Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                <MetricStat
                                    label="Total Receivable"
                                    value={formatPeso(totalReceivable)}
                                    sub={`${invoiceCount} Invoices`}
                                    icon={<PhilippinePeso className="h-3.5 w-3.5" />}
                                    type="receivable"
                                />
                                <MetricStat
                                    label="Outstanding (Ledger)"
                                    value={formatPeso(totalOutstanding)}
                                    sub={
                                        totalPendingCancellation > 0
                                            ? `Pending cancellation: ${formatPeso(totalPendingCancellation)}`
                                            : `${((totalOutstanding / (totalReceivable || 1)) * 100).toFixed(1)}% of receivable`
                                    }
                                    icon={<AlertCircle className="h-3.5 w-3.5" />}
                                    type="outstanding"
                                />
                                <MetricStat
                                    label="Unposted Collections"
                                    value={formatPeso(totalUnposted)}
                                    sub="In settlement queue"
                                    icon={<Receipt className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                                    type="unposted"
                                    explanation={
                                        <div className="space-y-2">
                                            <div className="font-bold text-xs border-b border-border pb-1 text-foreground flex items-center justify-between">
                                                <span>Settlement Queue Summary</span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase">
                                                    Unposted Pool
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                Total collected cash and checks currently in unposted pouches:{" "}
                                                <strong className="text-foreground">{formatPeso(totalUnposted)}</strong>.
                                            </p>
                                        </div>
                                    }
                                />
                                <MetricStat
                                    label="Real AR Exposure"
                                    value={formatPeso(realOutstanding)}
                                    sub="Net outstanding balance"
                                    icon={<AlertCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                                    type="exposure"
                                />
                                <MetricStat
                                    label="Avg Days Overdue"
                                    value={`${avgOverdue}d`}
                                    sub={`across ${overdueCount} invoices`}
                                    icon={<Clock className="h-3.5 w-3.5" />}
                                    type="overdue"
                                />
                            </div>

                            {/* Row 2: 2 Charts Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                                {/* Left Chart: Aging Analysis */}
                                <Card className="border border-border/60 bg-card rounded-xl p-3 sm:p-3.5 shadow-2xs overflow-hidden flex flex-col justify-between">
                                    <CardHeader className="p-0 pb-2.5">
                                        <CardTitle className="text-sm font-bold text-foreground tracking-tight">
                                            Aging Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 min-w-0 w-full h-[210px]">
                                        {mounted && (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={agingData}
                                                    margin={{ top: 10, right: 12, left: 12, bottom: 5 }}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        vertical={false}
                                                        stroke="rgba(128,128,128,0.12)"
                                                    />
                                                    <XAxis
                                                        dataKey="range"
                                                        fontSize={11}
                                                        tickLine={false}
                                                        axisLine={{ stroke: "rgba(128,128,128,0.2)" }}
                                                    />
                                                    <YAxis
                                                        fontSize={10}
                                                        width={110}
                                                        tickLine={false}
                                                        axisLine={{ stroke: "rgba(128,128,128,0.2)" }}
                                                        tickFormatter={(val: number) =>
                                                            `₱${val.toLocaleString("en-PH", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                        }
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload, label }) => {
                                                            if (!active || !payload?.length) return null;
                                                            const amount = Number(payload[0]?.value || 0);
                                                            return (
                                                                <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
                                                                    <p className="font-bold text-foreground mb-1">{label}</p>
                                                                    <p className="text-blue-600 dark:text-blue-400 font-semibold flex justify-between gap-4">
                                                                        <span>Amount:</span>
                                                                        <span>{formatPeso(amount)}</span>
                                                                    </p>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="amount"
                                                        fill="#3b82f6"
                                                        radius={[4, 4, 0, 0]}
                                                        maxBarSize={48}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Right Chart: Outstanding by Salesman */}
                                <Card className="border border-border/60 bg-card rounded-xl p-3 sm:p-3.5 shadow-2xs overflow-hidden flex flex-col justify-between">
                                    <CardHeader className="p-0 pb-1">
                                        <CardTitle className="text-sm font-bold text-foreground tracking-tight">
                                            Outstanding by Salesman
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 min-w-0 w-full flex flex-col">
                                        <div className="h-[185px] w-full min-w-0">
                                            {mounted && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={salesmanData}
                                                        margin={{ top: 10, right: 8, left: 12, bottom: 35 }}
                                                        barCategoryGap="16%"
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke="rgba(128,128,128,0.12)"
                                                        />
                                                        <XAxis
                                                            dataKey="name"
                                                            fontSize={10}
                                                            angle={-30}
                                                            textAnchor="end"
                                                            interval={0}
                                                            tickLine={false}
                                                            axisLine={{ stroke: "rgba(128,128,128,0.2)" }}
                                                            tickFormatter={(v: string) =>
                                                                v.length > 13 ? `${v.slice(0, 13)}…` : v
                                                            }
                                                        />
                                                        <YAxis
                                                            fontSize={10}
                                                            width={110}
                                                            tickLine={false}
                                                            axisLine={{ stroke: "rgba(128,128,128,0.2)" }}
                                                            tickFormatter={(v: number) =>
                                                                `₱${v.toLocaleString("en-PH", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                            }
                                                        />
                                                        <Tooltip
                                                            content={({ active, payload, label }) => {
                                                                if (!active || !payload?.length) return null;
                                                                const ledgerVal = Number(payload[0]?.value || 0);
                                                                const unpostedVal = Number(payload[1]?.value || 0);
                                                                return (
                                                                    <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
                                                                        <p className="font-bold text-foreground mb-1">{label}</p>
                                                                        <div className="space-y-1">
                                                                            <p className="text-violet-600 dark:text-violet-400 font-semibold flex justify-between gap-4">
                                                                                <span>Outstanding (Ledger):</span>
                                                                                <span>{formatPeso(ledgerVal)}</span>
                                                                            </p>
                                                                            <p className="text-orange-500 dark:text-orange-400 font-semibold flex justify-between gap-4">
                                                                                <span>Unposted Collections:</span>
                                                                                <span>{formatPeso(unpostedVal)}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Outstanding (Ledger)"
                                                            fill="#8b5cf6"
                                                            radius={[3, 3, 0, 0]}
                                                            maxBarSize={22}
                                                        />
                                                        <Bar
                                                            dataKey="unposted"
                                                            name="Unposted Collections"
                                                            fill="#f97316"
                                                            radius={[3, 3, 0, 0]}
                                                            maxBarSize={22}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 pl-1 border-t border-border/40 pt-2 shrink-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#8b5cf6]" />
                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                    Outstanding (Ledger)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#f97316]" />
                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                    Unposted Collections
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AccountsReceivablePreviewCard;
