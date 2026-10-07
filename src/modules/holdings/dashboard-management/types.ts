export interface DashboardContainer {
  id: number;
  name: string;
  description?: string | null;
}

export interface DashboardApiItem {
  id: number;
  category: string;
  group_name: string;
  directus: string;
  directus_token: string;
  springboot: string;
  springboot_token?: string;
  username?: string;
  password_hash?: string;
  container_id?: number | DashboardContainer | null;
  container?: DashboardContainer | null;
  date_created?: string;
  date_updated?: string;
}

export type DashboardApiFormData = Omit<DashboardApiItem, "id" | "date_created" | "date_updated" | "container">;
