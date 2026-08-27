export interface DashboardApiItem {
  id: number;
  category: string;
  group_name: string;
  directus: string;
  directus_token: string;
  springboot: string;
  date_created?: string;
  date_updated?: string;
}

export type DashboardApiFormData = Omit<DashboardApiItem, "id" | "date_created" | "date_updated">;
