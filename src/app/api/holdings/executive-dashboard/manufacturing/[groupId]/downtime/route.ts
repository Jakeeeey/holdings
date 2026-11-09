import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/modules/holdings/executive-dashboard/services/dashboard-groups";
import type {
  MachineDowntimeResponse,
  MachineAssetSummary,
  MachineDowntimeIncident,
  DowntimeCategoryBreakdown,
  MachineDowntimeKpis,
  DowntimeCategory,
  MachineOperatingStatus,
} from "@/modules/holdings/executive-dashboard/machine-downtime/types";
import { FALLBACK_MACHINE_DOWNTIME_DATA } from "@/modules/holdings/executive-dashboard/machine-downtime/providers/fetchProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRec = Record<string, unknown>;

interface CachedDowntimeData {
  data: MachineDowntimeResponse;
  timestamp: number;
}

const memoryCache = new Map<string, CachedDowntimeData>();
const CACHE_TTL_MS = 30000; // 30s

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { data: [], ok: false };
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? (json.data as T[]) : [],
      ok: true,
    };
  } catch {
    return { data: [], ok: false };
  }
}

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find((g) => String(g.id) === groupId) ||
      groups.find(
        (g) =>
          g.category === "machine-downtime" ||
          g.category === "machine_downtime" ||
          g.category === "downtime" ||
          g.category === "production-downtime" ||
          g.category === "equipment-downtime" ||
          g.category === "downtime-analysis" ||
          g.category === "oee-downtime" ||
          g.category === "maintenance-downtime"
      ) ||
      null
    );
  } catch (e) {
    console.error("[Machine Downtime Route] fetchDashboardGroups error:", e);
    return null;
  }
}

function normalizeCategory(catStr?: string, reason?: string): { category: DowntimeCategory; label: string } {
  const s = `${catStr || ""} ${reason || ""}`.toUpperCase();
  if (s.includes("ELECTRICAL") || s.includes("SENSOR") || s.includes("INVERTER") || s.includes("WIRING")) {
    return { category: "ELECTRICAL_SENSOR", label: "Electrical & Sensor Fault" };
  }
  if (s.includes("PREVENTIVE") || s.includes("SCHEDULED") || s.includes("ROUTINE") || s.includes("LUBRICATION")) {
    return { category: "PREVENTIVE_MAINTENANCE", label: "Preventive Maintenance" };
  }
  if (s.includes("CHANGEOVER") || s.includes("TOOL") || s.includes("DIE") || s.includes("CLEANING")) {
    return { category: "CHANGEOVER_TOOLING", label: "Changeover & Tooling" };
  }
  if (s.includes("BLOCKAGE") || s.includes("SLAG") || s.includes("CLOG") || s.includes("JAM")) {
    return { category: "PROCESS_BLOCKAGE", label: "Process Blockage & Slag" };
  }
  if (s.includes("STARVATION") || s.includes("OPERATOR") || s.includes("FEED")) {
    return { category: "OPERATOR_STARVATION", label: "Operator & Feed Starvation" };
  }
  return { category: "MECHANICAL_BREAKDOWN", label: "Mechanical Breakdown" };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const categoryFilter = searchParams.get("category");
    const statusFilter = searchParams.get("status");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");

    const startDate =
      searchParams.get("startDate")?.trim() || `${currentYear}-01-01`;
    const endDate =
      searchParams.get("endDate")?.trim() || `${currentYear}-${currentMonth}-${currentDay}`;

    const cacheKey = `mfg_downtime_${groupId}_${startDate}_${endDate}_${categoryFilter || "all"}_${statusFilter || "all"}`;
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryBaseUrl = (
      (group?.directus as string | undefined) ||
      process.env.MANUFACTURING_DIRECTUS_URL ||
      "http://100.66.3.70:8074"
    ).replace(/\/$/, "");

    const token =
      (group?.directus_token as string | undefined) ||
      process.env.MANUFACTURING_DIRECTUS_TOKEN ||
      "test";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const hostVariants = [
      primaryBaseUrl,
      "http://100.66.3.70:8074",
      "http://vtc:8074",
      "http://127.0.0.1:8074",
    ];

    let workCenterRecords: AnyRec[] = [];
    let maintenanceRecords: AnyRec[] = [];

    for (const host of hostVariants) {
      try {
        const [wcRes, maintRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/manufacturing_work_centers?limit=100`,
            headers,
            3000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${host}/items/manufacturing_asset_maintenance_history?limit=200&sort=-started_at`,
            headers,
            3000
          ),
        ]);

        if (wcRes.ok && wcRes.data.length > 0) {
          workCenterRecords = wcRes.data;
          maintenanceRecords = maintRes.data;
          break;
        }
      } catch {
        // continue
      }
    }

    // If no maintenance history records found, return realistic fallback
    if (maintenanceRecords.length === 0) {
      let machines = FALLBACK_MACHINE_DOWNTIME_DATA.machines;
      let incidents = FALLBACK_MACHINE_DOWNTIME_DATA.incidents;

      if (statusFilter) {
        machines = machines.filter((m) => m.status === statusFilter);
      }
      if (categoryFilter) {
        incidents = incidents.filter((i) => i.category === categoryFilter);
      }

      const responseData: MachineDowntimeResponse = {
        ...FALLBACK_MACHINE_DOWNTIME_DATA,
        machines,
        incidents,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        isFallback: true,
      };

      memoryCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      return NextResponse.json(responseData);
    }

    // Process live maintenance records
    const wcMap = new Map<number, AnyRec>();
    for (const wc of workCenterRecords) {
      const id = Number(wc.work_center_id || wc.id || 0);
      if (id > 0) wcMap.set(id, wc);
    }

    const incidents: MachineDowntimeIncident[] = [];
    const machineAggMap = new Map<
      number,
      {
        name: string;
        assetId: number;
        downtimeMins: number;
        incidentsCount: number;
        financialLoss: number;
        causes: Map<string, number>;
        activeBreakdowns: number;
      }
    >();

    const catAggMap = new Map<
      DowntimeCategory,
      { label: string; mins: number; count: number; loss: number }
    >();

    let totalDowntimeMins = 0;
    let totalFinancialLoss = 0;
    let activeBreakdownsCount = 0;

    maintenanceRecords.forEach((m, idx) => {
      const id = Number(m.id || idx + 1);
      const workCenterId = Number(m.work_center_id || m.asset_id || 316);
      const wc = wcMap.get(workCenterId);
      const machineName = (wc?.work_center_name as string) || (m.machine_name as string) || `Work Center #${workCenterId}`;
      const assetId = Number(m.asset_id || wc?.asset_id || 200);

      const start = m.started_at ? new Date(String(m.started_at)).getTime() : Date.now() - 3600000;
      const end = m.ended_at ? new Date(String(m.ended_at)).getTime() : null;
      const durationMins = end ? Math.max(5, Math.round((end - start) / 60000)) : 120;
      const durationHours = Number((durationMins / 60).toFixed(2));
      const status = end ? "RESOLVED" : "IN_PROGRESS";
      if (!end) activeBreakdownsCount++;

      const { category, label } = normalizeCategory(m.breakdown_category as string, m.start_reason as string);
      const rootCause = (m.root_cause as string) || (m.start_reason as string) || "Routine operational stoppage";
      const correctiveAction = (m.corrective_action as string) || (m.resolution_notes as string) || "System diagnostic and recalibration";
      const technicianName = (m.technician_name as string) || "Plant Maintenance Team";
      const financialLossPhp = durationHours * 4500; // estimated ₱4.5k per downtime hour

      totalDowntimeMins += durationMins;
      totalFinancialLoss += financialLossPhp;

      incidents.push({
        id,
        workCenterId,
        machineName,
        assetId,
        category,
        categoryLabel: label,
        startedAt: (m.started_at as string) || new Date().toISOString(),
        endedAt: (m.ended_at as string) || undefined,
        durationMinutes: durationMins,
        durationHours,
        status,
        rootCause,
        correctiveAction,
        technicianName,
        financialLossPhp: Math.round(financialLossPhp),
      });

      // Machine aggregation
      if (!machineAggMap.has(workCenterId)) {
        machineAggMap.set(workCenterId, {
          name: machineName,
          assetId,
          downtimeMins: 0,
          incidentsCount: 0,
          financialLoss: 0,
          causes: new Map<string, number>(),
          activeBreakdowns: 0,
        });
      }
      const ma = machineAggMap.get(workCenterId)!;
      ma.downtimeMins += durationMins;
      ma.incidentsCount += 1;
      ma.financialLoss += financialLossPhp;
      ma.causes.set(rootCause, (ma.causes.get(rootCause) || 0) + 1);
      if (!end) ma.activeBreakdowns += 1;

      // Category aggregation
      if (!catAggMap.has(category)) {
        catAggMap.set(category, { label, mins: 0, count: 0, loss: 0 });
      }
      const ca = catAggMap.get(category)!;
      ca.mins += durationMins;
      ca.count += 1;
      ca.loss += financialLossPhp;
    });

    const plannedHoursPerMachine = 160.0;
    const machines: MachineAssetSummary[] = Array.from(machineAggMap.entries()).map(
      ([wcId, data]) => {
        const downtimeHours = Number((data.downtimeMins / 60).toFixed(1));
        const operatingHours = Math.max(0, Number((plannedHoursPerMachine - downtimeHours).toFixed(1)));
        const availabilityRate = Number(((operatingHours / plannedHoursPerMachine) * 100).toFixed(1));

        const mttrHours = data.incidentsCount > 0 ? Number((downtimeHours / data.incidentsCount).toFixed(1)) : 0;
        const mtbfHours = data.incidentsCount > 0 ? Number((operatingHours / data.incidentsCount).toFixed(1)) : operatingHours;

        let status: MachineOperatingStatus = "OPERATIONAL";
        if (data.activeBreakdowns > 0) status = "UNDER_MAINTENANCE";
        else if (availabilityRate < 94) status = "BREAKDOWN_UNPLANNED";

        let primaryCause = "Routine Stoppage";
        let maxCount = 0;
        data.causes.forEach((cnt, c) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            primaryCause = c;
          }
        });

        return {
          workCenterId: wcId,
          machineName: data.name,
          assetId: data.assetId,
          totalPlannedHours: plannedHoursPerMachine,
          totalDowntimeHours: downtimeHours,
          totalOperatingHours: operatingHours,
          availabilityRate,
          incidentCount: data.incidentsCount,
          mtbfHours,
          mttrHours,
          status,
          primaryCause,
          financialImpactPhp: Math.round(data.financialLoss),
        };
      }
    ).sort((a, b) => b.totalDowntimeHours - a.totalDowntimeHours);

    const categories: DowntimeCategoryBreakdown[] = Array.from(catAggMap.entries()).map(
      ([cat, data]) => ({
        category: cat,
        label: data.label,
        totalHours: Number((data.mins / 60).toFixed(1)),
        totalIncidents: data.count,
        percentageOfTotal: totalDowntimeMins > 0 ? Number(((data.mins / totalDowntimeMins) * 100).toFixed(1)) : 0,
        totalFinancialLoss: Math.round(data.loss),
      })
    ).sort((a, b) => b.totalHours - a.totalHours);

    const totalMachines = machines.length || 1;
    const totalPlannedAll = plannedHoursPerMachine * totalMachines;
    const totalDowntimeHours = Number((totalDowntimeMins / 60).toFixed(1));
    const overallAvailabilityRate = totalPlannedAll > 0
      ? Number((((totalPlannedAll - totalDowntimeHours) / totalPlannedAll) * 100).toFixed(1))
      : 100;

    const avgMtbf = Number((machines.reduce((acc, m) => acc + m.mtbfHours, 0) / totalMachines).toFixed(1));
    const avgMttr = Number((machines.reduce((acc, m) => acc + m.mttrHours, 0) / totalMachines).toFixed(1));
    const targetAvailabilityRate = 95.0;

    const topMachine = machines[0];
    const topCategory = categories[0];

    const kpis: MachineDowntimeKpis = {
      totalDowntimeHours,
      overallAvailabilityRate,
      targetAvailabilityRate,
      isTargetMet: overallAvailabilityRate >= targetAvailabilityRate,
      totalDowntimeIncidents: incidents.length,
      mtbfAverageHours: avgMtbf,
      mttrAverageHours: avgMttr,
      estimatedFinancialLoss: Math.round(totalFinancialLoss),
      topDowntimeMachine: topMachine?.machineName || "None",
      topDowntimeMachineHours: topMachine?.totalDowntimeHours || 0,
      primaryDowntimeCause: topCategory?.label || "General Stoppage",
      monitoredMachinesCount: totalMachines,
      activeBreakdownsCount,
    };

    const responseData: MachineDowntimeResponse = {
      kpis,
      machines,
      incidents,
      categories,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    memoryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Machine Downtime Route] Handler failed:", error);
    return NextResponse.json(FALLBACK_MACHINE_DOWNTIME_DATA, { status: 200 });
  }
}

