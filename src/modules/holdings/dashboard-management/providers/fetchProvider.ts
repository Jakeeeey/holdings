import { DashboardApiItem, DashboardApiFormData } from "../types";

export async function fetchDashboardApiItems(): Promise<DashboardApiItem[]> {
  const res = await fetch("/api/holdings/dashboard-management");
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function createDashboardApiItem(data: DashboardApiFormData): Promise<DashboardApiItem> {
  const res = await fetch("/api/holdings/dashboard-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create item");
  }
  return res.json();
}

export async function updateDashboardApiItem(id: number, data: Partial<DashboardApiFormData>): Promise<DashboardApiItem> {
  const res = await fetch(`/api/holdings/dashboard-management/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update item");
  }
  return res.json();
}

export async function deleteDashboardApiItem(id: number): Promise<void> {
  const res = await fetch(`/api/holdings/dashboard-management/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete item");
  }
}
