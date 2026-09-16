"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CustomerSummary,
  SupplierBreakdown,
  SalesmanBreakdown,
  CustomerTransactionRecord,
} from "../types";

interface CustomerDetailModalProps {
  customer: CustomerSummary | null;
  open: boolean;
  onClose: () => void;
  data: {
    suppliers: SupplierBreakdown[];
    salesmen: SalesmanBreakdown[];
    transactions: CustomerTransactionRecord[];
  };
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  open,
  onClose,
  data,
}) => {
  if (!customer) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {customer.customerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Code: <span className="font-mono text-foreground">{customer.customerCode}</span> &bull;{" "}
                Division: <span className="text-foreground">{customer.divisionName}</span> &bull;{" "}
                Store Type: <Badge variant="secondary" className="text-[10px] ml-1">{customer.storeType}</Badge>
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Total Invoiced
              </div>
              <div className="text-base font-bold text-primary">
                {formatCurrency(customer.totalSales)}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-border">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Transactions
            </span>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {customer.transactionCount.toLocaleString()}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Avg Order Value
            </span>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {formatCurrency(customer.averageOrderValue)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Top Supplier
            </span>
            <div className="text-xs font-bold text-foreground truncate mt-0.5" title={customer.topSupplier}>
              {customer.topSupplier}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Top Salesman
            </span>
            <div className="text-xs font-bold text-foreground truncate mt-0.5" title={customer.topSalesman}>
              {customer.topSalesman}
            </div>
          </div>
        </div>

        {/* Breakdown Tabs */}
        <Tabs defaultValue="suppliers" className="w-full pt-1">
          <TabsList className="grid grid-cols-3 w-full bg-muted/50 border border-border">
            <TabsTrigger value="suppliers" className="text-xs">
              Suppliers ({data.suppliers.length})
            </TabsTrigger>
            <TabsTrigger value="salesmen" className="text-xs">
              Salesmen ({data.salesmen.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs">
              Transactions ({data.transactions.length})
            </TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="mt-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Supplier
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Transactions
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Sales (PHP)
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Share (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm py-4 text-muted-foreground">
                        No supplier data found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.suppliers.map((s, idx) => (
                      <TableRow key={idx} className="border-border">
                        <TableCell className="font-medium text-xs text-foreground">
                          {s.supplierName}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {s.transactionCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-foreground">
                          {formatCurrency(s.totalSales)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-primary">
                          {s.percentage.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Salesmen Tab */}
          <TabsContent value="salesmen" className="mt-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Salesman
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Transactions
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Sales (PHP)
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Share (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.salesmen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm py-4 text-muted-foreground">
                        No salesman data found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.salesmen.map((s, idx) => (
                      <TableRow key={idx} className="border-border">
                        <TableCell className="font-medium text-xs text-foreground">
                          {s.salesmanName}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {s.transactionCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-foreground">
                          {formatCurrency(s.totalSales)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-primary">
                          {s.percentage.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-3">
            <div className="rounded-lg border border-border max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Division
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Supplier
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">
                      Salesman
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">
                      Amount (PHP)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm py-4 text-muted-foreground">
                        No transactions recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.transactions.slice(0, 100).map((t, idx) => (
                      <TableRow key={idx} className="border-border">
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {t.transactionDate}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {t.divisionName}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {t.supplierName}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {t.salesmanName}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-foreground">
                          {formatCurrency(t.netAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {data.transactions.length > 100 && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Showing latest 100 transactions of {data.transactions.length}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
