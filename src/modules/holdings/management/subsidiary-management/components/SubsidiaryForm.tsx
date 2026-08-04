"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubsidiarySchema, SubsidiaryInput } from "../types/subsidiary.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubsidiaryFormProps {
  initialData?: SubsidiaryInput;
  onSubmit: (data: SubsidiaryInput) => Promise<void>;
  onCancel: () => void;
}

export function SubsidiaryForm({ initialData, onSubmit, onCancel }: SubsidiaryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubsidiaryInput>({
    resolver: zodResolver(SubsidiarySchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input id="company_name" {...register("company_name")} />
          {errors.company_name && <span className="text-red-500 text-sm">{errors.company_name.message}</span>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company_code">Company Code</Label>
          <Input id="company_code" {...register("company_code")} />
          {errors.company_code && <span className="text-red-500 text-sm">{errors.company_code.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_tin">TIN</Label>
          <Input id="company_tin" {...register("company_tin")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_email">Email</Label>
          <Input id="company_email" type="email" {...register("company_email")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_address">Address</Label>
          <Input id="company_address" {...register("company_address")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_dateAdmitted">Date Admitted</Label>
          <Input id="company_dateAdmitted" type="date" {...register("company_dateAdmitted")} />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
