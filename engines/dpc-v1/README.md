# DPC Carbon Footprint Toolkit v1.0 engine

**Status: under development — not validated or ready for production use.**

This directory contains an early, independent TypeScript implementation of calculation behaviour transcribed from the DPC Carbon Footprint Toolkit v1.0 workbook. It is not yet a complete or validated implementation of the DPC method.

Primary reference: Digital Preservation Coalition. (2026). *Carbon Footprint Toolkit*. https://doi.org/10.7207/carbonfootprinttoolkit26-01

The implementation does not include or redistribute the original DPC workbook, its default factor tables, or its graphics. It is not an official DPC product and is not endorsed by DPC.

## Current implementation

- On Premise: server and storage power, annual energy, PUE, and grid-factor emissions.
- In Cloud: annual emissions entered from a provider or external source.
- Networking: source workbook calculation behaviour, including the `365/12` multiplier.
- Website Use: traffic-volume estimate, fixed/mobile midpoint, and low/high intensity bounds.
- Travel: direct kgCO2e or tCO2e converted to kgCO2e.
- Summary: aggregation of the above categories.

## Web calculator

The Astro interface at `/calculator/dpc-v1/` consumes this engine directly. Each activity group can be included or excluded. The interface displays the annual total, category breakdown, and calculation details, and supports printing the result. Example values are prefilled for demonstration and must be replaced with evidence-based inputs. The interface does not save calculations on a server. It supports a user-initiated JSON download containing assessment metadata, submitted inputs, calculation outputs, and limitations. The JSON file is a portable record, not a validated reporting template.



### Typed factor provenance

The DPC engine accepts optional `factorProvenance` metadata on on-premise, cloud, networking, website-use, and travel inputs. Provenance includes a factor identifier, unit, optional numeric value, source, geography, reference year, and optional data-quality rating. The calculation engine carries this metadata into the corresponding result objects; it does not use provenance fields in the arithmetic. This keeps evidence traceable without changing the DPC v1.0 formulas. Missing geography or reference years are not inferred.

### Factor provenance in the web record

The web calculator records provenance alongside the submitted inputs in its downloadable JSON record. Available fields include factor/source description, unit, geography or provider region, reference year, and the selected confidence level where the activity category provides one. Network energy-intensity sources are captured separately from electricity-grid-factor sources. These fields document user-supplied evidence; the platform does not verify source accuracy, infer missing geography or years, or supply country-specific defaults. Blank optional geography/year fields remain null or absent and should be completed when the underlying source provides that information.

## Validation still required

- Regression comparison against Excel-calculated workbook outputs.
- Complete coverage of empty rows, zero values, invalid units, missing inputs, and edge cases.
- Verification of every formula and category mapping against the authoritative publication/workbook.
- Review of factor provenance, geography, reference periods, and reuse rights.
- Review by an independent domain expert before any claim of validation.

See [FORMULA-MAP.md](./FORMULA-MAP.md) for the current formula audit. The audit is an implementation aid, not a substitute for the DPC publication.

## Run tests

From the repository root, run `npm test` with Node.js 22 or later.
