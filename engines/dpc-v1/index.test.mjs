import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDpcV1,
  calculateNetworkingRow,
  calculateOnPremiseRow,
  calculateTravelRow,
  calculateWebsiteUse,
} from "./index.ts";

test("On Premise follows linear power curve, storage, PUE and grid factor", () => {
  const result = calculateOnPremiseRow({
    category: "bitstream-preservation",
    machineName: "Test server",
    idlePowerW: 100,
    maxPowerW: 200,
    meanUtilisation: 0.5,
    storageCapacityTB: 10,
    storageEnergyWhPerTBh: 0.5,
    pue: 1.5,
    gridFactorKgCO2ePerKWh: 0.45,
    gridFactorSource: "Test factor source",
    source: "Test measurements",
    confidence: "high",
  });
  assert.equal(result.serverPowerW, 150);
  assert.equal(result.storagePowerW, 5);
  assert.equal(result.combinedPowerW, 155);
  assert.ok(Math.abs(result.annualEnergyKWh - 2036.7) < 1e-9);
  assert.ok(Math.abs(result.emissionsKgCO2e - 916.515) < 1e-9);
});

test("Networking preserves the workbook 365/12 multiplier", () => {
  const result = calculateNetworkingRow({
    category: "acquisition-transfer-ingest",
    activityName: "Transfer",
    transmittedMBPerDay: 1000,
    receivedMBPerDay: 500,
    networkEnergyIntensityKWhPerGB: 0.0065,
    gridFactorKgCO2ePerKWh: 0.45,
    gridFactorSource: "Test grid factor",
    source: "Measured transfer volume",
    confidence: "high",
  });
  assert.equal(result.dataVolumeGBPerDay, 1.5);
  assert.ok(Math.abs(result.emissionsKgCO2e - (1.5 * (365 / 12) * 0.0065 * 0.45)) < 1e-12);
});

test("Website Use uses the simple fixed/mobile midpoint", () => {
  const result = calculateWebsiteUse({
    averagePageSizeKB: 100,
    annualVisits: 10000,
    averageDownloadSizeMB: 5,
    annualDownloads: 1000,
    fixedLineIntensityKWhPerGB: 0.0065,
    mobileIntensityKWhPerGB: 0.1,
    fixedLineIntensitySource: "DPC Datasheet default",
    mobileIntensitySource: "DPC Datasheet default",
    meanGlobalGridFactorKgCO2ePerKWh: 0.45,
    gridFactorSource: "DPC Datasheet default",
  });
  assert.equal(result.dataVolumeGB, 6);
  assert.ok(Math.abs(result.midpointIntensityKWhPerGB - 0.05325) < 1e-12);
  assert.ok(Math.abs(result.networkEnergyKWh - 0.3195) < 1e-12);
  assert.ok(Math.abs(result.emissionsKgCO2e - 0.143775) < 1e-12);
});

test("Travel converts tonnes to kilograms and accepts direct kilograms", () => {
  assert.equal(calculateTravelRow({
    description: "Flight",
    emissionsTCO2e: 0.25,
    source: "External calculator",
  }).emissionsKgCO2e, 250);
  assert.equal(calculateTravelRow({
    description: "Train",
    emissionsKgCO2e: 12,
    source: "External calculator",
  }).emissionsKgCO2e, 12);
  assert.throws(() => calculateTravelRow({
    description: "Invalid",
    emissionsTCO2e: 1,
    emissionsKgCO2e: 1000,
    source: "Test",
  }), /exactly one/);
});

test("Aggregate includes all workbook categories and cloud totals", () => {
  const result = calculateDpcV1({
    cloud: [
      { category: "data-centres-servers", serviceName: "Cloud storage", annualEmissionsKgCO2e: 10, source: "Provider report", confidence: "high" },
      { category: "networking", serviceName: "Cloud networking", annualEmissionsKgCO2e: 5, source: "Provider report", confidence: "medium" },
    ],
    websiteUse: {
      averagePageSizeKB: 100,
      annualVisits: 10000,
      averageDownloadSizeMB: 5,
      annualDownloads: 1000,
      fixedLineIntensityKWhPerGB: 0.0065,
      mobileIntensityKWhPerGB: 0.1,
      fixedLineIntensitySource: "DPC Datasheet default",
      mobileIntensitySource: "DPC Datasheet default",
      meanGlobalGridFactorKgCO2ePerKWh: 0.45,
      gridFactorSource: "DPC Datasheet default",
    },
    travel: [{ description: "Travel", emissionsKgCO2e: 20, source: "External calculator" }],
  });
  assert.equal(result.totals.cloudDataCentresServersKgCO2e, 10);
  assert.equal(result.totals.cloudNetworkingKgCO2e, 5);
  assert.ok(Math.abs(result.totals.websiteUseKgCO2e - 0.143775) < 1e-12);
  assert.equal(result.totals.travelKgCO2e, 20);
  assert.ok(Math.abs(result.totals.totalKgCO2e - 35.143775) < 1e-12);
});

test("Rejects utilisation values outside 0–1", () => {
  assert.throws(() => calculateOnPremiseRow({
    category: "bitstream-preservation",
    machineName: "Invalid",
    idlePowerW: 10,
    maxPowerW: 20,
    meanUtilisation: 20,
    storageCapacityTB: 1,
    storageEnergyWhPerTBh: 1,
    pue: 1,
    gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test",
    source: "Test",
    confidence: "low",
  }), /fraction between 0 and 1/);
});


test("Regression fixture matches independently recalculated DPC workbook outputs", () => {
  // Fixture inputs were entered into a working copy of the DPC v1.0 workbook
  // and recalculated with LibreOffice Calc. See fixtures/README.md.
  const result = calculateDpcV1({
    onPremise: [{
      category: "acquisition-transfer-ingest",
      machineName: "Test server",
      idlePowerW: 100,
      maxPowerW: 200,
      meanUtilisation: 0.5,
      storageCapacityTB: 10,
      storageEnergyWhPerTBh: 0.5,
      pue: 1.5,
      gridFactorKgCO2ePerKWh: 0.20705,
      gridFactorSource: "DPC workbook Grid factors: United Kingdom",
      source: "Regression fixture measurements",
      confidence: "high",
    }],
    cloud: [
      { category: "data-centres-servers", serviceName: "Cloud storage", annualEmissionsKgCO2e: 10, source: "Regression fixture", confidence: "high" },
      { category: "networking", serviceName: "Cloud networking", annualEmissionsKgCO2e: 5, source: "Regression fixture", confidence: "medium" },
    ],
    networking: [{
      category: "acquisition-transfer-ingest",
      activityName: "Test network",
      transmittedMBPerDay: 1000,
      receivedMBPerDay: 500,
      networkEnergyIntensityKWhPerGB: 0.0065,
      gridFactorKgCO2ePerKWh: 0.45,
      gridFactorSource: "DPC workbook Datasheet",
      source: "Regression fixture measurements",
      confidence: "high",
    }],
    websiteUse: {
      averagePageSizeKB: 100,
      annualVisits: 10000,
      averageDownloadSizeMB: 5,
      annualDownloads: 1000,
      fixedLineIntensityKWhPerGB: 0.0065,
      mobileIntensityKWhPerGB: 0.1,
      fixedLineIntensitySource: "DPC workbook Datasheet",
      mobileIntensitySource: "DPC workbook Datasheet",
      meanGlobalGridFactorKgCO2ePerKWh: 0.45,
      gridFactorSource: "DPC workbook Datasheet",
    },
    travel: [{ description: "Test trip", emissionsTCO2e: 0.25, source: "Regression fixture" }],
  });

  assert.ok(Math.abs(result.onPremise[0].annualEnergyKWh - 2036.7) < 1e-9);
  assert.ok(Math.abs(result.onPremise[0].emissionsKgCO2e - 421.698735) < 1e-9);
  assert.ok(Math.abs(result.networking[0].emissionsKgCO2e - 0.133453125) < 1e-12);
  assert.ok(Math.abs(result.websiteUse.emissionsKgCO2e - 0.143775) < 1e-12);
  assert.equal(result.travel[0].emissionsKgCO2e, 250);
  assert.ok(Math.abs(result.totals.totalKgCO2e - 686.975963125) < 1e-9);
});


test("Rejects unsupported cloud emissions categories", () => {
  assert.throws(() => calculateDpcV1({
    cloud: [{
      category: "other",
      serviceName: "Invalid service",
      annualEmissionsKgCO2e: 1,
      source: "Test source",
      confidence: "high",
    }],
  }), /Unsupported cloud emissions category/);
});

test("Rejects invalid confidence values", () => {
  assert.throws(() => calculateDpcV1({
    cloud: [{
      category: "networking",
      serviceName: "Invalid confidence",
      annualEmissionsKgCO2e: 1,
      source: "Test source",
      confidence: "unknown",
    }],
  }), /confidence must be high, medium, or low/);
});


test("Preserves factor provenance metadata without changing calculated emissions", () => {
  const onPremiseProvenance = {
    factor: "electricity-grid",
    value: 0.4,
    unit: "kgCO2e/kWh",
    source: "National grid dataset",
    geography: "Example country",
    referenceYear: 2025,
  };
  const networkProvenance = [
    { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset", geography: "Example country", referenceYear: 2025 },
    { factor: "network-energy-intensity", value: 0.0065, unit: "kWh/GB", source: "Peer-reviewed study", referenceYear: 2024 },
  ];
  const onPremise = calculateOnPremiseRow({
    category: "bitstream-preservation", machineName: "Server", idlePowerW: 100,
    maxPowerW: 200, meanUtilisation: 0.5, storageCapacityTB: 10,
    storageEnergyWhPerTBh: 0.5, pue: 1.5, gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "National grid dataset", source: "Meter readings",
    confidence: "medium", factorProvenance: onPremiseProvenance,
  });
  assert.deepEqual(onPremise.factorProvenance, onPremiseProvenance);
  assert.ok(Math.abs(onPremise.emissionsKgCO2e - 814.68) < 1e-9);

  const networking = calculateNetworkingRow({
    category: "acquisition-transfer-ingest", activityName: "Transfer",
    transmittedMBPerDay: 1000, receivedMBPerDay: 500,
    networkEnergyIntensityKWhPerGB: 0.0065, gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Grid dataset", source: "Transfer logs",
    confidence: "medium", factorProvenance: networkProvenance,
  });
  assert.deepEqual(networking.factorProvenance, networkProvenance);

  const websiteProvenance = [
    { factor: "fixed-line-network-intensity", value: 0.0065, unit: "kWh/GB", source: "Study A", referenceYear: 2024 },
    { factor: "mobile-network-intensity", value: 0.1, unit: "kWh/GB", source: "Study B", referenceYear: 2024 },
    { factor: "mean-global-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset", geography: "Global", referenceYear: 2025 },
  ];
  const website = calculateWebsiteUse({
    averagePageSizeKB: 100, annualVisits: 10000, averageDownloadSizeMB: 5,
    annualDownloads: 1000, fixedLineIntensityKWhPerGB: 0.0065,
    mobileIntensityKWhPerGB: 0.1, fixedLineIntensitySource: "Study A",
    mobileIntensitySource: "Study B", meanGlobalGridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Grid dataset", factorProvenance: websiteProvenance,
  });
  assert.deepEqual(website.factorProvenance, websiteProvenance);
  assert.ok(Math.abs(website.emissionsKgCO2e - 0.1278) < 1e-12);

  const travelProvenance = {
    factor: "travel-emissions-calculation", unit: "kgCO2e",
    source: "Travel calculator", geography: "Example country", referenceYear: 2025,
  };
  const travel = calculateTravelRow({
    description: "Trip", emissionsKgCO2e: 12, source: "Travel calculator",
    factorProvenance: travelProvenance,
  });
  assert.deepEqual(travel.factorProvenance, travelProvenance);
});


test("All five DPC activity categories retain multiple rows and aggregate correctly", () => {
  const categories = [
    "acquisition-transfer-ingest",
    "bitstream-preservation",
    "content-preservation",
    "metadata-management",
    "discovery-access",
  ];
  const onPremise = categories.flatMap((category) => [1, 2].map((index) => ({
    category,
    machineName: `Server ${index}`,
    idlePowerW: 100,
    maxPowerW: 100,
    meanUtilisation: 0,
    storageCapacityTB: 0,
    storageEnergyWhPerTBh: 0,
    pue: 1,
    gridFactorKgCO2ePerKWh: 0.5,
    gridFactorSource: "Synthetic test factor",
    source: "Synthetic test activity data",
    confidence: "high",
  })));
  const networking = categories.flatMap((category) => [1, 2].map((index) => ({
    category,
    activityName: `Network activity ${index}`,
    transmittedMBPerDay: 1000,
    receivedMBPerDay: 0,
    networkEnergyIntensityKWhPerGB: 0.01,
    gridFactorKgCO2ePerKWh: 0.5,
    gridFactorSource: "Synthetic test factor",
    source: "Synthetic test activity data",
    confidence: "high",
  })));

  const result = calculateDpcV1({
    onPremise,
    networking,
    cloud: [
      { category: "data-centres-servers", serviceName: "Cloud compute", annualEmissionsKgCO2e: 2, source: "Provider report", confidence: "high" },
      { category: "networking", serviceName: "Cloud transfer", annualEmissionsKgCO2e: 3, source: "Provider report", confidence: "high" },
    ],
    websiteUse: {
      averagePageSizeKB: 0,
      annualVisits: 0,
      averageDownloadSizeMB: 0,
      annualDownloads: 0,
      fixedLineIntensityKWhPerGB: 0,
      mobileIntensityKWhPerGB: 0,
      fixedLineIntensitySource: "Synthetic test assumption",
      mobileIntensitySource: "Synthetic test assumption",
      meanGlobalGridFactorKgCO2ePerKWh: 0,
      gridFactorSource: "Synthetic test factor",
    },
    travel: [{ description: "No travel", emissionsKgCO2e: 0, source: "Synthetic test record" }],
  });

  assert.equal(result.onPremise.length, 10);
  assert.equal(result.networking.length, 10);
  for (const category of categories) {
    assert.equal(result.onPremise.filter((row) => row.category === category).length, 2);
    assert.equal(result.networking.filter((row) => row.category === category).length, 2);
  }
  assert.ok(Math.abs(result.totals.onPremiseKgCO2e - 4380) < 1e-9);
  assert.ok(Math.abs(result.totals.networkingOnPremiseKgCO2e - (10 * (365 / 12) * 0.01 * 0.5)) < 1e-12);
  assert.equal(result.totals.cloudDataCentresServersKgCO2e, 2);
  assert.equal(result.totals.cloudNetworkingKgCO2e, 3);
  assert.equal(result.totals.websiteUseKgCO2e, 0);
  assert.equal(result.totals.travelKgCO2e, 0);
  assert.ok(Math.abs(result.totals.totalKgCO2e - (4380 + (10 * (365 / 12) * 0.01 * 0.5) + 5)) < 1e-9);
});

test("Empty assessment returns zero totals without inventing activity rows", () => {
  const result = calculateDpcV1({});
  assert.deepEqual(result.onPremise, []);
  assert.deepEqual(result.cloud, []);
  assert.deepEqual(result.networking, []);
  assert.equal(result.websiteUse, null);
  assert.deepEqual(result.travel, []);
  assert.deepEqual(result.totals, {
    onPremiseKgCO2e: 0,
    cloudDataCentresServersKgCO2e: 0,
    cloudNetworkingKgCO2e: 0,
    networkingOnPremiseKgCO2e: 0,
    websiteUseKgCO2e: 0,
    travelKgCO2e: 0,
    totalKgCO2e: 0,
  });
});


test("Rejects non-finite derived values caused by numeric overflow", () => {
  assert.throws(() => calculateOnPremiseRow({
    category: "bitstream-preservation",
    machineName: "Overflow server",
    idlePowerW: 1e308,
    maxPowerW: 1e308,
    meanUtilisation: 0,
    storageCapacityTB: 0,
    storageEnergyWhPerTBh: 0,
    pue: 2,
    gridFactorKgCO2ePerKWh: 1,
    gridFactorSource: "Synthetic source",
    source: "Synthetic activity data",
    confidence: "high",
  }), /non-finite result/);

  assert.throws(() => calculateNetworkingRow({
    category: "acquisition-transfer-ingest",
    activityName: "Overflow transfer",
    transmittedMBPerDay: 1e308,
    receivedMBPerDay: 1e308,
    networkEnergyIntensityKWhPerGB: 1,
    gridFactorKgCO2ePerKWh: 1,
    gridFactorSource: "Synthetic source",
    source: "Synthetic activity data",
    confidence: "high",
  }), /non-finite result/);

  assert.throws(() => calculateWebsiteUse({
    averagePageSizeKB: 1e308,
    annualVisits: 1e308,
    averageDownloadSizeMB: 0,
    annualDownloads: 0,
    fixedLineIntensityKWhPerGB: 1,
    mobileIntensityKWhPerGB: 1,
    fixedLineIntensitySource: "Synthetic source",
    mobileIntensitySource: "Synthetic source",
    meanGlobalGridFactorKgCO2ePerKWh: 1,
    gridFactorSource: "Synthetic source",
  }), /non-finite result/);

  assert.throws(() => calculateTravelRow({
    description: "Overflow trip",
    emissionsTCO2e: 1e308,
    source: "Synthetic source",
  }), /finite, non-negative number/);

  assert.throws(() => calculateDpcV1({
    cloud: [
      { category: "data-centres-servers", serviceName: "Cloud A", annualEmissionsKgCO2e: 1e308, source: "Provider A", confidence: "high" },
      { category: "data-centres-servers", serviceName: "Cloud B", annualEmissionsKgCO2e: 1e308, source: "Provider B", confidence: "high" },
    ],
  }), /non-finite result/);
});


test("Rejects negative and non-finite activity inputs across DPC categories", () => {
  assert.throws(() => calculateOnPremiseRow({
    category: "bitstream-preservation",
    machineName: "Negative server",
    idlePowerW: -1,
    maxPowerW: 10,
    meanUtilisation: 0.5,
    storageCapacityTB: 1,
    storageEnergyWhPerTBh: 1,
    pue: 1,
    gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test source",
    source: "Test activity data",
    confidence: "high",
  }), /finite, non-negative number/);

  assert.throws(() => calculateNetworkingRow({
    category: "acquisition-transfer-ingest",
    activityName: "Non-finite transfer",
    transmittedMBPerDay: Number.NaN,
    receivedMBPerDay: 0,
    networkEnergyIntensityKWhPerGB: 0.01,
    gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test source",
    source: "Test activity data",
    confidence: "high",
  }), /finite, non-negative number/);

  assert.throws(() => calculateWebsiteUse({
    averagePageSizeKB: Number.POSITIVE_INFINITY,
    annualVisits: 1,
    averageDownloadSizeMB: 0,
    annualDownloads: 0,
    fixedLineIntensityKWhPerGB: 0.01,
    mobileIntensityKWhPerGB: 0.02,
    fixedLineIntensitySource: "Test source",
    mobileIntensitySource: "Test source",
    meanGlobalGridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test source",
  }), /finite, non-negative number/);

  assert.throws(() => calculateTravelRow({
    description: "Negative trip",
    emissionsKgCO2e: -0.1,
    source: "Test source",
  }), /finite, non-negative number/);

  assert.throws(() => calculateDpcV1({
    cloud: [{
      category: "networking",
      serviceName: "Non-finite cloud service",
      annualEmissionsKgCO2e: Number.POSITIVE_INFINITY,
      source: "Provider report",
      confidence: "high",
    }],
  }), /finite, non-negative number/);
});

test("Rejects blank evidence descriptions and source fields", () => {
  assert.throws(() => calculateOnPremiseRow({
    category: "bitstream-preservation",
    machineName: "   ",
    idlePowerW: 1,
    maxPowerW: 1,
    meanUtilisation: 0,
    storageCapacityTB: 0,
    storageEnergyWhPerTBh: 0,
    pue: 1,
    gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test source",
    source: "Test activity data",
    confidence: "high",
  }), /machineName must be a non-empty string/);

  assert.throws(() => calculateDpcV1({
    cloud: [{
      category: "data-centres-servers",
      serviceName: "Cloud service",
      annualEmissionsKgCO2e: 1,
      source: "   ",
      confidence: "high",
    }],
  }), /source must be a non-empty string/);
});


test("Rejects numeric strings in website calculation inputs", () => {
  assert.throws(() => calculateWebsiteUse({
    averagePageSizeKB: "100",
    annualVisits: 1000,
    averageDownloadSizeMB: 0,
    annualDownloads: 0,
    fixedLineIntensityKWhPerGB: 0.01,
    mobileIntensityKWhPerGB: 0.02,
    fixedLineIntensitySource: "Test source",
    mobileIntensitySource: "Test source",
    meanGlobalGridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Test source",
  }), /finite, non-negative number/);
});


test("Validates factor provenance metadata without changing calculation inputs", () => {
  const base = {
    category: "bitstream-preservation",
    machineName: "Provenance server",
    idlePowerW: 10,
    maxPowerW: 20,
    meanUtilisation: 0.5,
    storageCapacityTB: 1,
    storageEnergyWhPerTBh: 0.5,
    pue: 1,
    gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Grid dataset",
    source: "Meter readings",
    confidence: "high",
  };
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: " ", unit: "kgCO2e/kWh", source: "Dataset" },
  }), /factorProvenance.factor must be a non-empty string/);
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "grid", unit: "", source: "Dataset" },
  }), /factorProvenance.unit must be a non-empty string/);
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "electricity-grid", unit: "kWh/GB", source: "Dataset" },
  }), /factorProvenance.unit for electricity-grid must be kgCO2e\/kWh/);
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "grid", unit: "kgCO2e/kWh", value: Number.NaN, source: "Dataset" },
  }), /factorProvenance.value must be a finite, non-negative number/);
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "grid", unit: "kgCO2e/kWh", value: 0.4, source: "Dataset", referenceYear: 2025.5 },
  }), /referenceYear must be a positive integer/);
  assert.throws(() => calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "grid", unit: "kgCO2e/kWh", source: "Dataset", dataKind: "guessed" },
  }), /factorProvenance.dataKind must be measured, provider-reported, secondary-literature, or proxy/);
  const typed = calculateOnPremiseRow({
    ...base,
    factorProvenance: { factor: "electricity-grid", unit: "kgCO2e/kWh", source: "Dataset", dataKind: "proxy" },
  });
  assert.equal(typed.factorProvenance.dataKind, "proxy");

  const valid = calculateOnPremiseRow({
    ...base,
    factorProvenance: {
      factor: "grid-electricity",
      value: 0.4,
      unit: "kgCO2e/kWh",
      source: "Grid dataset",
      geography: "Example region",
      referenceYear: 2025,
    },
  });
  assert.ok(Math.abs(valid.emissionsKgCO2e - 54.312) < 1e-9);
});


test("rejects recognized provenance values that differ from DPC calculation inputs", () => {
  assert.throws(() => calculateOnPremiseRow({
    category: "bitstream-preservation", machineName: "Server",
    idlePowerW: 10, maxPowerW: 20, meanUtilisation: 0.5,
    storageCapacityTB: 1, storageEnergyWhPerTBh: 0.5, pue: 1,
    gridFactorKgCO2ePerKWh: 0.4, gridFactorSource: "Grid dataset",
    source: "Meter readings", confidence: "high",
    factorProvenance: { factor: "electricity-grid", value: 0.5, unit: "kgCO2e/kWh", source: "Grid dataset" },
  }), /must match the value used by the DPC calculation/);

  assert.throws(() => calculateNetworkingRow({
    category: "acquisition-transfer-ingest", activityName: "Transfer",
    transmittedMBPerDay: 10, receivedMBPerDay: 5,
    networkEnergyIntensityKWhPerGB: 0.0065, gridFactorKgCO2ePerKWh: 0.4,
    gridFactorSource: "Grid dataset", source: "Transfer logs", confidence: "high",
    factorProvenance: [
      { factor: "electricity-grid", value: 0.4, unit: "kgCO2e/kWh", source: "Grid dataset" },
      { factor: "network-energy-intensity", value: 0.007, unit: "kWh/GB", source: "Study" },
    ],
  }), /must match the value used by the DPC calculation/);

  assert.throws(() => calculateDpcV1({
    cloud: [{
      category: "data-centres-servers", serviceName: "Cloud service",
      annualEmissionsKgCO2e: 10, source: "Provider report", confidence: "high",
      factorProvenance: { factor: "provider-reported-emissions", value: 9, unit: "kgCO2e/year", source: "Provider report" },
    }],
  }), /must match the value used by the DPC calculation/);

  assert.throws(() => calculateWebsiteUse({
    averagePageSizeKB: 100, annualVisits: 1000,
    averageDownloadSizeMB: 1, annualDownloads: 10,
    fixedLineIntensityKWhPerGB: 0.01, mobileIntensityKWhPerGB: 0.02,
    fixedLineIntensitySource: "Fixed study", mobileIntensitySource: "Mobile study",
    meanGlobalGridFactorKgCO2ePerKWh: 0.4, gridFactorSource: "Grid dataset",
    factorProvenance: [
      { factor: "fixed-line-network-intensity", value: 0.01, unit: "kWh/GB", source: "Fixed study" },
      { factor: "mobile-network-intensity", value: 0.02, unit: "kWh/GB", source: "Mobile study" },
      { factor: "mean-global-grid", value: 0.5, unit: "kgCO2e/kWh", source: "Grid dataset" },
    ],
  }), /must match the value used by the DPC calculation/);

  assert.throws(() => calculateTravelRow({
    description: "Work trip", emissionsKgCO2e: 5, source: "Travel calculator",
    factorProvenance: { factor: "travel-emissions-calculation", value: 4, unit: "kgCO2e", source: "Travel calculator" },
  }), /must match the value used by the DPC calculation/);
});
