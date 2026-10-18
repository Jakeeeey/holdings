"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  SlidersHorizontal,
  Search,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PermitTypeItem, PermitRecord } from "../types/permit-creation.types";

interface ManagePermitTypesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permitTypes: PermitTypeItem[];
  permits: PermitRecord[];
  onCreateType: (name: string, isActive: boolean) => Promise<boolean>;
  onUpdateType: (
    id: number | string,
    data: { name?: string; is_active?: boolean | number }
  ) => Promise<boolean>;
  isSubmitting: boolean;
}

export const ManagePermitTypesDialog: React.FC<ManagePermitTypesDialogProps> = ({
  isOpen,
  onClose,
  permitTypes,
  permits,
  onCreateType,
  onUpdateType,
  isSubmitting,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIsActive, setNewTypeIsActive] = useState(true);
  const [newTypeValidationError, setNewTypeValidationError] = useState<string | null>(null);

  // Inline editing state: { id: string | number, name: string }
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  // Deactivation confirmation modal state
  const [typeToDeactivate, setTypeToDeactivate] = useState<PermitTypeItem | null>(null);

  // Pre-calculate how many permits are registered per permit type
  const typeUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of permits) {
      if (p.permit_type_id) {
        const idStr = String(p.permit_type_id);
        map.set(idStr, (map.get(idStr) || 0) + 1);
      }
    }
    return map;
  }, [permits]);

  // Filtered permit types based on search
  const filteredTypes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return permitTypes;
    return permitTypes.filter((t) => {
      const name = (t.name || t.permit_type_name || "").toLowerCase();
      const code = (t.code || "").toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [permitTypes, searchTerm]);

  // Handle adding new permit type
  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      setNewTypeValidationError("Permit type name is required.");
      return;
    }

    const duplicate = permitTypes.some(
      (t) => (t.name || t.permit_type_name || "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setNewTypeValidationError("A permit type with this name already exists.");
      return;
    }

    const ok = await onCreateType(trimmed, newTypeIsActive);
    if (ok) {
      setNewTypeName("");
      setNewTypeIsActive(true);
      setNewTypeValidationError(null);
      setIsAddingNew(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (item: PermitTypeItem) => {
    setEditingId(item.id);
    setEditingName(item.name || item.permit_type_name || "");
    setEditValidationError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditValidationError(null);
  };

  // Save inline editing
  const handleSaveEdit = async (item: PermitTypeItem) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditValidationError("Name cannot be empty.");
      return;
    }

    const currentName = item.name || item.permit_type_name || "";
    if (trimmed.toLowerCase() !== currentName.toLowerCase()) {
      const duplicate = permitTypes.some(
        (t) =>
          String(t.id) !== String(item.id) &&
          (t.name || t.permit_type_name || "").trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        setEditValidationError("A permit type with this name already exists.");
        return;
      }
    }

    const ok = await onUpdateType(item.id, { name: trimmed });
    if (ok) {
      setEditingId(null);
      setEditingName("");
      setEditValidationError(null);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (item: PermitTypeItem, checked: boolean) => {
    // If turning off (deactivating), require confirmation dialog
    if (!checked) {
      setTypeToDeactivate(item);
      return;
    }
    // If activating, proceed directly
    await onUpdateType(item.id, { is_active: 1 });
  };

  const handleConfirmDeactivate = async () => {
    if (!typeToDeactivate) return;
    const ok = await onUpdateType(typeToDeactivate.id, { is_active: 0 });
    if (ok) {
      setTypeToDeactivate(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-4xl w-[96vw] p-0 overflow-hidden flex flex-col gap-0 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[0_0_60px_-15px_rgba(0,0,0,0.95)] rounded-2xl bg-card max-h-[88vh]"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:border-primary/40 flex items-center justify-center shrink-0 shadow-xs">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Manage Permit Types
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configure compliance requirement columns, names, and active status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Action / Search Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700/80 bg-background/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search permit type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground font-medium shrink-0">
              Total Types: <span className="font-semibold text-foreground">{permitTypes.length}</span>
            </div>

            {!isAddingNew && (
              <Button
                size="sm"
                onClick={() => {
                  setIsAddingNew(true);
                  setNewTypeValidationError(null);
                }}
                className="h-8 px-3.5 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Add Permit Type</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* New Permit Type Inline Form */}
          {isAddingNew && (
            <form
              onSubmit={handleAddNewSubmit}
              className="p-4 rounded-xl border border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                  New Permit Type
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-name" className="text-xs font-semibold text-foreground">
                  Permit Type Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-name"
                  type="text"
                  placeholder="e.g. Environmental Compliance Certificate (ECC)"
                  value={newTypeName}
                  onChange={(e) => {
                    setNewTypeName(e.target.value);
                    if (newTypeValidationError) setNewTypeValidationError(null);
                  }}
                  autoFocus
                  className="h-8 text-xs border-slate-300 dark:border-slate-600"
                />
                {newTypeValidationError && (
                  <p className="text-[11px] text-destructive font-medium">
                    {newTypeValidationError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-active"
                    checked={newTypeIsActive}
                    onCheckedChange={setNewTypeIsActive}
                  />
                  <Label htmlFor="new-active" className="text-xs text-foreground cursor-pointer">
                    Active (visible in matrix)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingNew(false)}
                    disabled={isSubmitting}
                    className="h-7 text-xs border-slate-300 dark:border-slate-600 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="h-7 text-xs font-semibold cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      "Save Permit Type"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* List / Table of Permit Types */}
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden bg-card shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-muted-foreground font-semibold">
                  <th className="px-5 py-3.5">Permit Type Name</th>
                  <th className="px-4 py-3.5 text-center w-32">Compliance Usage</th>
                  <th className="px-4 py-3.5 text-center w-48">Status & Visibility</th>
                  <th className="px-5 py-3.5 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTypes.map((type) => {
                  const typeName = type.name || type.permit_type_name || `Type ${type.id}`;
                  const isEditingThis = editingId === type.id;
                  const isActive =
                    type.is_active === 1 || type.is_active === true || type.is_active === undefined;
                  const usageCount = typeUsageMap.get(String(type.id)) || 0;

                  return (
                    <tr
                      key={String(type.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Name / Inline Edit */}
                      <td className="px-5 py-3.5 align-middle">
                        {isEditingThis ? (
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                autoFocus
                                className="h-8 text-xs border-primary dark:border-primary font-medium"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(type)}
                                disabled={isSubmitting}
                                className="h-8 w-8 p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground border-slate-300 dark:border-slate-600 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {editValidationError && (
                              <p className="text-[11px] text-destructive font-medium">
                                {editValidationError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-foreground text-sm leading-normal">
                              {typeName}
                            </span>
                            {type.code && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono py-0 px-1.5 border-slate-300 dark:border-slate-600 text-muted-foreground"
                              >
                                {type.code}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-0.5 px-2.5"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {usageCount} {usageCount === 1 ? "Permit" : "Permits"}
                        </Badge>
                      </td>

                      {/* Unified Status & Visibility Column */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <div
                          className={`inline-flex items-center gap-2.5 px-2.5 py-1 rounded-full border transition-colors ${
                            usageCount > 0
                              ? "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90 cursor-not-allowed"
                              : "bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80"
                          }`}
                          title={
                            usageCount > 0
                              ? "Cannot deactivate while permits are registered"
                              : undefined
                          }
                        >
                          <Switch
                            checked={isActive}
                            disabled={isSubmitting || usageCount > 0}
                            onCheckedChange={(checked) => handleToggleActive(type, checked)}
                            className="scale-85 data-[state=checked]:bg-emerald-600 disabled:opacity-50"
                          />
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 align-middle text-right">
                        {!isEditingThis && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(type)}
                            disabled={isSubmitting}
                            className="h-7 px-2.5 text-xs gap-1.5 font-medium border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit permit type name"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTypes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                      No permit types found matching &ldquo;{searchTerm}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium border border-slate-200 dark:border-slate-700 text-foreground dark:text-slate-200 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Confirmation Dialog before Deactivating Permit Type */}
      <AlertDialog
        open={Boolean(typeToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setTypeToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Deactivate Permit Type?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to deactivate{" "}
              <strong className="text-foreground">
                {typeToDeactivate?.name || typeToDeactivate?.permit_type_name}
              </strong>
              ? It will be hidden from the compliance matrix table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="h-8 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleConfirmDeactivate}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
