import { ConferenceRoomInput, ConferenceRoomResponse } from "../types/conference-room.schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const ENDPOINT = `${API_BASE_URL}/items/conference_room`;

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  return headers;
};

export const fetchAllConferenceRooms = async (): Promise<ConferenceRoomInput[]> => {
  const response = await fetch(ENDPOINT, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conference rooms: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
};

export const fetchConferenceRoomById = async (id: number): Promise<ConferenceRoomInput> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conference room ${id}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

export const createConferenceRoom = async (payload: ConferenceRoomInput): Promise<ConferenceRoomResponse> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conference room: ${response.statusText}`);
  }

  const data = await response.json();
  return { success: true, data: data.data };
};

export const updateConferenceRoom = async (id: number, payload: Partial<ConferenceRoomInput>): Promise<ConferenceRoomResponse> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conference room: ${response.statusText}`);
  }

  const data = await response.json();
  return { success: true, data: data.data };
};

export const deleteConferenceRoom = async (id: number): Promise<ConferenceRoomResponse> => {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete conference room: ${response.statusText}`);
  }

  return { success: true };
};
