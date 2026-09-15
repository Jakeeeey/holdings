import { useState, useEffect, useCallback } from "react";
import { ConferenceRoomRequestInput } from "../../conference-room-request/types/conference-room-request.schema";

export type ConferenceRoom = {
  id: number;
  name: string;
};

export const useRoomMonitor = (roomId: number) => {
  const [requests, setRequests] = useState<ConferenceRoomRequestInput[]>([]);
  const [room, setRoom] = useState<ConferenceRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Polling interval in ms (e.g. 1 minute)
  const POLLING_INTERVAL = 60000;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch rooms
      const roomsRes = await fetch('/api/holdings/conference-rooms');
      if (!roomsRes.ok) throw new Error("Failed to fetch rooms");
      const roomsData = await roomsRes.json();
      
      if (roomsData.success && Array.isArray(roomsData.data)) {
        const foundRoom = roomsData.data.find((r: ConferenceRoom) => r.id === roomId);
        if (foundRoom) {
          setRoom({ id: foundRoom.id, name: foundRoom.name });
        }
      }

      // Fetch all requests
      const reqRes = await fetch('/api/holdings/conference-room-requests/all');
      if (!reqRes.ok) throw new Error("Failed to fetch requests");
      const reqData = await reqRes.json();
      
      if (reqData.success && Array.isArray(reqData.data)) {
        // Filter requests strictly for this room and that are approved
        const roomReqs = reqData.data.filter(
          (req: ConferenceRoomRequestInput) => 
            req.room_id === roomId && req.status.toLowerCase() === 'approved'
        );
        setRequests(roomReqs);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Monitor fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();

    // Setup polling
    const intervalId = setInterval(fetchData, POLLING_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return {
    requests,
    room,
    isLoading,
    error,
    refresh: fetchData
  };
};
