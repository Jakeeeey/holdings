"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubsidiarySchema, SubsidiaryInput } from "../types/subsidiary.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Image as ImageIcon, Loader2, Building, Globe, MapPin, Server, X } from "lucide-react";

interface SubsidiaryFormProps {
  initialData?: SubsidiaryInput;
  onSubmit: (data: SubsidiaryInput) => Promise<void>;
  onCancel: () => void;
}

export function SubsidiaryForm({ initialData, onSubmit, onCancel }: SubsidiaryFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubsidiaryInput>({
    resolver: zodResolver(SubsidiarySchema),
    defaultValues: initialData || {
      status: "active",
      is_mother_company: 0,
      is_default: 0,
    },
  });

  const currentLogo = watch("company_logo");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        is_mother_company: initialData.is_mother_company ? 1 : 0,
        is_default: initialData.is_default ? 1 : 0,
      });
    }
  }, [initialData, reset]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/holdings/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Failed to upload file to Directus");
      }

      // Store the uploaded Directus file ID
      const fileId = resData.data.id;
      setValue("company_logo", fileId, { shouldDirty: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading file";
      setUploadError(msg);
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setValue("company_logo", "", { shouldDirty: true });
  };

  const getLogoPreviewUrl = (logoId?: string | null) => {
    if (!logoId) return null;
    if (logoId.startsWith("http://") || logoId.startsWith("https://") || logoId.startsWith("/")) {
      return logoId;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}/assets/${logoId}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800/60 p-1">
          <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs font-semibold">
            <Building className="size-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-1.5 text-xs font-semibold">
            <MapPin className="size-3.5" /> Location & Legal
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1.5 text-xs font-semibold">
            <Globe className="size-3.5" /> Contact & Social
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1.5 text-xs font-semibold">
            <Server className="size-3.5" /> Integrations
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: GENERAL & IDENTITY --- */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" placeholder="e.g. Vertex Systems Inc." {...register("company_name")} />
              {errors.company_name && <span className="text-red-500 text-xs">{errors.company_name.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_code">Company Code *</Label>
              <Input id="company_code" placeholder="e.g. VOS-CORP" {...register("company_code")} />
              {errors.company_code && <span className="text-red-500 text-xs">{errors.company_code.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_type_id">Company Type ID</Label>
              <Input id="company_type_id" type="number" placeholder="e.g. 1" {...register("company_type_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" placeholder="active, inactive, pending" {...register("status")} />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2 border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Logo (Directus)</Label>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl border border-dashed flex items-center justify-center bg-white dark:bg-slate-950 overflow-hidden relative shadow-sm">
                {currentLogo ? (
                  <img
                    src={getLogoPreviewUrl(currentLogo) || ""}
                    alt="Logo Preview"
                    className="size-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon className="size-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="subsidiary-logo-upload"
                  disabled={isUploadingLogo}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-1.5 size-3.5" /> Upload to Directus
                      </>
                    )}
                  </Button>
                  {currentLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleRemoveLogo}
                    >
                      <X className="mr-1 size-3.5" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentLogo ? `File ID: ${currentLogo}` : "Upload PNG, JPG, or SVG image file."}
                </p>
                {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Mother Company & Default Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label htmlFor="is_mother_company" className="text-sm font-semibold cursor-pointer">Mother Company</Label>
                <p className="text-xs text-slate-500">Designate as parent organization</p>
              </div>
              <Controller
                name="is_mother_company"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_mother_company"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label htmlFor="is_default" className="text-sm font-semibold cursor-pointer">Default Subsidiary</Label>
                <p className="text-xs text-slate-500">Default company for users without selection</p>
              </div>
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_default"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                  />
                )}
              />
            </div>
          </div>
        </TabsContent>

        {/* --- TAB 2: LOCATION & LEGAL --- */}
        <TabsContent value="location" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_address">Street Address</Label>
              <Input id="company_address" placeholder="e.g. Unit 123 Building Name, Main St." {...register("company_address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_brgy">Barangay</Label>
              <Input id="company_brgy" placeholder="Barangay" {...register("company_brgy")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_city">City</Label>
              <Input id="company_city" placeholder="City" {...register("company_city")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_province">Province</Label>
              <Input id="company_province" placeholder="Province" {...register("company_province")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_zipCode">Zip Code</Label>
              <Input id="company_zipCode" placeholder="Zip Code" {...register("company_zipCode")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_tin">TIN</Label>
              <Input id="company_tin" placeholder="Tax Identification Number" {...register("company_tin")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_registrationNumber">Registration Number</Label>
              <Input id="company_registrationNumber" placeholder="SEC/DTI Reg. Number" {...register("company_registrationNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_dateAdmitted">Date Admitted</Label>
              <Input id="company_dateAdmitted" type="date" {...register("company_dateAdmitted")} />
            </div>
          </div>
        </TabsContent>

        {/* --- TAB 3: CONTACT & SOCIAL --- */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_contact">Contact Phone</Label>
              <Input id="company_contact" placeholder="+63 9xx xxx xxxx" {...register("company_contact")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Official Email</Label>
              <Input id="company_email" type="email" placeholder="contact@example.com" {...register("company_email")} />
              {errors.company_email && <span className="text-red-500 text-xs">{errors.company_email.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_outlook">Outlook Email</Label>
              <Input id="company_outlook" type="email" placeholder="outlook@company.com" {...register("company_outlook")} />
              {errors.company_outlook && <span className="text-red-500 text-xs">{errors.company_outlook.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_gmail">Gmail</Label>
              <Input id="company_gmail" type="email" placeholder="company@gmail.com" {...register("company_gmail")} />
              {errors.company_gmail && <span className="text-red-500 text-xs">{errors.company_gmail.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_department">Department</Label>
              <Input id="company_department" placeholder="e.g. Operations / Headquarters" {...register("company_department")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_tags">Tags</Label>
              <Input id="company_tags" placeholder="e.g. Retail, SCM, Holding" {...register("company_tags")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_facebook">Facebook Page</Label>
              <Input id="company_facebook" placeholder="https://facebook.com/..." {...register("company_facebook")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Website URL</Label>
              <Input id="company_website" placeholder="https://..." {...register("company_website")} />
            </div>
          </div>
        </TabsContent>

        {/* --- TAB 4: SYSTEM & INTEGRATION URLS --- */}
        <TabsContent value="system" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="directus">Directus URL</Label>
              <Input id="directus" placeholder="https://directus.domain.com" {...register("directus")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="directus_token">Directus Token</Label>
              <Input id="directus_token" type="password" placeholder="Directus Bearer Token" {...register("directus_token")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="springboot">Spring Boot URL</Label>
              <Input id="springboot" placeholder="https://api.domain.com" {...register("springboot")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="springboot_token">Spring Boot Token</Label>
              <Input id="springboot_token" type="password" placeholder="Spring Boot Token" {...register("springboot_token")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_id">Subscription ID</Label>
              <Input id="subscription_id" type="number" placeholder="Subscription ID" {...register("subscription_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="created_by">Created By</Label>
              <Input id="created_by" placeholder="User / Admin" {...register("created_by")} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isUploadingLogo}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploadingLogo} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Subsidiary"
          )}
        </Button>
      </div>
    </form>
  );
}
