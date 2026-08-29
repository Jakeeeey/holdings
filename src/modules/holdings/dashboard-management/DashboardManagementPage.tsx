"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardApiItem, DashboardApiFormData } from "./types";
import { fetchDashboardApiItems, createDashboardApiItem, updateDashboardApiItem, deleteDashboardApiItem } from "./providers/fetchProvider";
import { DashboardApiForm } from "./components/DashboardApiForm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardManagementPage() {
  const [items, setItems] = useState<DashboardApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<DashboardApiItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardApiItem | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardApiItems();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard API items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async (data: DashboardApiFormData) => {
    try {
      await createDashboardApiItem(data);
      toast.success("Item created successfully");
      setIsAddOpen(false);
      loadItems();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to create item");
    }
  };

  const handleUpdate = async (data: DashboardApiFormData) => {
    if (!editingItem) return;
    try {
      await updateDashboardApiItem(editingItem.id, data);
      toast.success("Item updated successfully");
      setEditingItem(null);
      loadItems();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to update item");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteDashboardApiItem(deletingItem.id);
      toast.success("Item deleted successfully");
      setDeletingItem(null);
      loadItems();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to delete item");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Management</h2>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dashboard API Group</DialogTitle>
              <DialogDescription>
                Create a new dashboard API connection entry.
              </DialogDescription>
            </DialogHeader>
            <DashboardApiForm onSubmit={handleCreate} onCancel={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>API Connections</CardTitle>
          <CardDescription>
            Manage the Directus and Springboot connections for dashboard groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No dashboard API groups found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Directus URL</TableHead>
                    <TableHead>Springboot URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.group_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.directus}>
                        {item.directus}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.springboot}>
                        {item.springboot}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingItem(item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dashboard API Group</DialogTitle>
            <DialogDescription>
              Make changes to the API connection entry.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <DashboardApiForm 
              initialData={editingItem} 
              onSubmit={handleUpdate} 
              onCancel={() => setEditingItem(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the API group <span className="font-semibold">{deletingItem?.group_name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
