"use client";

import React, { useState } from "react";
import { useSubsidiaryContext } from "./providers/SubsidiaryProvider";
import { SubsidiaryTable } from "./components/SubsidiaryTable";
import { SubsidiaryForm } from "./components/SubsidiaryForm";
import { SubsidiaryInput } from "./types/subsidiary.schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function SubsidiaryPage() {
  const { data, isLoading, error, addSubsidiary, updateSubsidiary, removeSubsidiary } = useSubsidiaryContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<SubsidiaryInput | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleOpenCreate = () => {
    setEditingData(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: SubsidiaryInput) => {
    setEditingData(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingData(undefined);
  };

  const handleSubmit = async (formData: SubsidiaryInput) => {
    if (editingData && editingData.company_id) {
      await updateSubsidiary(editingData.company_id, formData);
    } else {
      await addSubsidiary(formData);
    }
    handleCloseForm();
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await removeSubsidiary(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) return <div className="p-8">Loading subsidiaries...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="h-full overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-transparent">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-slate-100">
            Subsidiary Management
          </h1>
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mt-1">
            ENTERPRISE ARCHITECTURE NODE REGISTRY
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] rounded-full px-6">
          <Plus className="mr-2 h-4 w-4" /> Register Subsidiary
        </Button>
      </div>

      <SubsidiaryTable 
        data={data} 
        onEdit={handleOpenEdit} 
        onDelete={(id) => setDeletingId(id)} 
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Subsidiary" : "Add Subsidiary"}</DialogTitle>
          </DialogHeader>
          <SubsidiaryForm 
            initialData={editingData} 
            onSubmit={handleSubmit} 
            onCancel={handleCloseForm} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subsidiary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
