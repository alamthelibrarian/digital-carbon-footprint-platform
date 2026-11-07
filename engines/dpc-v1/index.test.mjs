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
  assert.equal(result.annualEnergyKWh, 2035.35);
  assert.equal(result.emissionsKgCO2e, 916.0 - 0.0925);
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
  assert.equal(result.midpointIntensityKWhPerGB, 0.05325);
  assert.equal(result.networkEnergyKWh, 0.3195);
  assert.equal(result.emissionsKgCO2e, 0.143775);
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
      meanGlobalGridFactorKgCO2ePerKWh: 0.45,
    },
    travel: [{ description: "Travel", emissionsKgCO2e: 20, source: "External calculator" }],
  });
  assert.equal(result.totals.cloudDataCentresServersKgCO2e, 10);
  assert.equal(result.totals.cloudNetworkingKgCO2e, 5);
  assert.equal(result.totals.websiteUseKgCO2e, 0.143775);
  assert.equal(result.totals.travelKgCO2e, 20);
  assert.equal(result.totals.totalKgCO2e, 35.143775);
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
