"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TaskStatus, TaskPriority, CreateTask, TaskCategory } from "../type";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface User {
  user_id: number;
  user_fname: string;
  user_lname: string;
  user_email: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | number;
  onSubmit: (data: CreateTask) => Promise<void>;
}

export function CreateTaskDialog({ open, onOpenChange, userId, onSubmit }: CreateTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Pending" as TaskStatus,
    priority: "Medium" as TaskPriority,
    category: "Task" as TaskCategory,
    color: "#3b82f6",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (open && users.length === 0) {
      const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const res = await fetch("/api/holdings/users");
          if (!res.ok) throw new Error("Failed to fetch users");
          const data = await res.json();
          setUsers(data.users || []);
        } catch {
          toast.error("Could not load users list");
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [open, users.length]);

  const toggleUserSelection = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to assign this task to.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        user_id: userId, // Current user creates it
        assignees: selectedUsers,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      });
      
      toast.success("Task successfully created and assigned!");
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "Pending",
        priority: "Medium",
        category: "Task",
        color: "#3b82f6",
        start_date: "",
        end_date: "",
      });
      setSelectedUsers([]);
    } catch {
      toast.error("Failed to assign tasks.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
          <DialogDescription>
            Add a new activity and assign it to multiple people.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g., Review Q3 Report"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Activity details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
              >
                <option value="Task">Task</option>
                <option value="Activity">Activity</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background">
                <input
                  type="color"
                  id="color"
                  className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <span className="text-muted-foreground font-mono text-xs uppercase">{formData.color}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To (Included Persons)</Label>
            <Input
              placeholder="Search by name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2 bg-gray-50/50">
              {isFetchingUsers ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No users found.</p>
              ) : (
                users
                  .filter(u => 
                    `${u.user_fname} ${u.user_lname} ${u.user_email}`.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map(user => (
                  <label key={user.user_id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      checked={selectedUsers.includes(user.user_id)}
                      onChange={() => toggleUserSelection(user.user_id)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user.user_fname} {user.user_lname}
                    </span>
                    <span className="text-xs text-gray-400">({user.user_email})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date & Time</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date & Time</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
