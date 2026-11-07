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

## Validation still required

- Regression comparison against Excel-calculated workbook outputs.
- Complete coverage of empty rows, zero values, invalid units, missing inputs, and edge cases.
- Verification of every formula and category mapping against the authoritative publication/workbook.
- Review of factor provenance, geography, reference periods, and reuse rights.
- Review by an independent domain expert before any claim of validation.

See [FORMULA-MAP.md](./FORMULA-MAP.md) for the current formula audit. The audit is an implementation aid, not a substitute for the DPC publication.

## Run tests

From the repository root, run `npm test` with Node.js 22 or later.
