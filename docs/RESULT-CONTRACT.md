# Calculation Result Contract

**Status:** Proposed shared platform contract. The current DPC v1.0 engine returns a method-specific result object; it has not yet been adapted to this common envelope.

## Purpose

Every calculation engine should return results that can be stored, inspected, exported, and reported consistently. The shared contract standardises metadata and presentation, not calculation logic.

Each method retains its own equations, categories, factor rules, boundaries, and interpretation. The platform must never merge method-specific results into a common total unless a documented harmonisation procedure justifies it.

## Required result envelope

A future platform-level result should contain the following sections:

| Section | Required content |
|---|---|
| `schemaVersion` | Version of the platform result contract |
| `assessment` | Assessment identifier, creation timestamp, title or description where provided |
| `method` | Stable method identifier and exact method version |
| `scope` | Subject/activity assessed, system boundary, functional unit, and reporting period |
| `inputs` | The input record or a durable reference to it, including units and user-supplied assumptions |
| `results` | Method-specific outputs and clearly labelled metrics |
| `factorProvenance` | Factors used, including values, units, sources, geography, reference period, data kind/quality, and licence information where available |
| `dataQuality` | Method-appropriate assessment of input and factor data quality |
| `assumptions` | Explicit assumptions, proxies, exclusions, and estimation choices |
| `limitations` | Known limitations and warnings that affect interpretation |
| `traceability` | Engine identifier/version, calculation timestamp, and references needed to reproduce the result |

## Metric representation

Each reported metric should carry:

- a stable method-specific metric identifier;
- a human-readable label;
- a numeric value;
- an explicit unit;
- optional context such as category, range, or calculation note.

Do not assume every method produces `kgCO2e`, an annual total, or the same functional unit. Preserve native method units and functional units. A display layer may convert units for readability only when the conversion is dimensionally valid, transparent, and reversible.

## Method identity and comparability

The method identifier and version are mandatory. A result calculated with DPC v1.0 must remain identifiable as DPC v1.0 even if later platform releases add other methods.

Results from different methods are not directly comparable by default. Differences may arise from functional units, system boundaries, included life-cycle stages, allocation rules, emission-factor sources, time periods, and treatment of uncertainty. Any cross-method comparison must document these differences and the harmonisation procedure. Never present a combined figure as if it were a native method result.

## Provenance and reproducibility

The result should preserve enough information to explain where each material factor came from and how it was applied. Where a catalogue record is used, retain its stable factor ID and the factor snapshot/version used at calculation time. A later catalogue update must not silently change an already completed assessment.

If a factor is entered manually, preserve the supplied value, unit, source, geography, reference period, and notes. Missing provenance should be visible as missing; it must not be fabricated or silently filled with a generic default.

## Status and validation claims

The platform should distinguish at least these states:

- **Development:** implementation is in progress.
- **Not validated:** tests exist, but independent validation evidence is incomplete.
- **Validated for stated scope:** validation evidence exists for the documented method version, datasets, boundaries, and test cases.

Passing unit tests or a successful software build does not, by itself, establish scientific or methodological validity. Validation status must be scoped and supported by published evidence.

## DPC v1.0 mapping

The current DPC engine already returns method identifier, method version, one-year reference period, limitations, activity-category results, factor provenance on relevant input/result rows, and totals in kgCO2e. It does not yet provide the complete shared envelope described above. In particular, assessment identity, system boundary, functional unit as a structured field, schema version, calculation traceability, and a unified metric list remain future integration work.

The DPC engine's current result shape should not be changed merely to make it look generic. Introduce an explicit adapter when the shared result contract is implemented, preserving the original method-specific result for auditability.

## Compatibility rule

The common contract is a wrapper around method-specific outputs, not a replacement for them. A new engine must document its mapping to the envelope and identify any fields that are not meaningful for that method. Do not invent values to satisfy a generic field; use an explicit not-applicable or method-specific representation in the eventual schema.
