import type {
  MachineDowntimeResponse,
  FetchMachineDowntimeParams,
} from "../types";

export const FALLBACK_MACHINE_DOWNTIME_DATA: MachineDowntimeResponse = {
  kpis: {
    totalDowntimeHours: 41.5,
    overallAvailabilityRate: 96.4,
    targetAvailabilityRate: 95.0,
    isTargetMet: true,
    totalDowntimeIncidents: 14,
    mtbfAverageHours: 124.6,
    mttrAverageHours: 2.1,
    estimatedFinancialLoss: 184500,
    topDowntimeMachine: "Noodle Packaging Machine",
    topDowntimeMachineHours: 10.5,
    primaryDowntimeCause: "Conveyor Jam & Optical Sensor Calibration",
    monitoredMachinesCount: 8,
    activeBreakdownsCount: 1,
  },
  machines: [
    {
      workCenterId: 337,
      machineName: "Noodle Packaging Machine",
      assetId: 209,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 10.5,
      totalOperatingHours: 149.5,
      availabilityRate: 93.4,
      incidentCount: 4,
      mtbfHours: 37.4,
      mttrHours: 2.6,
      status: "UNDER_MAINTENANCE",
      primaryCause: "Film Feed Jam & Cutter Wear",
      financialImpactPhp: 48500,
    },
    {
      workCenterId: 336,
      machineName: "INDUSTRIAL STEAM CONVEYOR",
      assetId: 195,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 7.0,
      totalOperatingHours: 153.0,
      availabilityRate: 95.6,
      incidentCount: 2,
      mtbfHours: 76.5,
      mttrHours: 3.5,
      status: "OPERATIONAL",
      primaryCause: "Steam Pressure Regulator Valve Flange",
      financialImpactPhp: 38000,
    },
    {
      workCenterId: 324,
      machineName: "Deep Frying & Dehydration Station",
      assetId: 213,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 6.0,
      totalOperatingHours: 154.0,
      availabilityRate: 96.3,
      incidentCount: 2,
      mtbfHours: 77.0,
      mttrHours: 3.0,
      status: "OPERATIONAL",
      primaryCause: "Burner Nozzle Carbon Clearance",
      financialImpactPhp: 31000,
    },
    {
      workCenterId: 318,
      machineName: "Bottle Closure & Sealing Station",
      assetId: 232,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 5.5,
      totalOperatingHours: 154.5,
      availabilityRate: 96.6,
      incidentCount: 2,
      mtbfHours: 77.3,
      mttrHours: 2.8,
      status: "OPERATIONAL",
      primaryCause: "Induction Sealer Coil Recalibration",
      financialImpactPhp: 24000,
    },
    {
      workCenterId: 335,
      machineName: "Mixing Machine (Dough Prep)",
      assetId: 192,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 4.5,
      totalOperatingHours: 155.5,
      availabilityRate: 97.2,
      incidentCount: 1,
      mtbfHours: 155.5,
      mttrHours: 4.5,
      status: "OPERATIONAL",
      primaryCause: "Drive Belt Tension Adjustment & Greasing",
      financialImpactPhp: 18000,
    },
    {
      workCenterId: 323,
      machineName: "Rotary Filling & Dispensing Station",
      assetId: 237,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 3.5,
      totalOperatingHours: 156.5,
      availabilityRate: 97.8,
      incidentCount: 1,
      mtbfHours: 156.5,
      mttrHours: 3.5,
      status: "OPERATIONAL",
      primaryCause: "Fill Nozzle O-Ring Seal Replacement",
      financialImpactPhp: 12500,
    },
    {
      workCenterId: 330,
      machineName: "Noodle Forming & Extrusion Station",
      assetId: 193,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 2.5,
      totalOperatingHours: 157.5,
      availabilityRate: 98.4,
      incidentCount: 1,
      mtbfHours: 157.5,
      mttrHours: 2.5,
      status: "OPERATIONAL",
      primaryCause: "Die Plate Flush & Changeover",
      financialImpactPhp: 8500,
    },
    {
      workCenterId: 316,
      machineName: "Batch Coding & Date Printing Station",
      assetId: 200,
      totalPlannedHours: 160.0,
      totalDowntimeHours: 2.0,
      totalOperatingHours: 158.0,
      availabilityRate: 98.8,
      incidentCount: 1,
      mtbfHours: 158.0,
      mttrHours: 2.0,
      status: "OPERATIONAL",
      primaryCause: "Printhead Solvent Purge & Alignment",
      financialImpactPhp: 4000,
    },
  ],
  incidents: [
    {
      id: 101,
      workCenterId: 337,
      machineName: "Noodle Packaging Machine",
      assetId: 209,
      category: "MECHANICAL_BREAKDOWN",
      categoryLabel: "Mechanical Breakdown",
      startedAt: "2026-11-04T09:15:00Z",
      endedAt: "2026-11-04T12:45:00Z",
      durationMinutes: 210,
      durationHours: 3.5,
      status: "RESOLVED",
      rootCause: "Rotary knife blade misalignment led to pouch jamming and cutter stall.",
      correctiveAction: "Replaced dull blade pair and recalibrated photocell sensor positioning.",
      technicianName: "Engr. Ronald Macaraeg",
      financialLossPhp: 18500,
      affectedProduct: "Mama Pina's Bihon 454g x 20",
    },
    {
      id: 102,
      workCenterId: 336,
      machineName: "INDUSTRIAL STEAM CONVEYOR",
      assetId: 195,
      category: "PREVENTIVE_MAINTENANCE",
      categoryLabel: "Preventive Maintenance",
      startedAt: "2026-11-03T14:00:00Z",
      endedAt: "2026-11-03T17:30:00Z",
      durationMinutes: 210,
      durationHours: 3.5,
      status: "RESOLVED",
      rootCause: "Scheduled descaling and replacement of steam trap regulator valves.",
      correctiveAction: "Cleaned heat transfer coils, renewed gasket seals, tested at 6 bar.",
      technicianName: "Engr. Dante Bautista",
      financialLossPhp: 22000,
      affectedProduct: "Noodle Steaming & Cooking Line",
    },
    {
      id: 103,
      workCenterId: 324,
      machineName: "Deep Frying & Dehydration Station",
      assetId: 213,
      category: "PROCESS_BLOCKAGE",
      categoryLabel: "Process Blockage & Slag",
      startedAt: "2026-11-03T08:30:00Z",
      endedAt: "2026-11-03T11:30:00Z",
      durationMinutes: 180,
      durationHours: 3.0,
      status: "RESOLVED",
      rootCause: "Continuous fryer sediment scraper jam caused oil level sensor false alarm.",
      correctiveAction: "Cleared crumb accumulation from bottom sump, washed filters.",
      technicianName: "Tech. Leo Santos",
      financialLossPhp: 16000,
      affectedProduct: "Crispy Canton Noodles 250g",
    },
    {
      id: 104,
      workCenterId: 318,
      machineName: "Bottle Closure & Sealing Station",
      assetId: 232,
      category: "ELECTRICAL_SENSOR",
      categoryLabel: "Electrical & Sensor Fault",
      startedAt: "2026-11-02T10:00:00Z",
      endedAt: "2026-11-02T12:45:00Z",
      durationMinutes: 165,
      durationHours: 2.75,
      status: "RESOLVED",
      rootCause: "Induction cap sealer cooling water flow switch tripped inverter.",
      correctiveAction: "Flushed chiller heat exchanger and replaced flow sensor reed switch.",
      technicianName: "Engr. Ronald Macaraeg",
      financialLossPhp: 14000,
      affectedProduct: "Mama Pina's Palm Oil 1L x 12",
    },
    {
      id: 105,
      workCenterId: 337,
      machineName: "Noodle Packaging Machine",
      assetId: 209,
      category: "ELECTRICAL_SENSOR",
      categoryLabel: "Electrical & Sensor Fault",
      startedAt: "2026-11-05T06:30:00Z",
      endedAt: undefined,
      durationMinutes: 150,
      durationHours: 2.5,
      status: "IN_PROGRESS",
      rootCause: "Intermittent eye-mark tracking error causing seal drift on printed rollstock.",
      correctiveAction: "Diagnostic in progress: testing optical sensor gain and motor servo drive.",
      technicianName: "Tech. Mark Villanueva",
      financialLossPhp: 12000,
      affectedProduct: "Mama Pina's Bihon 454g x 6",
    },
  ],
  categories: [
    {
      category: "MECHANICAL_BREAKDOWN",
      label: "Mechanical Breakdown",
      totalHours: 14.5,
      totalIncidents: 5,
      percentageOfTotal: 34.9,
      totalFinancialLoss: 68500,
    },
    {
      category: "ELECTRICAL_SENSOR",
      label: "Electrical & Sensor Fault",
      totalHours: 10.5,
      totalIncidents: 4,
      percentageOfTotal: 25.3,
      totalFinancialLoss: 45000,
    },
    {
      category: "PREVENTIVE_MAINTENANCE",
      label: "Preventive Maintenance",
      totalHours: 8.0,
      totalIncidents: 2,
      percentageOfTotal: 19.3,
      totalFinancialLoss: 40000,
    },
    {
      category: "PROCESS_BLOCKAGE",
      label: "Process Blockage & Slag",
      totalHours: 6.0,
      totalIncidents: 2,
      percentageOfTotal: 14.5,
      totalFinancialLoss: 22500,
    },
    {
      category: "CHANGEOVER_TOOLING",
      label: "Changeover & Tooling",
      totalHours: 2.5,
      totalIncidents: 1,
      percentageOfTotal: 6.0,
      totalFinancialLoss: 8500,
    },
  ],
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  generatedAt: new Date().toISOString(),
  isFallback: true,
};

const clientCache = new Map<string, { data: MachineDowntimeResponse; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 20000;

export async function fetchMachineDowntime(
  params: FetchMachineDowntimeParams
): Promise<MachineDowntimeResponse> {
  const { groupId, startDate, endDate, category, status, force } = params;

  const q = new URLSearchParams();
  if (startDate) q.set("startDate", startDate);
  if (endDate) q.set("endDate", endDate);
  if (category) q.set("category", category);
  if (status) q.set("status", status);
  if (force) q.set("force", "true");

  const url = `/api/holdings/executive-dashboard/manufacturing/${groupId}/downtime?${q.toString()}`;
  const cacheKey = `${groupId}_${startDate || ""}_${endDate || ""}_${category || ""}_${status || ""}`;

  if (!force && clientCache.has(cacheKey)) {
    const entry = clientCache.get(cacheKey)!;
    if (Date.now() - entry.timestamp < CLIENT_CACHE_TTL_MS) {
      return entry.data;
    }
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchMachineDowntime] API returned status ${res.status}`);
      return FALLBACK_MACHINE_DOWNTIME_DATA;
    }

    const data: MachineDowntimeResponse = await res.json();
    clientCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("[fetchMachineDowntime] Network error, using fallback:", error);
    return FALLBACK_MACHINE_DOWNTIME_DATA;
  }
}

