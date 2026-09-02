import { useState, useCallback, useEffect } from "react";
import { ConferenceRoomRequestInput } from "../types/conference-room-request.schema";
import { ConferenceRoomInput } from "../../conference-room/types/conference-room.schema";

export const useConferenceRoomRequest = () => {
  const [requests, setRequests] = useState<ConferenceRoomRequestInput[]>([]);
  const [allRequests, setAllRequests] = useState<ConferenceRoomRequestInput[]>([]);
  const [rooms, setRooms] = useState<ConferenceRoomInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch the user's past/pending requests, global rooms, and all requests concurrently
      const [reqRes, roomsRes, allReqRes] = await Promise.all([
        fetch("/api/holdings/conference/conference-room-requests"),
        fetch("/api/holdings/conference/conference-room-requests/global-rooms"),
        fetch("/api/holdings/conference/conference-room-requests/all")
      ]);

      const reqData = await reqRes.json();
      const roomsData = await roomsRes.json();
      const allReqData = await allReqRes.json();

      if (!reqData.success) throw new Error(reqData.message || "Failed to fetch requests");
      if (!roomsData.success) throw new Error(roomsData.message || "Failed to fetch global rooms");
      if (!allReqData.success) throw new Error(allReqData.message || "Failed to fetch all requests");

      setRequests(reqData.data);
      setRooms(roomsData.data);
      setAllRequests(allReqData.data);
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
      const response = await fetch("/api/holdings/conference/conference-room-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to submit request");
      
      await fetchInitialData(); // Refresh the lists
      return data;
    } catch (err) {
      throw err;
    }
  };

  return { requests, allRequests, rooms, isLoading, error, refresh: fetchInitialData, submitRequest };
};
