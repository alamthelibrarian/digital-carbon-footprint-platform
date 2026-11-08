/**
 * DPC v1.0 adapter to the shared DCFP result envelope.
 *
 * This is a presentation/traceability wrapper only. It does not alter or
 * recalculate the method-specific result returned by the DPC engine.
 */
import type {
  DpcCalculationInput,
  DpcCalculationResult,
  DpcConfidence,
  DpcFactorProvenance,
} from "./index.ts";
import type {
  DcfpMetric,
  DcfpFactorProvenanceEntry,
  DcfpResultEnvelope,
} from "../../src/lib/result-contract.ts";

export interface DpcAssessmentMetadata {
  id: string;
  createdAt: string;
  title?: string;
  subject: string;
  systemBoundary: string;
  functionalUnit: string;
  reportingPeriod: string;
  geography?: string;
}

export type DcfpDpcResultEnvelope = DcfpResultEnvelope<
  DpcCalculationInput,
  DpcCalculationResult,
  DpcFactorProvenance
>;

const validText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validIsoDateTime = (value: string): boolean => {
  if (!validText(value) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
};

export function adaptDpcV1Result(
  input: DpcCalculationInput,
  result: DpcCalculationResult,
  metadata: DpcAssessmentMetadata,
): DcfpDpcResultEnvelope {
  for (const [field, value] of Object.entries({
    id: metadata?.id,
    subject: metadata?.subject,
    systemBoundary: metadata?.systemBoundary,
    functionalUnit: metadata?.functionalUnit,
    reportingPeriod: metadata?.reportingPeriod,
  })) {
    if (!validText(value)) throw new TypeError(`metadata.${field} must be a non-empty string.`);
  }
  if (!validIsoDateTime(metadata.createdAt)) {
    throw new TypeError("metadata.createdAt must be a valid ISO 8601 UTC timestamp.");
  }
  if (metadata.title !== undefined && !validText(metadata.title)) {
    throw new TypeError("metadata.title must be a non-empty string when supplied.");
  }
  if (metadata.geography !== undefined && !validText(metadata.geography)) {
    throw new TypeError("metadata.geography must be a non-empty string when supplied.");
  }
  if (result.method !== "dpc-carbon-footprint-toolkit" || result.version !== "1.0") {
    throw new TypeError("result must be produced by DPC Carbon Footprint Toolkit v1.0.");
  }

  const factorProvenance: DcfpFactorProvenanceEntry<DpcFactorProvenance>[] = [];
  const expectedFactorKeys = new Set<string>();
  const coveredFactorKeys = new Set<string>();
  const hasSource = (item: DpcFactorProvenance): boolean =>
    typeof item.source === "string" && item.source.trim().length > 0;
  const add = (
    location: string,
    value: DpcFactorProvenance | DpcFactorProvenance[] | undefined,
    expectedFactors: string[],
  ) => {
    expectedFactors.forEach((factor) => expectedFactorKeys.add(`${location}:${factor}`));
    const entries = Array.isArray(value) ? value : value ? [value] : [];
    entries.forEach((item, index) => {
      factorProvenance.push({
        location: Array.isArray(value) ? `${location}[${index}]` : location,
        provenance: item,
      });
      if (expectedFactors.includes(item.factor) && hasSource(item)) {
        coveredFactorKeys.add(`${location}:${item.factor}`);
      }
    });
  };

  result.onPremise.forEach((row, index) => add(`onPremise[${index}]`, row.factorProvenance, [
    "electricity-grid", "storage-energy-intensity", "power-usage-effectiveness",
  ]));
  result.cloud.forEach((row, index) => add(`cloud[${index}]`, row.factorProvenance, [
    "provider-reported-emissions",
  ]));
  result.networking.forEach((row, index) => add(`networking[${index}]`, row.factorProvenance, [
    "electricity-grid", "network-energy-intensity",
  ]));
  if (result.websiteUse) add("websiteUse", result.websiteUse.factorProvenance, [
    "fixed-line-network-intensity", "mobile-network-intensity", "mean-global-grid",
  ]);
  result.travel.forEach((row, index) => add(`travel[${index}]`, row.factorProvenance, [
    "travel-emissions-calculation",
  ]));


  const activityConfidence = [
    ...result.onPremise.map((row, index) => `onPremise[${index}]: ${row.confidence}`),
    ...result.cloud.map((row, index) => `cloud[${index}]: ${row.confidence}`),
    ...result.networking.map((row, index) => `networking[${index}]: ${row.confidence}`),
  ];
  const inputSources = [
    ...result.onPremise.map((row, index) => `onPremise[${index}]: ${row.source}`),
    ...result.cloud.map((row, index) => `cloud[${index}]: ${row.source}`),
    ...result.networking.map((row, index) => `networking[${index}]: ${row.source}`),
    ...result.travel.map((row, index) => `travel[${index}]: ${row.source}`),
    ...(input.websiteUse ? [`websiteUse: ${input.websiteUse.activitySource?.trim() || "activity-data source not recorded"}`] : []),
  ];
  // Coverage is matched by expected factor identity per row. Duplicate or
  // unrelated entries cannot compensate for a missing expected factor.
  const factorProvenanceCoverage = coveredFactorKeys.size === 0
    ? "none"
    : coveredFactorKeys.size === expectedFactorKeys.size ? "recorded" : "partial";

  const totals = result.totals;
  const metrics: DcfpMetric[] = [
    { id: "dpc.on-premise", label: "On-premise", value: totals.onPremiseKgCO2e, unit: "kgCO2e" },
    { id: "dpc.cloud-data-centres-servers", label: "Cloud data centres and servers", value: totals.cloudDataCentresServersKgCO2e, unit: "kgCO2e" },
    { id: "dpc.cloud-networking", label: "Cloud networking", value: totals.cloudNetworkingKgCO2e, unit: "kgCO2e" },
    { id: "dpc.on-premise-networking", label: "On-premise networking", value: totals.networkingOnPremiseKgCO2e, unit: "kgCO2e" },
    { id: "dpc.website-use", label: "Website use", value: totals.websiteUseKgCO2e, unit: "kgCO2e" },
    { id: "dpc.travel", label: "Travel", value: totals.travelKgCO2e, unit: "kgCO2e" },
    { id: "dpc.total", label: "DPC total", value: totals.totalKgCO2e, unit: "kgCO2e", context: "Native DPC v1.0 aggregate; not harmonised with other methods." },
  ];

  return {
    schemaVersion: "1.0",
    assessment: {
      id: metadata.id,
      createdAt: metadata.createdAt,
      ...(metadata.title ? { title: metadata.title } : {}),
    },
    method: {
      id: "dpc-carbon-footprint-toolkit",
      version: "1.0",
      name: "DPC Carbon Footprint Toolkit",
    },
    scope: {
      subject: metadata.subject,
      systemBoundary: metadata.systemBoundary,
      functionalUnit: metadata.functionalUnit,
      reportingPeriod: metadata.reportingPeriod,
      referencePeriod: result.referencePeriod,
      ...(metadata.geography ? { geography: metadata.geography } : {}),
    },
    inputs: input,
    results: { native: result, metrics },
    factorProvenance,
    dataQuality: {
      activityConfidence,
      inputSources,
      factorProvenanceCoverage,
    },
    assumptions: [
      "The native calculation and aggregation rules of DPC Carbon Footprint Toolkit v1.0 are preserved.",
      "The reporting period and functional unit are supplied by the assessment author and are not inferred by the adapter.",
      "Missing factor provenance remains missing; no source, geography, year, or quality value is fabricated.",
    ],
    limitations: [...result.limitations],
    traceability: {
      engine: "dpc-v1-typescript",
      engineVersion: "0.1.0",
      calculationTimestamp: metadata.createdAt,
    },
  };
}
