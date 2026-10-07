"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SlobAging } from "../types";
import { Badge } from "@/components/ui/badge";

const formatPHP = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
};

export const columns: ColumnDef<SlobAging>[] = [
  {
    accessorKey: "productId",
    header: "SKU",
    cell: ({ row }) => <span className="font-medium">{row.original.productId}</span>,
  },
  {
    accessorKey: "productName",
    header: "Item Name",
    cell: ({ row }) => (
      <span
        className="font-medium truncate max-w-[200px] block"
        title={row.original.productName}
      >
        {row.original.productName}
      </span>
    ),
  },
  {
    accessorKey: "supplierShortcut",
    header: "Supplier",
    cell: ({ row }) => <span>{row.original.supplierShortcut || "N/A"}</span>,
  },
  {
    accessorKey: "branchName",
    header: "Branch",
  },
  {
    accessorKey: "currentStock",
    header: "Stock Qty",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {(row.original.currentStock || 0).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "costPerUnit",
    header: "Unit Cost",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatPHP(row.original.costPerUnit || 0)}</span>
    ),
  },
  {
    accessorKey: "stockValue",
    header: "Total Value",
    cell: ({ row }) => (
      <span className="tabular-nums font-semibold">
        {formatPHP(row.original.stockValue || 0)}
      </span>
    ),
  },
  {
    accessorKey: "lastOutboundDate",
    header: "Last Sale Date",
    cell: ({ row }) => {
      const date = row.original.lastOutboundDate;
      return <span>{date ? date.split(" ")[0] : "Never"}</span>;
    },
  },
  {
    id: "daysIdle",
    header: "Days Idle",
    cell: ({ row }) => {
      const isSlob = row.original.isSlob === 1;
      return (
        <Badge
          variant={isSlob ? "destructive" : "secondary"}
          className="text-[10px] py-0 px-2 h-5"
        >
          {isSlob ? ">60 days" : "Healthy"}
        </Badge>
      );
    },
  },
];
