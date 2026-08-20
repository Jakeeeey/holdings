import { useState, useCallback } from "react";
import { Task, CreateTask, UpdateTask, Holiday } from "../type";

export function useTasks(userId?: string | number, employeeIds?: string[]) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/holdings/tasks`;
      if (employeeIds && employeeIds.length > 0) {
        url += `?userIds=${employeeIds.join(',')}`;
      }
      
      const [tasksRes, holidaysRes] = await Promise.all([
        fetch(url),
        fetch(`/api/holdings/holidays`)
      ]);
      
      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
      if (!holidaysRes.ok) throw new Error("Failed to fetch holidays");
      
      const tasksData = await tasksRes.json();
      const holidaysData = await holidaysRes.json();
      
      setTasks(tasksData);
      setHolidays(holidaysData);
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [employeeIds]);

  const createTask = async (data: CreateTask) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/holdings/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while creating task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string | number, data: UpdateTask) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/holdings/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while updating task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string | number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/holdings/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while deleting task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tasks,
    holidays,
    isLoading,
    error,
    refresh: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
