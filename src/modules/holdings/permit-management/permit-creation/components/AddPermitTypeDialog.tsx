"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FolderPlus, Loader2, Sparkles } from "lucide-react";
import { PermitTypeItem } from "../types/permit-creation.types";

interface AddPermitTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, isActive: boolean) => Promise<boolean>;
  isSubmitting: boolean;
  existingTypes: PermitTypeItem[];
}

export const AddPermitTypeDialog: React.FC<AddPermitTypeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  existingTypes,
}) => {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    if (!val.trim()) {
      setValidationError(null);
      return;
    }

    // Check duplicate locally
    const duplicate = existingTypes.some(
      (t) => (t.name || t.permit_type_name || "").trim().toLowerCase() === val.trim().toLowerCase()
    );

    if (duplicate) {
      setValidationError("A permit type with this name already exists.");
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Please enter a permit type name.");
    } else if (validationError) {
      return;
    } else {
      const ok = await onSubmit(trimmed, isActive);
      if (ok) {
        setName("");
        setIsActive(true);
        setValidationError(null);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-6 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.9)] rounded-2xl bg-card"
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:border-primary/40 flex items-center justify-center shrink-0 shadow-xs">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Add Permit Type
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Define a new compliance requirement column for all companies
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="permit-type-name" className="text-xs font-semibold text-foreground">
              Permit Type Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permit-type-name"
              type="text"
              placeholder="e.g. Environmental Compliance Certificate (ECC)"
              value={name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              className={`h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                validationError ? "border-destructive dark:border-destructive focus-visible:ring-destructive/20" : ""
              }`}
              autoFocus
            />
            {validationError ? (
              <p className="text-xs text-destructive font-medium">{validationError}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                <span>This will automatically add a new column across the matrix table.</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/90 shadow-xs">
            <div className="space-y-0.5">
              <Label htmlFor="active-status" className="text-xs font-semibold text-foreground cursor-pointer">
                Active Status
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Enable tracking immediately in the compliance dashboard
              </p>
            </div>
            <Switch
              id="active-status"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-medium border-slate-300 dark:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim() || !!validationError}
              className="h-9 px-4 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/25 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Permit Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
