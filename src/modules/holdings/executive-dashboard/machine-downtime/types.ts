export type MachineOperatingStatus =
  | "OPERATIONAL"
  | "UNDER_MAINTENANCE"
  | "STANDBY"
  | "BREAKDOWN_UNPLANNED";

export type DowntimeCategory =
  | "MECHANICAL_BREAKDOWN"
  | "ELECTRICAL_SENSOR"
  | "PREVENTIVE_MAINTENANCE"
  | "CHANGEOVER_TOOLING"
  | "PROCESS_BLOCKAGE"
  | "OPERATOR_STARVATION";

export interface MachineDowntimeIncident {
  id: number;
  workCenterId: number;
  machineName: string;
  assetId?: number;
  category: DowntimeCategory;
  categoryLabel: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  durationHours: number;
  status: "RESOLVED" | "IN_PROGRESS";
  rootCause: string;
  correctiveAction?: string;
  technicianName?: string;
  financialLossPhp: number;
  affectedProduct?: string;
}

export interface MachineAssetSummary {
  workCenterId: number;
  machineName: string;
  assetId: number;
  totalPlannedHours: number;
  totalDowntimeHours: number;
  totalOperatingHours: number;
  availabilityRate: number; // ((operating / planned) * 100)
  incidentCount: number;
  mtbfHours: number; // Mean Time Between Failures
  mttrHours: number; // Mean Time To Repair
  status: MachineOperatingStatus;
  primaryCause: string;
  financialImpactPhp: number;
}

export interface DowntimeCategoryBreakdown {
  category: DowntimeCategory;
  label: string;
  totalHours: number;
  totalIncidents: number;
  percentageOfTotal: number;
  totalFinancialLoss: number;
}

export interface MachineDowntimeKpis {
  totalDowntimeHours: number;
  overallAvailabilityRate: number; // % (e.g. 96.4%)
  targetAvailabilityRate: number; // % (e.g. 95.0%)
  isTargetMet: boolean;
  totalDowntimeIncidents: number;
  mtbfAverageHours: number;
  mttrAverageHours: number;
  estimatedFinancialLoss: number; // in PHP
  topDowntimeMachine: string;
  topDowntimeMachineHours: number;
  primaryDowntimeCause: string;
  monitoredMachinesCount: number;
  activeBreakdownsCount: number;
}

export interface MachineDowntimeResponse {
  kpis: MachineDowntimeKpis;
  machines: MachineAssetSummary[];
  incidents: MachineDowntimeIncident[];
  categories: DowntimeCategoryBreakdown[];
  startDate: string;
  endDate: string;
  generatedAt: string;
  isFallback?: boolean;
}

export interface FetchMachineDowntimeParams {
  groupId: number | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  force?: boolean;
}

