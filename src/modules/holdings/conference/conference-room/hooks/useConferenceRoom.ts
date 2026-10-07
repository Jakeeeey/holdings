import { useState, useEffect, useCallback } from "react";
import { ConferenceRoomInput } from "../types/conference-room.schema";
import { toast } from "sonner"; 

export const useConferenceRoom = () => {
  const [data, setData] = useState<ConferenceRoomInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConferenceRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/holdings/conference/conference-rooms");
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch conference rooms");
      }
      setData(result.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(err instanceof Error ? err : new Error(message));
      toast.error(message || "An error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConferenceRooms();
  }, [fetchConferenceRooms]);

  const addConferenceRoom = async (payload: ConferenceRoomInput) => {
    try {
      const res = await fetch("/api/holdings/conference/conference-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create conference room");
      }
      toast.success("Conference room created successfully!");
      fetchConferenceRooms(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create conference room");
      throw err;
    }
  };

  const updateConferenceRoom = async (id: number, payload: Partial<ConferenceRoomInput>) => {
    try {
      const res = await fetch(`/api/holdings/conference/conference-rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update conference room");
      }
      toast.success("Conference room updated successfully!");
      fetchConferenceRooms(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update conference room");
      throw err;
    }
  };

  const removeConferenceRoom = async (id: number) => {
    try {
      const res = await fetch(`/api/holdings/conference/conference-rooms/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to delete conference room");
      }
      toast.success("Conference room deleted successfully!");
      fetchConferenceRooms(); // Refresh list
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete conference room");
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: fetchConferenceRooms,
    addConferenceRoom,
    updateConferenceRoom,
    removeConferenceRoom,
  };
};
