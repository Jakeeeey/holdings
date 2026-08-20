/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, CreateTask, UpdateTask, RecurringRule, CreateRecurringRule } from "../type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }

  return headers;
}

async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const taskService = {
  fetchAll: async (userIds?: string[]): Promise<Task[]> => {
    try {
      let filterQuery = '?sort=-date_created';
      if (userIds && userIds.length > 0) {
        const userIdsStr = userIds.join(',');
        // 1. Fetch assigned tasks from junction table
        const assigneesRes = await directusFetch(`/items/employee_task_assignee?filter[user_id][_in]=${userIdsStr}`);
        const assignedTaskIds = assigneesRes.data?.map((a: any) => a.task_id) || [];
        
        // 2. Fetch tasks where user is the direct owner OR they are assigned
        filterQuery = `?filter[_or][0][user_id][_in]=${userIdsStr}`;
        if (assignedTaskIds.length > 0) {
          filterQuery += `&filter[_or][1][id][_in]=${assignedTaskIds.join(',')}`;
        }
        filterQuery += `&sort=-date_created`;
      }
      
      const res = await directusFetch(`/items/employee_task${filterQuery}`);
      const tasks = res.data || [];
      
      if (tasks.length === 0) return [];

      // 3. Fetch assignee counts/list for these tasks to populate `assignees` array
      const taskIds = tasks.map((t: any) => t.id);
      const allAssigneesRes = await directusFetch(`/items/employee_task_assignee?filter[task_id][_in]=${taskIds.join(',')}`);
      const allAssignees = allAssigneesRes.data || [];
      
      return tasks.map((task: any) => {
        const taskAssignees = allAssignees.filter((a: any) => a.task_id === task.id).map((a: any) => a.user_id);
        return {
          ...task,
          assignees: taskAssignees,
        };
      });
    } catch (error) {
      console.warn("Failed to fetch assignees (table might not exist yet):", error);
      // Fallback if table doesn't exist
      let fallbackQuery = '?sort=-date_created';
      if (userIds && userIds.length > 0) {
        fallbackQuery = `?filter[user_id][_in]=${userIds.join(',')}&sort=-date_created`;
      }
      const res = await directusFetch(`/items/employee_task${fallbackQuery}`);
      return res.data || [];
    }
  },

  fetchById: async (id: string | number): Promise<Task> => {
    const res = await directusFetch(`/items/employee_task/${id}`);
    return res.data;
  },

  create: async (data: CreateTask): Promise<Task> => {
    const { assignees, ...taskData } = data;
    const res = await directusFetch(`/items/employee_task`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    
    const newTask = res.data;
    
    if (assignees && assignees.length > 0) {
      try {
        const assigneePayload = assignees.map(uid => ({
          task_id: newTask.id,
          user_id: uid
        }));
        
        await directusFetch(`/items/employee_task_assignee`, {
          method: 'POST',
          body: JSON.stringify(assigneePayload),
        });
        
        newTask.assignees = assignees;
      } catch (e) {
        console.warn("Failed to insert assignees", e);
      }
    }
    
    return newTask;
  },

  update: async (id: string | number, data: UpdateTask): Promise<Task> => {
    const res = await directusFetch(`/items/employee_task/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  delete: async (id: string | number): Promise<void> => {
    await directusFetch(`/items/employee_task/${id}`, {
      method: 'DELETE',
    });
  },
};

export const schedulingService = {
  fetchAllRules: async (): Promise<RecurringRule[]> => {
    // Used by cron job to evaluate all active rules
    const res = await directusFetch(`/items/recurring_rules?filter[status][_eq]=Active`);
    return res.data;
  },

  createRule: async (data: CreateRecurringRule): Promise<RecurringRule> => {
    const res = await directusFetch(`/items/recurring_rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateRule: async (id: string | number, data: Partial<RecurringRule>): Promise<RecurringRule> => {
    const res = await directusFetch(`/items/recurring_rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  }
};

