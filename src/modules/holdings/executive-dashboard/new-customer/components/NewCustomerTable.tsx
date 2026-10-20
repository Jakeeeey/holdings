"use client";

import React, { useState } from "react";
import {
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    MapPin,
    Copy,
    Check,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NewCustomerItem } from "../types";

interface NewCustomerTableProps {
    data: NewCustomerItem[];
    totalCount: number;
    sortField: keyof NewCustomerItem;
    sortOrder: "asc" | "desc";
    onSort: (field: keyof NewCustomerItem) => void;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSelectCustomer: (customer: NewCustomerItem) => void;
    loading: boolean;
}

export const NewCustomerTable: React.FC<NewCustomerTableProps> = ({
    data,
    totalCount,
    sortField,
    sortOrder,
    onSort,
    currentPage,
    pageSize,
    totalPages,
    onPageChange,
    onPageSizeChange,
    onSelectCustomer,
    loading,
}) => {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopyCode = (code: string, id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!code || code === "-") return;
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const renderSortIcon = (field: keyof NewCustomerItem) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary ml-1 inline" />
        ) : (
            <ChevronDown className="h-3.5 w-3.5 text-primary ml-1 inline" />
        );
    };

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border/60 hover:bg-transparent">
                                <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider">
                                    #
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("customerCode")}
                                >
                                    Code {renderSortIcon("customerCode")}
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("storeName")}
                                >
                                    Store &amp; Customer {renderSortIcon("storeName")}
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("storeType")}
                                >
                                    Classification {renderSortIcon("storeType")}
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("province")}
                                >
                                    Location {renderSortIcon("province")}
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("salesmanName")}
                                >
                                    Onboarded By {renderSortIcon("salesmanName")}
                                </TableHead>

                                <TableHead
                                    className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => onSort("rawDate")}
                                >
                                    Registered {renderSortIcon("rawDate")}
                                </TableHead>

                                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">
                                    Status
                                </TableHead>

                                <TableHead className="w-20 text-center text-xs font-bold uppercase tracking-wider">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {data.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-44 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <p className="text-sm font-semibold">No new customer records found</p>
                                            <p className="text-xs text-muted-foreground/80 mt-1">
                                                Adjust your filters or date range to inspect account onboarding.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {data.map((item, idx) => {
                                const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                                return (
                                    <TableRow
                                        key={item.id}
                                        onClick={() => onSelectCustomer(item)}
                                        className="cursor-pointer hover:bg-muted/40 transition-colors border-border/40"
                                    >
                                        {/* Row # */}
                                        <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                            {rowNumber}
                                        </TableCell>

                                        {/* Customer Code */}
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                                                <span>{item.customerCode}</span>
                                                <button
                                                    onClick={(e) => handleCopyCode(item.customerCode, item.id, e)}
                                                    className="p-1 rounded text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                                                    title="Copy customer code"
                                                >
                                                    {copiedId === item.id ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </TableCell>

                                        {/* Store & Customer Name */}
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-xs text-foreground truncate max-w-[200px]" title={item.storeName}>
                                                    {item.storeName}
                                                </div>
                                                {item.storeName !== item.customerName && (
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={item.customerName}>
                                                        {item.customerName}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Store Classification */}
                                        <TableCell>
                                            <Badge variant="outline" className="text-[11px] font-medium border-border/70">
                                                {item.storeType}
                                            </Badge>
                                        </TableCell>

                                        {/* Location */}
                                        <TableCell>
                                            <div className="text-xs space-y-0.5 truncate max-w-[200px]">
                                                <div className="font-semibold text-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                                                    <span className="truncate">{item.province || "Other"}</span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate">
                                                    {[item.city, item.brgy].filter(Boolean).join(", ") || "-"}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Assigned Salesman */}
                                        <TableCell>
                                            <span className="text-xs font-medium text-foreground">
                                                {item.salesmanName}
                                            </span>
                                        </TableCell>

                                        {/* Date Entered */}
                                        <TableCell>
                                            <div className="text-xs space-y-0.5">
                                                <div className="font-semibold text-foreground">
                                                    {item.dateEntered || "-"}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {item.recencyLabel}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Active Status */}
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={item.isActive ? "default" : "secondary"}
                                                className={`text-[10px] font-bold px-2 py-0.5 ${
                                                    item.isActive
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0"
                                                        : "bg-muted text-muted-foreground border-0"
                                                }`}
                                            >
                                                {item.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectCustomer(item);
                                                }}
                                                className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                                                title="View details"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => onPageSizeChange(Number(val))}
                    >
                        <SelectTrigger className="h-8 w-20 text-xs rounded-md border-border/70">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="h-8 px-2 text-xs rounded-md border-border/70"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Prev
                    </Button>

                    <span className="font-semibold text-foreground px-2">
                        {currentPage} / {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="h-8 px-2 text-xs rounded-md border-border/70"
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
