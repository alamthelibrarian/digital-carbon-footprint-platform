import test from "node:test";
import assert from "node:assert/strict";
import { methods } from "./methods.ts";

test("method registry uses unique stable method identifiers and route slugs", () => {
  const methodIds = methods.map((method) => method.methodId);
  const slugs = methods.map((method) => method.slug);
  assert.equal(new Set(methodIds).size, methodIds.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("DPC registry identity matches the calculation engine and factor catalogue", () => {
  const dpc = methods.find((method) => method.slug === "dpc-v1");
  assert.ok(dpc);
  assert.equal(dpc.methodId, "dpc-carbon-footprint-toolkit");
  assert.equal(dpc.version, "1.0");
  assert.equal(dpc.status, "in-development");
});

test("planned methods are not represented as implemented", () => {
  for (const method of methods.filter((item) => item.slug !== "dpc-v1")) {
    assert.notEqual(method.status, "in-development");
  }
});
