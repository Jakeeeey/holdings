import { ConferenceRoomRequestInput, ConferenceRoomRequestResponse } from "../types/conference-room-request.schema";
import { ConferenceRoomInput } from "../../conference-room/types/conference-room.schema";

const LOCAL_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const LOCAL_DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const getLocalHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (LOCAL_DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${LOCAL_DIRECTUS_TOKEN}`;
  }
  return headers;
};

interface HostCompanyDetails {
  url: string;
  token: string;
}

/**
 * Helper function to retrieve the host company API URL and Token
 */
async function getHostCompanyDetails(): Promise<HostCompanyDetails> {
  // 1. Fetch the setting value for conference_room
  const settingRes = await fetch(`${LOCAL_API_BASE_URL}/items/general_setting?filter[setting_key][_eq]=conference_room`, {
    method: "GET",
    headers: getLocalHeaders(),
    cache: "no-store",
  });
  
  if (!settingRes.ok) throw new Error("Failed to fetch general setting for conference_room");
  const settingData = await settingRes.json();
  const companyId = settingData?.data?.[0]?.setting_value;
  
  if (!companyId) throw new Error("No conference_room setting found in general_setting");

  // 2. Fetch the company list details for this company
  const companyRes = await fetch(`${LOCAL_API_BASE_URL}/items/company_list?filter[company_id][_eq]=${companyId}`, {
    method: "GET",
    headers: getLocalHeaders(),
    cache: "no-store",
  });

  if (!companyRes.ok) throw new Error("Failed to fetch company details");
  const companyData = await companyRes.json();
  const company = companyData?.data?.[0];

  console.log(`[getHostCompanyDetails] Fetched companyId: ${companyId}`);
  console.log(`[getHostCompanyDetails] Fetched company record:`, company);

  if (!company || !company.directus) throw new Error("Target company Directus URL is missing");

  return {
    url: company.directus.replace(/\/$/, ""),
    token: company.directus_token || "",
  };
}

export const fetchGlobalConferenceRooms = async (): Promise<ConferenceRoomInput[]> => {
  const host = await getHostCompanyDetails();
  
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (host.token) headers["Authorization"] = `Bearer ${host.token}`;

  const endpoint = `${host.url}/items/conference_room`;
  console.log(`[fetchGlobalConferenceRooms] Calling API: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[fetchGlobalConferenceRooms] ERROR ${response.status} from ${endpoint}:`, errorText);
    throw new Error(`Failed to fetch global conference rooms: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[fetchGlobalConferenceRooms] Success. Retrieved ${data?.data?.length || 0} rooms.`);
  return data.data || [];
};

export const fetchMyRequests = async (userId?: number): Promise<ConferenceRoomRequestInput[]> => {
  const host = await getHostCompanyDetails();
  
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (host.token) headers["Authorization"] = `Bearer ${host.token}`;

  // If userId is provided, we can filter by requested_by, otherwise fetch all (for admins)
  let endpoint = `${host.url}/items/conference_room_request`;
  if (userId) {
    endpoint += `?filter[requested_by][_eq]=${userId}`;
  }

  console.log(`[fetchMyRequests] Calling API: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[fetchMyRequests] ERROR ${response.status} from ${endpoint}:`, errorText);
    throw new Error(`Failed to fetch requests: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[fetchMyRequests] Success. Retrieved ${data?.data?.length || 0} items.`);
  return data.data || [];
};

export const submitConferenceRoomRequest = async (payload: ConferenceRoomRequestInput): Promise<ConferenceRoomRequestResponse> => {
  const host = await getHostCompanyDetails();
  
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (host.token) headers["Authorization"] = `Bearer ${host.token}`;

  const endpoint = `${host.url}/items/conference_room_request`;
  console.log(`[submitConferenceRoomRequest] POSTing to API: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[submitConferenceRoomRequest] ERROR ${response.status} from ${endpoint}:`, errorText);
    throw new Error(`Failed to submit request: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[submitConferenceRoomRequest] Success.`);
  return { success: true, data: data.data };
};
