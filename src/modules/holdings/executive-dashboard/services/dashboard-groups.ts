export interface DashboardGroup {
  id: number;
  category: string;
  group_name: string;
  directus?: string;
  directus_token?: string;
  springboot?: string;
  springboot_token?: string | null;
  username?: string;
  password_hash?: string;
  container_id?: number | { id: number; name: string; description?: string | null } | null;
  container?: {
    id: number | string;
    name: string;
    description?: string | null;
  } | null;
  [key: string]: unknown;
}

export async function fetchDashboardGroups(category?: string | null): Promise<DashboardGroup[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://goatedcodoer:8056";
    const token = process.env.DIRECTUS_STATIC_TOKEN;

    const fetchUrl = category 
      ? `${baseUrl.replace(/\/$/, "")}/items/dashboard_api?filter[category][_eq]=${encodeURIComponent(category)}`
      : `${baseUrl.replace(/\/$/, "")}/items/dashboard_api`;

    // Fetch dashboard_api and dashboard_container in parallel
    const [apiRes, containerRes] = await Promise.allSettled([
      fetch(fetchUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      }),
      fetch(`${baseUrl.replace(/\/$/, "")}/items/dashboard_container`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      })
    ]);

    let containers: Array<{ id: number | string; name: string; description?: string | null }> = [];
    if (containerRes.status === "fulfilled" && containerRes.value.ok) {
      try {
        const cJson = await containerRes.value.json();
        containers = cJson.data || [];
      } catch (e) {
        console.warn("Could not parse dashboard_container json:", e);
      }
    }

    const containerMap = new Map<number | string, { id: number | string; name: string; description?: string | null }>();
    containers.forEach((c) => {
      containerMap.set(String(c.id), c);
      containerMap.set(Number(c.id), c);
    });

    if (apiRes.status === "fulfilled" && apiRes.value.ok) {
      const json = await apiRes.value.json();
      if (json.data && json.data.length > 0) {
        const enriched: DashboardGroup[] = json.data.map((item: { container_id?: unknown; [key: string]: unknown }) => {
          let containerObj = null;
          if (item.container_id && typeof item.container_id === "object") {
            containerObj = item.container_id as { id: number | string; name: string; description?: string | null };
          } else if (item.container_id !== null && item.container_id !== undefined) {
            const match = containerMap.get(String(item.container_id)) || containerMap.get(Number(item.container_id));
            containerObj = match || {
              id: item.container_id as string | number,
              name: `Container ${item.container_id}`,
              description: null
            };
          }

          return {
            ...item,
            id: Number(item.id),
            category: String(item.category || ""),
            group_name: String(item.group_name || ""),
            container: containerObj
          };
        });

        return enriched;
      }
    }

    // Fallback Mock Data
    return [
      { 
        id: 1, 
        category: "distribution-sales", 
        group_name: "Men2 Marketing",
        directus: "http://goatedcodoer:8091/",
        directus_token: "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn",
        springboot: "http://goatedcodoer:8083/",
        container_id: 1,
        container: {
          id: 1,
          name: "Main Operations",
          description: "Primary distribution and logistics operations"
        }
      }
    ];
  } catch (error) {
    console.error("Error fetching dashboard groups:", error);
    return [
      { 
        id: 1, 
        category: "distribution-sales", 
        group_name: "Men2 Marketing",
        directus: "http://goatedcodoer:8091/",
        directus_token: "rTilKSsclzuQW8WfQWK1ba8wrD_LetNn",
        springboot: "http://goatedcodoer:8083/",
        container_id: 1,
        container: {
          id: 1,
          name: "Main Operations",
          description: "Primary distribution and logistics operations"
        }
      }
    ];
  }
}
