"use client";

import React, { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building,
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
import { LostCustomerRecord, SortField, SortOrder } from "../types";

interface LostCustomerTableProps {
  data: LostCustomerRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectCustomer: (customer: LostCustomerRecord) => void;
  loading: boolean;
}

function formatPhp(amount: number): string {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}k`;
  }
  return `₱${amount.toLocaleString()}`;
}

function getTaggingBadge(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("lost")) {
    return (
      <Badge
        variant="outline"
        className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  if (t.includes("risk")) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  if (t.includes("dormant")) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border-border text-xs font-semibold px-2 py-0.5"
    >
      {tag}
    </Badge>
  );
}

export function LostCustomerTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  onSelectCustomer,
  loading,
}: LostCustomerTableProps) {
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const handleCopyCode = (code: string, id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-red-500 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-red-500 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
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
                  onClick={() => onSort("customerName")}
                >
                  Customer Name {renderSortIcon("customerName")}
                </TableHead>

                <TableHead
                  className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onSort("tagging")}
                >
                  Status {renderSortIcon("tagging")}
                </TableHead>

                <TableHead
                  className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onSort("minDaysNoSales")}
                >
                  Days Inactive {renderSortIcon("minDaysNoSales")}
                </TableHead>

                <TableHead
                  className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onSort("lastSalesDate")}
                >
                  Last Transaction {renderSortIcon("lastSalesDate")}
                </TableHead>

                <TableHead
                  className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onSort("totalHistoricalSales")}
                >
                  Past Sales {renderSortIcon("totalHistoricalSales")}
                </TableHead>

                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Salesman / Branch
                </TableHead>

                <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm font-semibold">No inactive customer records found</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        Try adjusting your filters or search terms.
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
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {rowNumber}
                    </TableCell>

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

                    <TableCell>
                      <div className="font-bold text-xs text-foreground truncate max-w-[200px]" title={item.customerName}>
                        {item.customerName}
                      </div>
                    </TableCell>

                    <TableCell>{getTaggingBadge(item.tagging)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            item.minDaysNoSales >= 180
                              ? "bg-red-500"
                              : item.minDaysNoSales >= 90
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span>{item.minDaysNoSales} days</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {item.lastSalesDate || "No record"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-xs text-foreground font-mono">
                        {formatPhp(item.totalHistoricalSales)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5 truncate max-w-[180px]">
                        <div className="font-medium text-foreground truncate">
                          {item.salesmanName || "Unassigned"}
                        </div>
                        {item.branchName && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                            <Building className="h-3 w-3 shrink-0" />
                            <span>{item.branchName}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

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
            <SelectTrigger className="h-8 w-20 text-xs rounded-xl border-border/70">
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
            className="h-8 px-2 text-xs rounded-xl border-border/70"
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
            className="h-8 px-2 text-xs rounded-xl border-border/70"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
