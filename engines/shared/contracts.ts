/** Stable metadata and result contracts shared by method-specific engines. */
export interface MethodMetadata {
  id: string;
  name: string;
  version: string;
  status: "planned" | "experimental" | "validated" | "deprecated";
  source: string;
}

export interface CalculationContext {
  reportingPeriod: { start: string; end: string };
  functionalUnit: string;
  systemBoundary: string;
  geography: string;
  assumptions: string[];
  dataQualityNotes: string[];
}

export interface EmissionFactorReference {
  value: number;
  unit: string;
  source: string;
  geography?: string;
  period?: string;
  accessedAt?: string;
}

export interface EmissionLine {
  category: string;
  activityDescription: string;
  activityValue: number;
  activityUnit: string;
  factor: EmissionFactorReference;
  emissionsKgCO2e: number;
}

export interface CalculationResult {
  method: MethodMetadata;
  context: CalculationContext;
  totalKgCO2e: number;
  lines: EmissionLine[];
  limitations: string[];
  calculatedAt: string;
}
