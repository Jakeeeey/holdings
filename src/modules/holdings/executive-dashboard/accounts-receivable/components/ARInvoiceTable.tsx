// src/modules/holdings/executive-dashboard/accounts-receivable/components/ARInvoiceTable.tsx

"use client";

import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatPeso, getPageNumbers } from '../utils';
import type { Invoice } from '../types';

const PAGE_SIZE = 10;

function StatusPill({ status }: { status: 'Paid' | 'Overdue' | 'Due' }) {
  if (status === 'Paid') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Paid
      </span>
    );
  }
  if (status === 'Overdue') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      Due
    </span>
  );
}

interface ARInvoiceTableProps {
  invoices: Invoice[];
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export function ARInvoiceTable({ invoices, page, setPage }: ARInvoiceTableProps) {
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const paged = invoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <Card className="border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider">
          Accounts Receivable Invoices
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''} — page {safePage} of {totalPages || 1}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="py-2 pl-4 w-[12%] text-xs font-bold">Invoice No.</TableHead>
              <TableHead className="py-2 w-[18%] text-xs font-bold">Customer</TableHead>
              <TableHead className="py-2 w-[12%] text-xs font-bold">Salesman</TableHead>
              <TableHead className="py-2 w-[10%] text-xs font-bold">Invoice Date</TableHead>
              <TableHead className="py-2 w-[10%] text-xs font-bold">Due Date</TableHead>
              <TableHead className="py-2 w-[12%] text-xs font-bold text-right">Net Receivable</TableHead>
              <TableHead className="py-2 w-[10%] text-xs font-bold text-right">Paid</TableHead>
              <TableHead className="py-2 w-[12%] text-xs font-bold text-right">Outstanding</TableHead>
              <TableHead className="py-2 w-[8%] text-xs font-bold text-center">Overdue</TableHead>
              <TableHead className="py-2 pr-4 w-[8%] text-xs font-bold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                  No accounts receivable records found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/20 border-border/40">
                  <TableCell className="py-2 pl-4 font-mono font-bold text-[11px] text-primary truncate">
                    {inv.invoiceNo}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] font-medium truncate" title={inv.customer}>
                    {inv.customer}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] text-muted-foreground truncate" title={inv.salesman}>
                    {inv.salesman}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{inv.invoiceDate ? inv.invoiceDate.split(' ')[0] : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{inv.due ? inv.due.split(' ')[0] : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-[11px] font-mono text-right truncate">
                    {formatPeso(inv.netReceivable)}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] font-mono text-right text-emerald-600 dark:text-emerald-400 truncate">
                    {formatPeso(inv.totalPaid)}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] font-mono font-bold text-right text-amber-600 dark:text-amber-400 truncate">
                    {formatPeso(inv.outstanding)}
                  </TableCell>
                  <TableCell className="py-2 text-[11px] text-center font-mono">
                    {inv.overdue !== null && inv.overdue > 0 ? (
                      <span className="text-rose-600 font-bold">{inv.overdue}d</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 pr-4 text-center">
                    <StatusPill status={inv.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="py-3 border-t border-border/50">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={safePage === 1}
                    className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {pageNumbers.map((num, idx) =>
                  num === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={num}>
                      <PaginationLink
                        href="#"
                        isActive={safePage === num}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(num);
                        }}
                      >
                        {num}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={safePage === totalPages}
                    className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
