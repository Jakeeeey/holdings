// src/modules/holdings/executive-dashboard/accounts-receivable/components/ARFilterBar.tsx

"use client";

import React from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ARFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  status?: string;
  setStatus?: (v: string) => void;
  arStatus?: string;
  setArStatus?: (v: string) => void;
  transactionStatus?: string;
  setTransactionStatus?: (v: string) => void;
  transactionStatusOptions?: string[];
  salesman: string;
  setSalesman: (v: string) => void;
  salesmanOptions: string[];
  isFiltered: boolean;
  clearFilters: () => void;
  setPage: (p: number) => void;
}

export function ARFilterBar({
  search,
  setSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  status,
  setStatus,
  arStatus,
  setArStatus,
  transactionStatus,
  setTransactionStatus,
  transactionStatusOptions = [],
  salesman,
  setSalesman,
  salesmanOptions,
  isFiltered,
  clearFilters,
  setPage,
}: ARFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-border bg-card/60">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search invoice no, customer, order ID..."
          className="h-8 pl-8 text-xs bg-background"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-7 text-[11px] w-[130px] bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground">to</span>
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-7 text-[11px] w-[130px] bg-background"
          />
        </div>
      </div>

      {/* Salesman Select */}
      {salesmanOptions.length > 0 && (
        <div className="w-[160px] shrink-0">
          <Select
            value={salesman || 'all'}
            onValueChange={(val) => {
              setSalesman(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="All Salesmen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Salesmen</SelectItem>
              {salesmanOptions.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Legacy Status Select */}
      {setStatus && !setArStatus && (
        <div className="w-[120px] shrink-0">
          <Select
            value={status || 'all'}
            onValueChange={(val) => {
              setStatus(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Due">Due</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* AR Status Select */}
      {setArStatus && (
        <div className="w-[130px] shrink-0">
          <Select
            value={arStatus || 'all'}
            onValueChange={(val) => {
              setArStatus(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="All AR Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AR Statuses</SelectItem>
              <SelectItem value="Due">Due</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Transaction Status Select */}
      {setTransactionStatus && transactionStatusOptions.length > 0 && (
        <div className="w-[150px] shrink-0">
          <Select
            value={transactionStatus || 'all'}
            onValueChange={(val) => {
              setTransactionStatus(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="All Tx Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tx Statuses</SelectItem>
              {transactionStatusOptions.map((tx) => (
                <SelectItem key={tx} value={tx} className="text-xs">
                  {tx}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset Button */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
