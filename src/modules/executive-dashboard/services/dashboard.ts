import { ExecutiveDashboardResponse } from "@/types/executive-dashboard.schema";

export const DashboardService = {
  fetchDashboardData: async (): Promise<ExecutiveDashboardResponse> => {
    // In a real implementation, this would fetch from a database or external API.
    // For now, we mock the data to provide an immediate visual result.
    
    return {
      kpis: [
        { id: "1", label: "Total Revenue", value: 1250000, trend: 15, trendDirection: "up" },
        { id: "2", label: "Active Patients", value: 4500, trend: 5, trendDirection: "up" },
        { id: "3", label: "Pending Appointments", value: 320, trend: 2, trendDirection: "down" },
        { id: "4", label: "Staff Availability", value: 92, trend: 0, trendDirection: "neutral" },
      ],
      revenueChart: [
        { name: "Jan", value: 40000 },
        { name: "Feb", value: 45000 },
        { name: "Mar", value: 55000 },
        { name: "Apr", value: 50000 },
        { name: "May", value: 65000 },
        { name: "Jun", value: 70000 },
      ],
      patientActivityChart: [
        { name: "Mon", value: 120, secondaryValue: 100 },
        { name: "Tue", value: 150, secondaryValue: 110 },
        { name: "Wed", value: 180, secondaryValue: 120 },
        { name: "Thu", value: 130, secondaryValue: 90 },
        { name: "Fri", value: 200, secondaryValue: 150 },
        { name: "Sat", value: 80, secondaryValue: 60 },
        { name: "Sun", value: 50, secondaryValue: 40 },
      ],
    };
  }
};
