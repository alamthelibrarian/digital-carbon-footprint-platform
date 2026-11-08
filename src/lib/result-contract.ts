/**
 * Method-neutral DCFP result envelope.
 *
 * This contract standardises report metadata and traceability only. Native
 * engine outputs and method-specific metrics remain intact and authoritative.
 */
export interface DcfpMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  context?: string;
}

export interface DcfpFactorProvenanceEntry<TProvenance = Record<string, unknown>> {
  location: string;
  provenance: TProvenance;
}

export interface DcfpResultEnvelope<
  TInput,
  TNativeResult,
  TProvenance = Record<string, unknown>,
> {
  schemaVersion: "1.0";
  assessment: {
    id: string;
    createdAt: string;
    title?: string;
  };
  method: {
    id: string;
    version: string;
    name: string;
  };
  scope: {
    subject: string;
    systemBoundary: string;
    functionalUnit: string;
    reportingPeriod: string;
    referencePeriod: string;
    geography?: string;
  };
  inputs: TInput;
  results: {
    native: TNativeResult;
    metrics: DcfpMetric[];
  };
  factorProvenance: DcfpFactorProvenanceEntry<TProvenance>[];
  dataQuality: {
    activityConfidence: string[];
    inputSources: string[];
    factorProvenanceCoverage: "none" | "partial" | "recorded";
  };
  assumptions: string[];
  limitations: string[];
  traceability: {
    engine: string;
    engineVersion: string;
    calculationTimestamp: string;
  };
}
