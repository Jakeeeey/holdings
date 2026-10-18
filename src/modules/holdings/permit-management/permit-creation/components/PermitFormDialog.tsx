"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Pencil,
  FilePlus,
  Building2,
  FileText,
  Calendar,
  ShieldCheck,
  Hash,
  Landmark,
} from "lucide-react";
import { PermitFileUpload } from "./PermitFileUpload";
import { toast } from "sonner";
import {
  PermitCompany,
  PermitTypeItem,
  PermitFormData,
  PermitRecord,
} from "../types/permit-creation.types";

interface PermitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PermitFormData) => Promise<boolean>;
  isSubmitting: boolean;
  companies: PermitCompany[];
  permitTypes: PermitTypeItem[];
  initialCompany?: PermitCompany | null;
  initialPermitType?: PermitTypeItem | null;
  editRecord?: PermitRecord | null;
  isRenewalMode?: boolean;
}

export const PermitFormDialog: React.FC<PermitFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  companies,
  permitTypes,
  initialCompany,
  initialPermitType,
  editRecord,
  isRenewalMode = false,
}) => {
  const [formData, setFormData] = useState<PermitFormData>({
    company_id: 0,
    permit_type_id: "",
    permit_number: "",
    issue_date: "",
    expiry_date: "",
    file_url: "",
    issuing_agency: "",
    status: "Active",
    notes: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [prevFormKey, setPrevFormKey] = useState("");
  const currentFormKey = `${isOpen ? "open" : "closed"}_${isRenewalMode ? "renew" : "edit"}_${editRecord?.id || "new"}`;

  if (currentFormKey !== prevFormKey) {
    setPrevFormKey(currentFormKey);
    if (isOpen) {
      setSelectedFile(null);
      setFormErrors({});
      if (isRenewalMode && editRecord) {
        const rec = editRecord;
        setFormData({
          company_id: rec.company_id || (companies[0]?.company_id || 0),
          permit_type_id: String(rec.permit_type_id),
          permit_number: rec.permit_number || "",
          issue_date: "",
          expiry_date: "",
          file_url: "",
          issuing_agency: rec.issuing_agency || "",
          status: "Active",
          notes: `Renewed from permit #${rec.permit_number}`,
        });
      } else if (editRecord) {
        const rec = editRecord;
        const initialIssue = (rec.issue_date || rec.issued_date || "").substring(0, 10);
        const initialExpiry = (rec.expiry_date || rec.expiration_date || "").substring(0, 10);

        setFormData({
          id: rec.id,
          company_id: rec.company_id || (companies[0]?.company_id || 0),
          permit_type_id: String(rec.permit_type_id),
          permit_number: rec.permit_number || "",
          issue_date: initialIssue,
          expiry_date: initialExpiry,
          file_url: rec.file_url || "",
          issuing_agency: rec.issuing_agency || "",
          status: rec.status || "Active",
          notes: rec.notes || rec.remarks || "",
        });
      } else {
        setFormData({
          company_id: initialCompany ? initialCompany.company_id : (companies[0]?.company_id || 0),
          permit_type_id: initialPermitType ? String(initialPermitType.id) : (permitTypes[0] ? String(permitTypes[0].id) : ""),
          permit_number: "",
          issue_date: "",
          expiry_date: "",
          file_url: "",
          issuing_agency: "",
          status: "Active",
          notes: "",
        });
      }
    }
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.company_id) {
      errors.company_id = "Please select a company.";
    }
    if (!formData.permit_type_id) {
      errors.permit_type_id = "Please select a permit type.";
    }
    if (!formData.permit_number.trim()) {
      errors.permit_number = "Permit number is required.";
    }
    if (!formData.issue_date) {
      errors.issue_date = "Date issued is required.";
    }
    if (!formData.expiry_date) {
      errors.expiry_date = "Expiration date is required.";
    }
    if (formData.issue_date && formData.expiry_date) {
      const issueTime = new Date(formData.issue_date).getTime();
      const expiryTime = new Date(formData.expiry_date).getTime();
      if (!isNaN(issueTime) && !isNaN(expiryTime) && expiryTime < issueTime) {
        errors.expiry_date = "Expiration date must be on or after date issued.";
      }
    }
    if (!selectedFile && !formData.file_url.trim()) {
      errors.file_url = "Please upload a permit document (PDF or Image).";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const res = await fetch("/api/holdings/upload", {
      method: "POST",
      body: uploadData,
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || "Failed to upload file to storage.");
    }

    const fileId = result.data?.id;
    return fileId ? `/assets/${fileId}` : "/uploads/permits/default_permit.pdf";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let finalFileUrl = formData.file_url;

    if (selectedFile) {
      setIsUploading(true);
      try {
        finalFileUrl = await uploadFile(selectedFile);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error uploading file";
        toast.error(`Upload error: ${msg}`);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      ...formData,
      file_url: finalFileUrl || "/uploads/permits/default_permit.pdf",
    };

    const success = await onSubmit(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isUploading) return;
        onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl max-h-[92vh] p-0 flex flex-col gap-0 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.9)] rounded-2xl bg-card overflow-hidden"
        onInteractOutside={(e) => {
          if (isUploading) {
            e.preventDefault();
          }
        }}
      >
        {/* Pinned Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                  isRenewalMode
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/50"
                    : editRecord
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/50"
                    : "bg-primary/10 text-primary border-primary/25 dark:bg-primary/20 dark:border-primary/40"
                }`}
              >
                {isRenewalMode ? (
                  <RefreshCw className="h-5 w-5" />
                ) : editRecord ? (
                  <Pencil className="h-5 w-5" />
                ) : (
                  <FilePlus className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {isRenewalMode
                    ? "Renew Permit Document"
                    : editRecord
                    ? "Update Permit Details"
                    : "Register New Permit"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                  {isRenewalMode
                    ? "Specify the renewal validity dates and attach the newly approved certificate."
                    : "Fill in the required permit registration details and attach the official certificate."}
                </DialogDescription>
              </div>
            </div>

            {/* Mode Indicator Badge */}
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 border-slate-200 dark:border-slate-600 bg-background/80"
            >
              {isRenewalMode ? "Renewal Mode" : editRecord ? "Edit Record" : "New Registration"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form id="permit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section 1: Entity & Compliance Classification */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/90 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground tracking-wide uppercase text-[11px] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Entity & Permit Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Company Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="company_id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Company <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formData.company_id || "")}
                  onValueChange={(val) => setFormData({ ...formData, company_id: Number(val) })}
                  disabled={Boolean(editRecord || initialCompany)}
                >
                  <SelectTrigger
                    id="company_id"
                    className="h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <SelectValue placeholder="Select target company" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-700 max-h-56">
                    {companies.map((c) => (
                      <SelectItem key={c.company_id} value={String(c.company_id)}>
                        {c.company_name} {c.company_code ? `(${c.company_code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.company_id && (
                  <p className="text-destructive text-xs font-medium">{formErrors.company_id}</p>
                )}
              </div>

              {/* Permit Type Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="permit_type_id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Permit Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formData.permit_type_id || "")}
                  onValueChange={(val) => setFormData({ ...formData, permit_type_id: val })}
                  disabled={Boolean(editRecord || initialPermitType)}
                >
                  <SelectTrigger
                    id="permit_type_id"
                    className="h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <SelectValue placeholder="Select permit category" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-700 max-h-56">
                    {permitTypes.map((t) => (
                      <SelectItem key={String(t.id)} value={String(t.id)}>
                        {t.name || t.permit_type_name || `Type ${t.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.permit_type_id && (
                  <p className="text-destructive text-xs font-medium">{formErrors.permit_type_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Authority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Permit Number */}
            <div className="space-y-1.5">
              <Label htmlFor="permit_number" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Permit Number</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="permit_number"
                placeholder="e.g. BP-2026-00421"
                value={formData.permit_number}
                onChange={(e) => setFormData({ ...formData, permit_number: e.target.value })}
                className="h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-all"
              />
              {formErrors.permit_number && (
                <p className="text-destructive text-xs font-medium">{formErrors.permit_number}</p>
              )}
            </div>

            {/* Issuing Agency */}
            <div className="space-y-1.5">
              <Label htmlFor="issuing_agency" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Issuing Agency / Authority</span>
              </Label>
              <Input
                id="issuing_agency"
                placeholder="e.g. City Hall, BIR, BFP, SEC"
                value={formData.issuing_agency}
                onChange={(e) => setFormData({ ...formData, issuing_agency: e.target.value })}
                className="h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Section 3: Validity Period Grid */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/90 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide text-[11px] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span>Validity & Expiration Period</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="issue_date" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Date Issued <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => {
                      const newIssueDate = e.target.value;
                      // Auto-reset expiry_date if it becomes earlier than the new Date Issued
                      const shouldResetExpiry =
                        Boolean(formData.expiry_date) &&
                        Boolean(newIssueDate) &&
                        new Date(formData.expiry_date).getTime() < new Date(newIssueDate).getTime();

                      setFormData({
                        ...formData,
                        issue_date: newIssueDate,
                        expiry_date: shouldResetExpiry ? "" : formData.expiry_date,
                      });

                      if (formErrors.issue_date) {
                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.issue_date;
                          return updated;
                        });
                      }
                    }}
                    className="h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                </div>
                {formErrors.issue_date && (
                  <p className="text-destructive text-xs font-medium">{formErrors.issue_date}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiry_date" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Expiration Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    disabled={!formData.issue_date}
                    min={formData.issue_date || undefined}
                    onChange={(e) => {
                      setFormData({ ...formData, expiry_date: e.target.value });
                      if (formErrors.expiry_date) {
                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.expiry_date;
                          return updated;
                        });
                      }
                    }}
                    className={`h-9 text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                      !formData.issue_date
                        ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                        : "cursor-pointer"
                    }`}
                  />
                </div>
                {!formData.issue_date && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Please select Date Issued first.
                  </p>
                )}
                {formErrors.expiry_date && (
                  <p className="text-destructive text-xs font-medium">{formErrors.expiry_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: File Document Attachment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Permit Certificate Attachment</span>
                <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">PDF, PNG, JPG, WEBP (Max 10MB)</span>
            </div>

            <PermitFileUpload
              value={formData.file_url}
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (file) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.file_url;
                    return next;
                  });
                }
              }}
              error={formErrors.file_url}
            />
          </div>

          {/* Section 5: Remarks / Processing Notes */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Remarks / Processing Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Important compliance notes, assessment findings, or renewal references..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="text-xs rounded-lg border-slate-300 dark:border-slate-600 bg-background hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
        </form>

        {/* Pinned Dialog Footer — Always fully visible */}
        <DialogFooter className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 flex flex-row items-center justify-between sm:justify-between w-full gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mr-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">All compliance submissions are logged in audit history.</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="h-9 px-4 text-xs font-medium border-slate-300 dark:border-slate-600 text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="permit-form"
              size="sm"
              disabled={isSubmitting || isUploading}
              className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isUploading
                ? "Uploading Document..."
                : isSubmitting
                ? "Submitting..."
                : isRenewalMode
                ? "Complete Renewal"
                : editRecord
                ? "Save Changes"
                : "Register Permit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
