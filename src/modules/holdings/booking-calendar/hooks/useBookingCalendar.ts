import { useState, useEffect, useCallback } from "react";
import { ConferenceRoomRequestInput } from "../../conference-room-request/types/conference-room-request.schema";

export type ConferenceRoom = {
  id: number;
  name: string;
};

export const useBookingCalendar = () => {
  const [requests, setRequests] = useState<ConferenceRoomRequestInput[]>([]);
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [roomsRes, reqRes] = await Promise.all([
        fetch('/api/holdings/conference-rooms'),
        fetch('/api/holdings/conference-room-requests/all')
      ]);

      if (!roomsRes.ok) throw new Error("Failed to fetch rooms");
      if (!reqRes.ok) throw new Error("Failed to fetch requests");

      const roomsData = await roomsRes.json();
      const reqData = await reqRes.json();
      
      if (roomsData.success && Array.isArray(roomsData.data)) {
        setRooms(roomsData.data);
      }

      if (reqData.success && Array.isArray(reqData.data)) {
        // Filter out rejected/cancelled requests to keep the calendar clean
        const activeReqs = reqData.data.filter(
          (req: ConferenceRoomRequestInput) => 
            req.status.toLowerCase() !== 'rejected' && req.status.toLowerCase() !== 'cancelled'
        );
        setRequests(activeReqs);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Booking calendar fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    requests,
    rooms,
    isLoading,
    error,
    refresh: fetchData
  };
};
