"use client";

import React from "react";
import { SubsidiaryInput } from "../types/subsidiary.schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Building2 } from "lucide-react";

interface SubsidiaryTableProps {
  data: SubsidiaryInput[];
  onEdit: (item: SubsidiaryInput) => void;
  onDelete: (id: number) => void;
}

export function SubsidiaryTable({ data, onEdit, onDelete }: SubsidiaryTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/50 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-200/60 dark:border-white/10">
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Company Code
            </TableHead>
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Subsidiary Name
            </TableHead>
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              TIN
            </TableHead>
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Email
            </TableHead>
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 text-right">
              Status
            </TableHead>
            <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 text-right">
              Controls
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-500">
                No subsidiaries registered yet.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow 
                key={item.company_id} 
                className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <TableCell className="px-6 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-500 tracking-wide lowercase">
                      {item.company_code}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-4 align-middle min-w-[300px]">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                      <Building2 className="size-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {item.company_name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                        {item.company_address || "No address provided for this subsidiary."}
                      </span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-4 align-middle">
                  <span className="text-xs font-semibold text-amber-600/80 bg-amber-500/10 px-2 py-1 rounded-md">
                    {item.company_tin || "N/A"}
                  </span>
                </TableCell>
                
                <TableCell className="px-6 py-4 align-middle text-xs font-medium text-slate-600 dark:text-slate-300">
                  {item.company_email || "N/A"}
                </TableCell>

                <TableCell className="px-6 py-4 align-middle text-right">
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-green-600">
                    <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    ACTIVE
                  </span>
                </TableCell>
                
                <TableCell className="px-6 py-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="size-4" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => {
                        if (item.company_id) {
                          onDelete(item.company_id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
