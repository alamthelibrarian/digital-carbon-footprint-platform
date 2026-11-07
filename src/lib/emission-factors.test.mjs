import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEmissionFactorCatalogue,
  validateEmissionFactorRecord,
} from "./emission-factors.ts";

const validFactor = {
  id: "grid-factor-example-2025",
  name: "Example electricity grid factor",
  category: "electricity-grid",
  value: 0.4,
  unit: "kgCO2e/kWh",
  source: {
    name: "Example national inventory",
    publisher: "Example agency",
    url: "https://example.org/grid-factors",
    publishedYear: 2025,
  },
  geography: { level: "country", name: "Example country", code: "XX" },
  referencePeriod: { year: 2025 },
  dataKind: "secondary-literature",
  dataQuality: "medium",
  applicableMethods: ["dpc-carbon-footprint-toolkit-v1"],
  license: "Example terms — verify before redistribution",
};

test("accepts a factor with explicit provenance and method applicability", () => {
  assert.deepEqual(validateEmissionFactorRecord(validFactor), []);
});

test("rejects missing source and method applicability", () => {
  const invalid = { ...validFactor, source: {}, applicableMethods: [] };
  const errors = validateEmissionFactorRecord(invalid);
  assert.ok(errors.some((error) => error.includes("source.name")));
  assert.ok(errors.some((error) => error.includes("applicableMethods")));
});

test("rejects negative or non-finite factor values", () => {
  assert.ok(validateEmissionFactorRecord({ ...validFactor, value: -0.1 })
    .some((error) => error.includes("finite, non-negative")));
  assert.ok(validateEmissionFactorRecord({ ...validFactor, value: Number.NaN })
    .some((error) => error.includes("finite, non-negative")));
});

test("rejects invalid reference periods and duplicate method identifiers", () => {
  const errors = validateEmissionFactorRecord({
    ...validFactor,
    referencePeriod: { startDate: "2025-12-31", endDate: "2025-01-01" },
    applicableMethods: ["dpc-v1", "dpc-v1"],
  });
  assert.ok(errors.some((error) => error.includes("on or after startDate")));
  assert.ok(errors.some((error) => error.includes("must not contain duplicates")));
});

test("catalogue validation reports duplicate factor identifiers", () => {
  const errors = validateEmissionFactorCatalogue([validFactor, validFactor]);
  assert.ok(errors.some((error) => error.includes("duplicate factor id")));
});

test("catalogue validation rejects a non-array payload", () => {
  assert.deepEqual(validateEmissionFactorCatalogue({}), ["catalogue must be an array"]);
});

test("rejects impossible calendar dates in factor reference periods", () => {
  const errors = validateEmissionFactorRecord({
    ...validFactor,
    referencePeriod: { startDate: "2025-02-31", endDate: "2025-03-01" },
  });
  assert.ok(errors.some((error) => error.includes("valid YYYY-MM-DD dates")));
});
