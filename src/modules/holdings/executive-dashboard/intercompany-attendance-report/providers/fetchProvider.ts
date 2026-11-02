import type {
  IntercompanyAttendanceResponse,
  FetchAttendanceParams,
} from "../types";

export const FALLBACK_ATTENDANCE_DATA: IntercompanyAttendanceResponse = {
  kpis: {
    totalWorkforce: 1240,
    totalPresent: 1188,
    totalOnTime: 1092,
    totalLate: 96,
    totalAbsent: 28,
    totalOnLeave: 24,
    overallAttendanceRate: 95.8,
    overallPunctualityRate: 91.9,
    topAttendanceCompany: "Omni Logistics Co.",
    topAttendanceRate: 97.6,
  },
  companySummaries: [
    {
      companyId: 1,
      companyName: "Omni Logistics Co.",
      companyCode: "OLC",
      status: "ACTIVE",
      totalEmployees: 420,
      presentCount: 410,
      onTimeCount: 386,
      lateCount: 24,
      absentCount: 6,
      leaveCount: 4,
      attendanceRate: 97.6,
      punctualityRate: 94.1,
      attendanceSharePct: 34.5,
    },
    {
      companyId: 2,
      companyName: "Prime Distribution Inc.",
      companyCode: "PDI",
      status: "ACTIVE",
      totalEmployees: 310,
      presentCount: 298,
      onTimeCount: 272,
      lateCount: 26,
      absentCount: 7,
      leaveCount: 5,
      attendanceRate: 96.1,
      punctualityRate: 91.3,
      attendanceSharePct: 25.1,
    },
    {
      companyId: 3,
      companyName: "Apex Retail Group",
      companyCode: "ARG",
      status: "ACTIVE",
      totalEmployees: 260,
      presentCount: 248,
      onTimeCount: 224,
      lateCount: 24,
      absentCount: 6,
      leaveCount: 6,
      attendanceRate: 95.4,
      punctualityRate: 90.3,
      attendanceSharePct: 20.9,
    },
    {
      companyId: 4,
      companyName: "Vertex Holdings Corp.",
      companyCode: "VHC",
      status: "ACTIVE",
      totalEmployees: 150,
      presentCount: 142,
      onTimeCount: 132,
      lateCount: 10,
      absentCount: 5,
      leaveCount: 3,
      attendanceRate: 94.7,
      punctualityRate: 93.0,
      attendanceSharePct: 12.0,
    },
    {
      companyId: 5,
      companyName: "Summit Cold Chain",
      companyCode: "SCC",
      status: "ACTIVE",
      totalEmployees: 100,
      presentCount: 90,
      onTimeCount: 78,
      lateCount: 12,
      absentCount: 4,
      leaveCount: 6,
      attendanceRate: 90.0,
      punctualityRate: 86.7,
      attendanceSharePct: 7.5,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-02",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

export async function fetchIntercompanyAttendance({
  groupId,
  startDate,
  endDate,
  force = false,
}: FetchAttendanceParams): Promise<IntercompanyAttendanceResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (force) params.set("force", "true");

  const url = `/api/holdings/executive-dashboard/hr/${groupId}/attendance-report?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchIntercompanyAttendance] Server responded with status ${res.status}`);
      return FALLBACK_ATTENDANCE_DATA;
    }

    const data: IntercompanyAttendanceResponse = await res.json();
    return data;
  } catch (err) {
    console.warn("[fetchIntercompanyAttendance] Error fetching data, using fallback:", err);
    return FALLBACK_ATTENDANCE_DATA;
  }
}
