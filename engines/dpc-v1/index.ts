/**
 * Independent implementation of DPC Carbon Footprint Calculation Tool v1.0.
 *
 * The functions below reproduce workbook calculation behaviour. They do not
 * include or redistribute DPC's workbook, default factor tables, or graphics.
 * See FORMULA-MAP.md for formula provenance and known workbook limitations.
 */

export type DpcActivityCategory =
  | "acquisition-transfer-ingest"
  | "bitstream-preservation"
  | "content-preservation"
  | "metadata-management"
  | "discovery-access";

export type DpcConfidence = "high" | "medium" | "low";

export interface DpcOnPremiseInput {
  category: DpcActivityCategory;
  machineName: string;
  idlePowerW: number;
  maxPowerW: number;
  meanUtilisation: number;
  storageCapacityTB: number;
  storageEnergyWhPerTBh: number;
  pue: number;
  gridFactorKgCO2ePerKWh: number;
  gridFactorSource: string;
  source: string;
  confidence: DpcConfidence;
  notes?: string;
}

export interface DpcCloudInput {
  category: "data-centres-servers" | "networking";
  serviceName: string;
  annualEmissionsKgCO2e: number;
  source: string;
  confidence: DpcConfidence;
  notes?: string;
}

export interface DpcNetworkingInput {
  category: DpcActivityCategory;
  activityName: string;
  transmittedMBPerDay: number;
  receivedMBPerDay: number;
  networkEnergyIntensityKWhPerGB: number;
  gridFactorKgCO2ePerKWh: number;
  gridFactorSource: string;
  source: string;
  confidence: DpcConfidence;
  notes?: string;
}

export interface DpcWebsiteUseInput {
  averagePageSizeKB: number;
  annualVisits: number;
  averageDownloadSizeMB: number;
  annualDownloads: number;
  fixedLineIntensityKWhPerGB: number;
  mobileIntensityKWhPerGB: number;
  meanGlobalGridFactorKgCO2ePerKWh: number;
}

export interface DpcTravelInput {
  description: string;
  emissionsTCO2e?: number;
  emissionsKgCO2e?: number;
  source: string;
  notes?: string;
}

export interface DpcCalculationInput {
  onPremise?: DpcOnPremiseInput[];
  cloud?: DpcCloudInput[];
  networking?: DpcNetworkingInput[];
  websiteUse?: DpcWebsiteUseInput;
  travel?: DpcTravelInput[];
}

export interface DpcOnPremiseResult {
  category: DpcActivityCategory;
  machineName: string;
  serverPowerW: number;
  storagePowerW: number;
  combinedPowerW: number;
  annualEnergyKWh: number;
  emissionsKgCO2e: number;
  gridFactorKgCO2ePerKWh: number;
  gridFactorSource: string;
  source: string;
  confidence: DpcConfidence;
  notes?: string;
}

export interface DpcNetworkingResult {
  category: DpcActivityCategory;
  activityName: string;
  dataVolumeGBPerDay: number;
  networkEnergyIntensityKWhPerGB: number;
  gridFactorKgCO2ePerKWh: number;
  gridFactorSource: string;
  emissionsKgCO2e: number;
  source: string;
  confidence: DpcConfidence;
  notes?: string;
}

export interface DpcCalculationResult {
  method: "dpc-carbon-footprint-toolkit";
  version: "1.0";
  referencePeriod: "1 year";
  limitations: string[];
  onPremise: DpcOnPremiseResult[];
  cloud: DpcCloudInput[];
  networking: DpcNetworkingResult[];
  websiteUse: {
    dataVolumeGB: number;
    midpointIntensityKWhPerGB: number;
    networkEnergyKWh: number;
    lowIntensityKWhPerGB: number;
    highIntensityKWhPerGB: number;
    lowEmissionsKgCO2e: number;
    highEmissionsKgCO2e: number;
    emissionsKgCO2e: number;
  } | null;
  travel: Array<{ description: string; emissionsKgCO2e: number; source: string; notes?: string }>;
  totals: {
    onPremiseKgCO2e: number;
    cloudDataCentresServersKgCO2e: number;
    cloudNetworkingKgCO2e: number;
    networkingOnPremiseKgCO2e: number;
    websiteUseKgCO2e: number;
    travelKgCO2e: number;
    totalKgCO2e: number;
  };
}

const CATEGORIES: DpcActivityCategory[] = [
  "acquisition-transfer-ingest",
  "bitstream-preservation",
  "content-preservation",
  "metadata-management",
  "discovery-access",
];

function requireNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number.`);
  }
}

function validateCategory(category: DpcActivityCategory): void {
  if (!CATEGORIES.includes(category)) {
    throw new RangeError("Unsupported DPC activity category.");
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateOnPremiseRow(input: DpcOnPremiseInput): DpcOnPremiseResult {
  validateCategory(input.category);
  for (const [name, value] of Object.entries({
    idlePowerW: input.idlePowerW,
    maxPowerW: input.maxPowerW,
    meanUtilisation: input.meanUtilisation,
    storageCapacityTB: input.storageCapacityTB,
    storageEnergyWhPerTBh: input.storageEnergyWhPerTBh,
    pue: input.pue,
    gridFactorKgCO2ePerKWh: input.gridFactorKgCO2ePerKWh,
  })) requireNonNegative(name, value);
  if (input.maxPowerW < input.idlePowerW) throw new RangeError("maxPowerW cannot be lower than idlePowerW.");
  if (input.meanUtilisation > 1) throw new RangeError("meanUtilisation must be a fraction between 0 and 1.");
  if (input.pue <= 0) throw new RangeError("pue must be greater than zero.");
  if (!input.gridFactorSource.trim() || !input.source.trim()) throw new TypeError("Factor source and activity source are required.");

  const serverPowerW = ((input.maxPowerW - input.idlePowerW) * input.meanUtilisation) + input.idlePowerW;
  const storagePowerW = input.storageCapacityTB * input.storageEnergyWhPerTBh;
  const combinedPowerW = serverPowerW + storagePowerW;
  const annualEnergyKWh = (combinedPowerW * 24 * 365 / 1000) * input.pue;
  const emissionsKgCO2e = annualEnergyKWh * input.gridFactorKgCO2ePerKWh;

  return {
    category: input.category,
    machineName: input.machineName,
    serverPowerW,
    storagePowerW,
    combinedPowerW,
    annualEnergyKWh,
    emissionsKgCO2e,
    gridFactorKgCO2ePerKWh: input.gridFactorKgCO2ePerKWh,
    gridFactorSource: input.gridFactorSource,
    source: input.source,
    confidence: input.confidence,
    notes: input.notes,
  };
}

export function calculateNetworkingRow(input: DpcNetworkingInput): DpcNetworkingResult {
  validateCategory(input.category);
  for (const [name, value] of Object.entries({
    transmittedMBPerDay: input.transmittedMBPerDay,
    receivedMBPerDay: input.receivedMBPerDay,
    networkEnergyIntensityKWhPerGB: input.networkEnergyIntensityKWhPerGB,
    gridFactorKgCO2ePerKWh: input.gridFactorKgCO2ePerKWh,
  })) requireNonNegative(name, value);
  if (!input.gridFactorSource.trim() || !input.source.trim()) throw new TypeError("Factor source and activity source are required.");

  const dataVolumeGBPerDay = (input.transmittedMBPerDay + input.receivedMBPerDay) / 1000;
  // Deliberately preserve the source workbook's 365/12 multiplier for parity.
  const emissionsKgCO2e = dataVolumeGBPerDay * (365 / 12)
    * input.networkEnergyIntensityKWhPerGB * input.gridFactorKgCO2ePerKWh;

  return {
    category: input.category,
    activityName: input.activityName,
    dataVolumeGBPerDay,
    networkEnergyIntensityKWhPerGB: input.networkEnergyIntensityKWhPerGB,
    gridFactorKgCO2ePerKWh: input.gridFactorKgCO2ePerKWh,
    gridFactorSource: input.gridFactorSource,
    emissionsKgCO2e,
    source: input.source,
    confidence: input.confidence,
    notes: input.notes,
  };
}

export function calculateWebsiteUse(input: DpcWebsiteUseInput) {
  for (const [name, value] of Object.entries(input)) requireNonNegative(name, value);
  const dataVolumeGB = (
    (input.averagePageSizeKB / 1000) * input.annualVisits
    + input.averageDownloadSizeMB * input.annualDownloads
  ) / 1000;
  const midpointIntensityKWhPerGB = (
    input.fixedLineIntensityKWhPerGB + input.mobileIntensityKWhPerGB
  ) / 2;
  const networkEnergyKWh = dataVolumeGB * midpointIntensityKWhPerGB;
  const emissionsKgCO2e = networkEnergyKWh * input.meanGlobalGridFactorKgCO2ePerKWh;
  const lowIntensityKWhPerGB = Math.min(input.fixedLineIntensityKWhPerGB, input.mobileIntensityKWhPerGB);
  const highIntensityKWhPerGB = Math.max(input.fixedLineIntensityKWhPerGB, input.mobileIntensityKWhPerGB);
  return {
    dataVolumeGB,
    midpointIntensityKWhPerGB,
    networkEnergyKWh,
    lowIntensityKWhPerGB,
    highIntensityKWhPerGB,
    lowEmissionsKgCO2e: dataVolumeGB * lowIntensityKWhPerGB * input.meanGlobalGridFactorKgCO2ePerKWh,
    highEmissionsKgCO2e: dataVolumeGB * highIntensityKWhPerGB * input.meanGlobalGridFactorKgCO2ePerKWh,
    emissionsKgCO2e,
  };
}

export function calculateTravelRow(input: DpcTravelInput) {
  const hasTonnes = input.emissionsTCO2e !== undefined;
  const hasKilograms = input.emissionsKgCO2e !== undefined;
  if (hasTonnes === hasKilograms) {
    throw new TypeError("Provide exactly one of emissionsTCO2e or emissionsKgCO2e.");
  }
  if (!input.source.trim()) throw new TypeError("Travel emissions source is required.");
  const value = hasTonnes ? input.emissionsTCO2e! * 1000 : input.emissionsKgCO2e!;
  requireNonNegative("travel emissions", value);
  return {
    description: input.description,
    emissionsKgCO2e: value,
    source: input.source,
    notes: input.notes,
  };
}

export function calculateDpcV1(input: DpcCalculationInput): DpcCalculationResult {
  const onPremise = (input.onPremise ?? []).map(calculateOnPremiseRow);
  const cloud = input.cloud ?? [];
  for (const row of cloud) {
    requireNonNegative("annualEmissionsKgCO2e", row.annualEmissionsKgCO2e);
    if (!row.source.trim()) throw new TypeError("Cloud emissions source is required.");
  }
  const networking = (input.networking ?? []).map(calculateNetworkingRow);
  const websiteUse = input.websiteUse ? calculateWebsiteUse(input.websiteUse) : null;
  const travel = (input.travel ?? []).map(calculateTravelRow);

  const onPremiseKgCO2e = sum(onPremise.map((row) => row.emissionsKgCO2e));
  const cloudDataCentresServersKgCO2e = sum(cloud.filter((row) => row.category === "data-centres-servers").map((row) => row.annualEmissionsKgCO2e));
  const cloudNetworkingKgCO2e = sum(cloud.filter((row) => row.category === "networking").map((row) => row.annualEmissionsKgCO2e));
  const networkingOnPremiseKgCO2e = sum(networking.map((row) => row.emissionsKgCO2e));
  const websiteUseKgCO2e = websiteUse?.emissionsKgCO2e ?? 0;
  const travelKgCO2e = sum(travel.map((row) => row.emissionsKgCO2e));
  const totalKgCO2e = onPremiseKgCO2e + cloudDataCentresServersKgCO2e
    + cloudNetworkingKgCO2e + networkingOnPremiseKgCO2e
    + websiteUseKgCO2e + travelKgCO2e;

  return {
    method: "dpc-carbon-footprint-toolkit",
    version: "1.0",
    referencePeriod: "1 year",
    limitations: [
      "Indicative estimate only; not for formal carbon reporting, compliance, or audited disclosure.",
      "Embodied carbon is not included by the source workbook.",
      "Networking preserves the source workbook's 365/12 multiplier for calculation parity.",
      "Emission factors and proxy assumptions must be documented with their source, geography, and reference period.",
    ],
    onPremise,
    cloud,
    networking,
    websiteUse,
    travel,
    totals: {
      onPremiseKgCO2e,
      cloudDataCentresServersKgCO2e,
      cloudNetworkingKgCO2e,
      networkingOnPremiseKgCO2e,
      websiteUseKgCO2e,
      travelKgCO2e,
      totalKgCO2e,
    },
  };
}
