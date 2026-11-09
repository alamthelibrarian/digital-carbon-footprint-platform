import test from "node:test";
import assert from "node:assert/strict";
import { calculateDpcV1 } from "./index.ts";
import { adaptDpcV1Result } from "./result-adapter.ts";

const metadata = {
  id: "assessment-001",
  createdAt: "2026-11-07T08:30:00.000Z",
  title: "Digital preservation assessment",
  subject: "Digital preservation services",
  systemBoundary: "Operational energy and travel included by DPC v1.0 inputs",
  functionalUnit: "One year of the stated digital preservation service",
  reportingPeriod: "2025 calendar year",
  geography: "Example country",
};

test("adapts DPC result without changing native output or total", () => {
  const input = {
    cloud: [{
      category: "data-centres-servers",
      serviceName: "Cloud storage",
      annualEmissionsKgCO2e: 10,
      source: "Provider report",
      confidence: "high",
      factorProvenance: {
        factor: "provider-reported-emissions",
        value: 10,
        unit: "kgCO2e/year",
        source: "Provider report",
        dataKind: "provider-reported",
      },
    }],
    travel: [{
      description: "Work trip",
      emissionsKgCO2e: 5,
      source: "Travel calculator",
    }],
  };
  const native = calculateDpcV1(input);
  const envelope = adaptDpcV1Result(input, native, metadata);

  assert.equal(envelope.schemaVersion, "1.0");
  assert.equal(envelope.method.id, native.method);
  assert.equal(envelope.method.version, native.version);
  assert.deepEqual(envelope.results.native, native);
  assert.equal(envelope.results.metrics.find((metric) => metric.id === "dpc.total")?.value, native.totals.totalKgCO2e);
  assert.equal(envelope.results.metrics.length, 7);
  assert.equal(envelope.factorProvenance.length, 1);
  assert.equal(envelope.factorProvenance[0].location, "cloud[0]");
  assert.equal(envelope.factorProvenance[0].provenance.dataKind, "provider-reported");
  assert.deepEqual(envelope.dataQuality.activityConfidence, ["cloud[0]: high"]);
  assert.deepEqual(envelope.dataQuality.inputSources, ["cloud[0]: Provider report", "travel[0]: Travel calculator"]);
  assert.equal("dataQuality" in envelope.factorProvenance[0].provenance, false);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "partial");
  assert.equal(envelope.traceability.calculationTimestamp, metadata.createdAt);
});

test("records full provenance coverage when every included row has provenance", () => {
  const input = {
    onPremise: [{
      category: "bitstream-preservation",
      machineName: "Server",
      idlePowerW: 100,
      maxPowerW: 200,
      meanUtilisation: 0.5,
      storageCapacityTB: 1,
      storageEnergyWhPerTBh: 0.5,
      pue: 1.2,
      gridFactorKgCO2ePerKWh: 0.4,
      gridFactorSource: "Grid dataset",
      source: "Meter readings",
      confidence: "high",
      storageEnergySource: "Storage study",
      pueSource: "Facility report",
      factorProvenance: [
        { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset" },
        { factor: "storage-energy-intensity", value: 0.5, unit: "Wh/TB/hour", source: "Storage study" },
        { factor: "power-usage-effectiveness", value: 1.2, unit: "ratio", source: "Facility report" },
      ],
    }],
  };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "recorded");
  assert.equal(envelope.factorProvenance[0].location, "onPremise[0][0]");
});

test("does not fabricate a functional unit, boundary, or factor provenance", () => {
  const input = {};
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), {
    ...metadata,
    functionalUnit: "One year of service",
    systemBoundary: "User-defined operational boundary",
  });
  assert.deepEqual(envelope.factorProvenance, []);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "none");
});

test("rejects incomplete assessment metadata and invalid timestamps", () => {
  const input = {};
  const native = calculateDpcV1(input);
  assert.throws(() => adaptDpcV1Result(input, native, { ...metadata, subject: " " }), /metadata.subject/);
  assert.throws(() => adaptDpcV1Result(input, native, { ...metadata, createdAt: "2026-02-30T00:00:00.000Z" }), /ISO 8601 UTC/);
});

test("rejects results from another method or version", () => {
  const input = {};
  const native = calculateDpcV1(input);
  assert.throws(() => adaptDpcV1Result(input, { ...native, version: "2.0" }, metadata), /DPC Carbon Footprint Toolkit v1.0/);
});

test("does not overstate provenance coverage when one activity row omits factor sources", () => {
  const input = {
    networking: [
      {
        category: "acquisition-transfer-ingest",
        activityName: "Transfer with two factors",
        transmittedMBPerDay: 10,
        receivedMBPerDay: 5,
        networkEnergyIntensityKWhPerGB: 0.0065,
        gridFactorKgCO2ePerKWh: 0.4,
        gridFactorSource: "Grid dataset",
        source: "Transfer logs",
        confidence: "high",
        factorProvenance: [
          { factor: "electricity-grid", unit: "kgCO2e/kWh", source: "Grid dataset" },
          { factor: "network-energy-intensity", unit: "kWh/GB", source: "Study" },
        ],
      },
      {
        category: "metadata-management",
        activityName: "Transfer without factor metadata",
        transmittedMBPerDay: 10,
        receivedMBPerDay: 5,
        networkEnergyIntensityKWhPerGB: 0.0065,
        gridFactorKgCO2ePerKWh: 0.4,
        gridFactorSource: "Grid dataset",
        source: "Transfer logs",
        confidence: "medium",
      },
    ],
  };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.factorProvenance.length, 2);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "partial");
});

test("records the website-use activity-data source separately from factor sources", () => {
  const input = { websiteUse: {
    averagePageSizeKB: 0, annualVisits: 0, averageDownloadSizeMB: 0, annualDownloads: 0,
    fixedLineIntensityKWhPerGB: 0, mobileIntensityKWhPerGB: 0,
    fixedLineIntensitySource: "Fixed study", mobileIntensitySource: "Mobile study",
    meanGlobalGridFactorKgCO2ePerKWh: 0, gridFactorSource: "Grid dataset",
    activitySource: "Web analytics export",
  } };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.deepEqual(envelope.dataQuality.inputSources, ["websiteUse: Web analytics export"]);
});

test("identifies a missing website-use activity-data source without inventing one", () => {
  const input = { websiteUse: {
    averagePageSizeKB: 0, annualVisits: 0, averageDownloadSizeMB: 0, annualDownloads: 0,
    fixedLineIntensityKWhPerGB: 0, mobileIntensityKWhPerGB: 0,
    fixedLineIntensitySource: "Fixed study", mobileIntensitySource: "Mobile study",
    meanGlobalGridFactorKgCO2ePerKWh: 0, gridFactorSource: "Grid dataset",
  } };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.deepEqual(envelope.dataQuality.inputSources, ["websiteUse: activity-data source not recorded"]);
});

test("preserves the supplied input snapshot in the envelope", () => {
  const input = { travel: [{ description: "Trip", emissionsKgCO2e: 4, source: "Travel source" }] };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.deepEqual(envelope.inputs, input);
});


test("does not count a row as provenance-covered when any factor source is missing", () => {
  const input = {
    networking: [{
      category: "acquisition-transfer-ingest",
      activityName: "Transfer",
      transmittedMBPerDay: 10,
      receivedMBPerDay: 5,
      networkEnergyIntensityKWhPerGB: 0.0065,
      gridFactorKgCO2ePerKWh: 0.4,
      gridFactorSource: "Grid dataset",
      source: "Transfer logs",
      confidence: "high",
      factorProvenance: [
        { factor: "electricity-grid", unit: "kgCO2e/kWh", source: "Grid dataset" },
        { factor: "network-energy-intensity", unit: "kWh/GB", source: null },
      ],
    }],
  };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.factorProvenance.length, 2);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "partial");
});


test("duplicate or unrelated provenance entries cannot replace a missing expected factor", () => {
  const input = { onPremise: [{
    category: "bitstream-preservation", machineName: "Server", idlePowerW: 100, maxPowerW: 200,
    meanUtilisation: 0.5, storageCapacityTB: 1, storageEnergyWhPerTBh: 0.5, pue: 1.2,
    gridFactorKgCO2ePerKWh: 0.4, gridFactorSource: "Grid dataset", source: "Meter readings", confidence: "high",
    factorProvenance: [
      { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset" },
      { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Duplicate source" },
      { factor: "unrelated-factor", value: 1, unit: "unit", source: "Unrelated source" },
    ],
  }] };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "partial");
});

test("does not call on-premise provenance fully recorded when only the grid source is supplied", () => {
  const input = { onPremise: [{
    category: "bitstream-preservation", machineName: "Server", idlePowerW: 100, maxPowerW: 200,
    meanUtilisation: 0.5, storageCapacityTB: 1, storageEnergyWhPerTBh: 0.5, pue: 1.2,
    gridFactorKgCO2ePerKWh: 0.4, gridFactorSource: "Grid dataset", source: "Meter readings", confidence: "high",
    factorProvenance: [{ factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset" }],
  }] };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "partial");
});

test("records complete factor provenance across cloud, networking, website use, and travel", () => {
  const input = {
    cloud: [{
      category: "data-centres-servers", serviceName: "Cloud compute",
      annualEmissionsKgCO2e: 12, source: "Cloud provider report", confidence: "high",
      factorProvenance: {
        factor: "provider-reported-emissions", value: 12,
        unit: "kgCO2e/year", source: "Cloud provider report",
      },
    }],
    networking: [{
      category: "discovery-access", activityName: "Network transfer",
      transmittedMBPerDay: 100, receivedMBPerDay: 50,
      networkEnergyIntensityKWhPerGB: 0.0065,
      gridFactorKgCO2ePerKWh: 0.4,
      gridFactorSource: "Regional grid dataset",
      source: "Network traffic logs", confidence: "medium",
      factorProvenance: [
        { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Regional grid dataset" },
        { factor: "network-energy-intensity", value: 0.0065, unit: "kWh/GB", source: "Network energy study" },
      ],
    }],
    websiteUse: {
      averagePageSizeKB: 500, annualVisits: 1000,
      averageDownloadSizeMB: 2, annualDownloads: 100,
      fixedLineIntensityKWhPerGB: 0.05, mobileIntensityKWhPerGB: 0.12,
      fixedLineIntensitySource: "Fixed-line study",
      mobileIntensitySource: "Mobile-network study",
      meanGlobalGridFactorKgCO2ePerKWh: 0.45,
      gridFactorSource: "Global grid dataset",
      factorProvenance: [
        { factor: "fixed-line-network-intensity", value: 0.05, unit: "kWh/GB", source: "Fixed-line study" },
        { factor: "mobile-network-intensity", value: 0.12, unit: "kWh/GB", source: "Mobile-network study" },
        { factor: "mean-global-grid", value: 0.45, unit: "kgCO2e/kWh", source: "Global grid dataset" },
      ],
    },
    travel: [{
      description: "Business travel", emissionsKgCO2e: 8, source: "Travel calculator",
      factorProvenance: {
        factor: "travel-emissions-calculation", value: 8,
        unit: "kgCO2e", source: "Travel calculator",
      },
    }],
  };
  const envelope = adaptDpcV1Result(input, calculateDpcV1(input), metadata);
  assert.equal(envelope.dataQuality.factorProvenanceCoverage, "recorded");
  assert.equal(envelope.factorProvenance.length, 7);
});

test("rejects factor provenance values that differ from values used by each DPC calculation family", () => {
  const cases = [
    {
      name: "cloud",
      input: { cloud: [{
        category: "data-centres-servers", serviceName: "Cloud compute",
        annualEmissionsKgCO2e: 12, source: "Provider report", confidence: "high",
        factorProvenance: { factor: "provider-reported-emissions", value: 11, unit: "kgCO2e/year", source: "Provider report" },
      }] },
    },
    {
      name: "networking",
      input: { networking: [{
        category: "discovery-access", activityName: "Network transfer",
        transmittedMBPerDay: 100, receivedMBPerDay: 50,
        networkEnergyIntensityKWhPerGB: 0.0065, gridFactorKgCO2ePerKWh: 0.4,
        gridFactorSource: "Grid dataset", source: "Traffic logs", confidence: "high",
        factorProvenance: [
          { factor: "electricity-grid", value: 0.3, unit: "kgCO2e/kWh", source: "Grid dataset" },
          { factor: "network-energy-intensity", value: 0.0065, unit: "kWh/GB", source: "Study" },
        ],
      }] },
    },
    {
      name: "website use",
      input: { websiteUse: {
        averagePageSizeKB: 500, annualVisits: 1000, averageDownloadSizeMB: 2, annualDownloads: 100,
        fixedLineIntensityKWhPerGB: 0.05, mobileIntensityKWhPerGB: 0.12,
        fixedLineIntensitySource: "Fixed study", mobileIntensitySource: "Mobile study",
        meanGlobalGridFactorKgCO2ePerKWh: 0.45, gridFactorSource: "Grid dataset",
        factorProvenance: [
          { factor: "fixed-line-network-intensity", value: 0.05, unit: "kWh/GB", source: "Fixed study" },
          { factor: "mobile-network-intensity", value: 0.12, unit: "kWh/GB", source: "Mobile study" },
          { factor: "mean-global-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset" },
        ],
      } },
    },
    {
      name: "travel",
      input: { travel: [{
        description: "Business travel", emissionsKgCO2e: 8, source: "Travel calculator",
        factorProvenance: { factor: "travel-emissions-calculation", value: 9, unit: "kgCO2e", source: "Travel calculator" },
      }] },
    },
  ];
  for (const item of cases) {
    assert.throws(
      () => calculateDpcV1(item.input),
      /must match the value used by the DPC calculation/,
      item.name,
    );
  }
});

