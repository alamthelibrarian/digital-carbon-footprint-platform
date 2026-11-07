import test from "node:test";
import assert from "node:assert/strict";
import { buildDpcV1ReportBreakdown } from "./report-view.ts";

const metrics = [
  { id: "dpc.on-premise", label: "On-premise", value: 75, unit: "kgCO2e" },
  { id: "dpc.travel", label: "Travel", value: 25, unit: "kgCO2e" },
  { id: "dpc.total", label: "DPC total", value: 100, unit: "kgCO2e" },
];

test("report breakdown preserves category values and derives shares from DPC total", () => {
  const report = buildDpcV1ReportBreakdown(metrics);
  assert.equal(report.total.value, 100);
  assert.deepEqual(report.categories.map(({ value, sharePercent }) => ({ value, sharePercent })), [
    { value: 75, sharePercent: 75 },
    { value: 25, sharePercent: 25 },
  ]);
  assert.equal(report.categories.reduce((sum, item) => sum + item.value, 0), report.total.value);
});

test("report breakdown omits percentages when the native total is zero", () => {
  const report = buildDpcV1ReportBreakdown([
    { id: "dpc.on-premise", label: "On-premise", value: 0, unit: "kgCO2e" },
    { id: "dpc.total", label: "DPC total", value: 0, unit: "kgCO2e" },
  ]);
  assert.equal(report.categories[0].sharePercent, null);
});

test("report breakdown requires a total metric", () => {
  assert.throws(() => buildDpcV1ReportBreakdown(metrics.slice(0, 2)), /total metric is required/);
});

test("report breakdown rejects invalid metric values and inconsistent units", () => {
  assert.throws(() => buildDpcV1ReportBreakdown([
    { id: "dpc.on-premise", label: "On-premise", value: -1, unit: "kgCO2e" },
    metrics[2],
  ]), /finite and non-negative/);
  assert.throws(() => buildDpcV1ReportBreakdown([
    { ...metrics[0], unit: "tCO2e" },
    metrics[2],
  ]), /must use the total metric unit/);
});
