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

export interface DpcFactorProvenance {
  factor: string;
  value?: number;
  unit: string;
  source?: string | null;
  geography?: string | null;
  referenceYear?: number | null;
  dataQuality?: DpcConfidence;
}

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
  factorProvenance?: DpcFactorProvenance;
  notes?: string;
}

export interface DpcCloudInput {
  category: "data-centres-servers" | "networking";
  serviceName: string;
  annualEmissionsKgCO2e: number;
  source: string;
  confidence: DpcConfidence;
  factorProvenance?: DpcFactorProvenance;
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
  factorProvenance?: DpcFactorProvenance[];
  notes?: string;
}

export interface DpcWebsiteUseInput {
  averagePageSizeKB: number;
  annualVisits: number;
  averageDownloadSizeMB: number;
  annualDownloads: number;
  fixedLineIntensityKWhPerGB: number;
  mobileIntensityKWhPerGB: number;
  fixedLineIntensitySource: string;
  mobileIntensitySource: string;
  meanGlobalGridFactorKgCO2ePerKWh: number;
  gridFactorSource: string;
  factorProvenance?: DpcFactorProvenance[];
}

export interface DpcTravelInput {
  description: string;
  emissionsTCO2e?: number;
  emissionsKgCO2e?: number;
  source: string;
  factorProvenance?: DpcFactorProvenance;
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
  factorProvenance?: DpcFactorProvenance;
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
  factorProvenance?: DpcFactorProvenance[];
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
    factorProvenance?: DpcFactorProvenance[];
  } | null;
  travel: Array<{ description: string; emissionsKgCO2e: number; source: string; factorProvenance?: DpcFactorProvenance; notes?: string }>;
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

function requireFiniteResult(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} produced a non-finite result.`);
  }
}

function validateCategory(category: DpcActivityCategory): void {
  if (!CATEGORIES.includes(category)) {
    throw new RangeError("Unsupported DPC activity category.");
  }
}

function requireText(name: string, value: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function validateConfidence(confidence: DpcConfidence): void {
  if (!["high", "medium", "low"].includes(confidence)) {
    throw new RangeError("confidence must be high, medium, or low.");
  }
}

const KNOWN_FACTOR_UNITS: Record<string, string> = {
  "electricity-grid": "kgCO2e/kWh",
  "network-energy-intensity": "kWh/GB",
  "fixed-line-network-intensity": "kWh/GB",
  "mobile-network-intensity": "kWh/GB",
  "mean-global-grid": "kgCO2e/kWh",
  "provider-reported-emissions": "kgCO2e/year",
  "travel-emissions-calculation": "kgCO2e",
};

function validateFactorProvenance(entry: DpcFactorProvenance): void {
  requireText("factorProvenance.factor", entry.factor);
  requireText("factorProvenance.unit", entry.unit);
  const expectedUnit = KNOWN_FACTOR_UNITS[entry.factor];
  if (expectedUnit && entry.unit !== expectedUnit) {
    throw new RangeError(`factorProvenance.unit for ${entry.factor} must be ${expectedUnit}.`);
  }
  if (entry.value !== undefined) requireNonNegative("factorProvenance.value", entry.value);
  if (entry.source !== undefined && entry.source !== null) requireText("factorProvenance.source", entry.source);
  if (entry.geography !== undefined && entry.geography !== null) requireText("factorProvenance.geography", entry.geography);
  if (entry.referenceYear !== undefined && entry.referenceYear !== null) {
    if (!Number.isInteger(entry.referenceYear) || entry.referenceYear < 1) {
      throw new RangeError("factorProvenance.referenceYear must be a positive integer.");
    }
  }
  if (entry.dataQuality !== undefined) validateConfidence(entry.dataQuality);
}

function validateOptionalFactorProvenance(
  provenance: DpcFactorProvenance | DpcFactorProvenance[] | undefined,
): void {
  if (Array.isArray(provenance)) provenance.forEach(validateFactorProvenance);
  else if (provenance !== undefined) validateFactorProvenance(provenance);
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
  requireText("machineName", input.machineName);
  requireText("gridFactorSource", input.gridFactorSource);
  requireText("source", input.source);
  validateConfidence(input.confidence);
  validateOptionalFactorProvenance(input.factorProvenance);

  const serverPowerW = ((input.maxPowerW - input.idlePowerW) * input.meanUtilisation) + input.idlePowerW;
  const storagePowerW = input.storageCapacityTB * input.storageEnergyWhPerTBh;
  const combinedPowerW = serverPowerW + storagePowerW;
  const annualEnergyKWh = (combinedPowerW * 24 * 365 / 1000) * input.pue;
  const emissionsKgCO2e = annualEnergyKWh * input.gridFactorKgCO2ePerKWh;
  for (const [name, value] of Object.entries({ serverPowerW, storagePowerW, combinedPowerW, annualEnergyKWh, emissionsKgCO2e })) {
    requireFiniteResult(name, value);
  }

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
    factorProvenance: input.factorProvenance,
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
  requireText("activityName", input.activityName);
  requireText("gridFactorSource", input.gridFactorSource);
  requireText("source", input.source);
  validateConfidence(input.confidence);
  validateOptionalFactorProvenance(input.factorProvenance);

  const dataVolumeGBPerDay = (input.transmittedMBPerDay + input.receivedMBPerDay) / 1000;
  // Deliberately preserve the source workbook's 365/12 multiplier for parity.
  const emissionsKgCO2e = dataVolumeGBPerDay * (365 / 12)
    * input.networkEnergyIntensityKWhPerGB * input.gridFactorKgCO2ePerKWh;
  for (const [name, value] of Object.entries({ dataVolumeGBPerDay, emissionsKgCO2e })) {
    requireFiniteResult(name, value);
  }

  return {
    category: input.category,
    activityName: input.activityName,
    dataVolumeGBPerDay,
    networkEnergyIntensityKWhPerGB: input.networkEnergyIntensityKWhPerGB,
    gridFactorKgCO2ePerKWh: input.gridFactorKgCO2ePerKWh,
    gridFactorSource: input.gridFactorSource,
    factorProvenance: input.factorProvenance,
    emissionsKgCO2e,
    source: input.source,
    confidence: input.confidence,
    notes: input.notes,
  };
}

export function calculateWebsiteUse(input: DpcWebsiteUseInput) {
  for (const [name, value] of Object.entries({
    averagePageSizeKB: input.averagePageSizeKB,
    annualVisits: input.annualVisits,
    averageDownloadSizeMB: input.averageDownloadSizeMB,
    annualDownloads: input.annualDownloads,
    fixedLineIntensityKWhPerGB: input.fixedLineIntensityKWhPerGB,
    mobileIntensityKWhPerGB: input.mobileIntensityKWhPerGB,
    meanGlobalGridFactorKgCO2ePerKWh: input.meanGlobalGridFactorKgCO2ePerKWh,
  })) requireNonNegative(name, value);
  requireText("fixedLineIntensitySource", input.fixedLineIntensitySource);
  requireText("mobileIntensitySource", input.mobileIntensitySource);
  requireText("gridFactorSource", input.gridFactorSource);
  validateOptionalFactorProvenance(input.factorProvenance);
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
  const lowEmissionsKgCO2e = dataVolumeGB * lowIntensityKWhPerGB * input.meanGlobalGridFactorKgCO2ePerKWh;
  const highEmissionsKgCO2e = dataVolumeGB * highIntensityKWhPerGB * input.meanGlobalGridFactorKgCO2ePerKWh;
  for (const [name, value] of Object.entries({
    dataVolumeGB, midpointIntensityKWhPerGB, networkEnergyKWh, lowIntensityKWhPerGB,
    highIntensityKWhPerGB, emissionsKgCO2e, lowEmissionsKgCO2e, highEmissionsKgCO2e,
  })) requireFiniteResult(name, value);
  return {
    dataVolumeGB,
    midpointIntensityKWhPerGB,
    networkEnergyKWh,
    lowIntensityKWhPerGB,
    highIntensityKWhPerGB,
    lowEmissionsKgCO2e,
    highEmissionsKgCO2e,
    emissionsKgCO2e,
    fixedLineIntensitySource: input.fixedLineIntensitySource,
    mobileIntensitySource: input.mobileIntensitySource,
    meanGlobalGridFactorKgCO2ePerKWh: input.meanGlobalGridFactorKgCO2ePerKWh,
    gridFactorSource: input.gridFactorSource,
    factorProvenance: input.factorProvenance,
  };
}

export function calculateTravelRow(input: DpcTravelInput) {
  const hasTonnes = input.emissionsTCO2e !== undefined;
  const hasKilograms = input.emissionsKgCO2e !== undefined;
  if (hasTonnes === hasKilograms) {
    throw new TypeError("Provide exactly one of emissionsTCO2e or emissionsKgCO2e.");
  }
  requireText("description", input.description);
  requireText("source", input.source);
  validateOptionalFactorProvenance(input.factorProvenance);
  const value = hasTonnes ? input.emissionsTCO2e! * 1000 : input.emissionsKgCO2e!;
  requireNonNegative("travel emissions", value);
  requireFiniteResult("travel emissions", value);
  return {
    description: input.description,
    emissionsKgCO2e: value,
    source: input.source,
    factorProvenance: input.factorProvenance,
    notes: input.notes,
  };
}

export function calculateDpcV1(input: DpcCalculationInput): DpcCalculationResult {
  const onPremise = (input.onPremise ?? []).map(calculateOnPremiseRow);
  const cloud = input.cloud ?? [];
  for (const row of cloud) {
    if (row.category !== "data-centres-servers" && row.category !== "networking") {
      throw new RangeError("Unsupported cloud emissions category.");
    }
    requireNonNegative("annualEmissionsKgCO2e", row.annualEmissionsKgCO2e);
    requireText("serviceName", row.serviceName);
    requireText("source", row.source);
    validateConfidence(row.confidence);
    validateOptionalFactorProvenance(row.factorProvenance);
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
  for (const [name, value] of Object.entries({
    onPremiseKgCO2e, cloudDataCentresServersKgCO2e, cloudNetworkingKgCO2e,
    networkingOnPremiseKgCO2e, websiteUseKgCO2e, travelKgCO2e, totalKgCO2e,
  })) requireFiniteResult(name, value);

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
