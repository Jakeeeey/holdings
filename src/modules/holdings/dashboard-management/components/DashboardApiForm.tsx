"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardApiFormData, DashboardApiItem } from "../types";

const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  group_name: z.string().min(1, "Group Name is required"),
  directus: z.string().url("Must be a valid URL"),
  directus_token: z.string().min(1, "Token is required"),
  springboot: z.string().url("Must be a valid URL"),
});

interface DashboardApiFormProps {
  initialData?: DashboardApiItem;
  onSubmit: (data: DashboardApiFormData) => Promise<void>;
  onCancel: () => void;
}

export function DashboardApiForm({ initialData, onSubmit, onCancel }: DashboardApiFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialData?.category || "distribution-sales",
      group_name: initialData?.group_name || "",
      directus: initialData?.directus || "",
      directus_token: initialData?.directus_token || "",
      springboot: initialData?.springboot || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g. distribution-sales" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="group_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Men2 Marketing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="directus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Directus URL</FormLabel>
              <FormControl>
                <Input placeholder="https://api.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="directus_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Directus Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Static token..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="springboot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Springboot URL</FormLabel>
              <FormControl>
                <Input placeholder="https://api.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
