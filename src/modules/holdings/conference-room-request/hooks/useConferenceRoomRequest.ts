import { useState, useCallback, useEffect } from "react";
import { ConferenceRoomRequestInput } from "../types/conference-room-request.schema";
import { ConferenceRoomInput } from "../../conference-room/types/conference-room.schema";
import { fetchGlobalConferenceRooms } from "../services/conference-room-request.service";

export const useConferenceRoomRequest = () => {
  const [requests, setRequests] = useState<ConferenceRoomRequestInput[]>([]);
  const [rooms, setRooms] = useState<ConferenceRoomInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch the user's past/pending requests
      const reqRes = await fetch("/api/holdings/conference-room-requests");
      const reqData = await reqRes.json();
      if (!reqData.success) throw new Error(reqData.message || "Failed to fetch requests");
      
      setRequests(reqData.data);

      // 2. Fetch the global conference rooms available for requesting
      // Since fetchGlobalConferenceRooms needs tokens from the host company API, we do it via a server action or API route.
      // Wait, we can't call a Server Service directly from the client hook unless it's a Server Action.
      // Let's create an API route for fetching the global rooms!
      
      const roomsRes = await fetch("/api/holdings/conference-room-requests/global-rooms");
      const roomsData = await roomsRes.json();
      if (!roomsData.success) throw new Error(roomsData.message || "Failed to fetch global rooms");

      setRooms(roomsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const submitRequest = async (payload: ConferenceRoomRequestInput) => {
    try {
      const response = await fetch("/api/holdings/conference-room-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to submit request");
      
      await fetchInitialData(); // Refresh the list
      return data;
    } catch (err) {
      throw err;
    }
  };

  return { requests, rooms, isLoading, error, refresh: fetchInitialData, submitRequest };
};
