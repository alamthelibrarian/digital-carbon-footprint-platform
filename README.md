# Digital Carbon Footprint Platform (DCFP)

An open-source, multi-method platform for digital carbon footprint calculation, analysis, and reporting.

[![CI](https://github.com/alamthelibrarian/digital-carbon-footprint-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/alamthelibrarian/digital-carbon-footprint-platform/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **Project status:** Early development. The first calculation engine is an independent implementation based on the Digital Preservation Coalition (DPC) Carbon Footprint Toolkit v1.0. It is under development and has not yet been validated against the source workbook. Other methods are roadmap items, not implemented engines.

## Project scope

DCFP is designed as a modular platform for assessing the carbon footprint of digital activities and infrastructure. It will support method-specific calculation engines while sharing platform capabilities for data validation, provenance, reporting, and export.

The initial use case is digital preservation. The platform is intended to expand to other digital contexts without silently mixing methodologies or emission-factor datasets.

## Try the development calculator

The first DPC v1.0 calculator interface is available at `/calculator/dpc-v1/`. It connects to the TypeScript engine and provides optional input sections for on-premise equipment, cloud services, networking, website use, and travel. Users can print results or download a JSON record containing assessment metadata, inputs, outputs, and limitations. Example values are illustrative only; replace them with documented activity data and emission factors. The calculator is a development preview, not a validated reporting tool.

## Methodology and attribution

The initial calculation implementation is based on:

Digital Preservation Coalition. (2026). *Carbon Footprint Toolkit*. https://doi.org/10.7207/carbonfootprinttoolkit26-01

This project is an independent software implementation based on the DPC toolkit. It is not an official DPC product and is not endorsed by the Digital Preservation Coalition. The DPC publication remains the authoritative source for its methodology. Availability of the original workbook does not imply permission to redistribute its contents; third-party materials remain subject to their own rights and terms.

## Planned architecture

- **Astro + TypeScript:** web application and platform layer.
- **Method-specific engines:** isolated implementations with explicit method versions and calculation contracts.
- **Shared services:** validation, source and emission-factor provenance, reporting, and export. The initial method-aware factor catalogue contract is defined in `src/lib/emission-factors.ts`; it contains no bundled factor values or country defaults.
- **Transparent results:** each result records its method, version, functional unit, system boundary, reporting period, assumptions, data quality, and limitations.

Results from different methodologies are not automatically comparable. Any comparison or aggregation will require documented harmonization.

## Technical documentation

- [System architecture](./docs/ARCHITECTURE.md)
- [Methodology and attribution](./docs/METHODOLOGY.md)
- [Emission factor catalogue specification](./docs/EMISSION-FACTOR-CATALOGUE.md)
- [Calculation result contract](./docs/RESULT-CONTRACT.md)
- [DPC v1.0 result adapter](./engines/dpc-v1/result-adapter.ts)
- [Development roadmap](./docs/ROADMAP.md)

The result contract is a proposed platform-level target. The current DPC engine remains method-specific and has not yet been adapted to that shared envelope.

## Method roadmap

| Method or framework | Intended role | Status |
|---|---|---|
| DPC Carbon Footprint Toolkit v1.0 | Initial digital-preservation calculation engine | Under development; not validated |
| Software Carbon Intensity (SCI), ISO/IEC 21031 | Software carbon-intensity assessment | Planned research |
| GHG Protocol | Organizational and value-chain GHG accounting/reporting alignment | Under evaluation; not a standalone formula engine |
| ITU-T L.1410 / life-cycle assessment | ICT goods, networks, and services life-cycle assessment | Planned research |

No roadmap item should be interpreted as implemented until its calculation logic, tests, documentation, and validation are published.

## Getting started

### Requirements

- Node.js 22 or later
- npm

### Install and run

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run typecheck
npm test
npm run build
```

## Development principles

1. Preserve the source methodology's calculation logic and document any implementation decisions.
2. Keep each methodology isolated and versioned.
3. Record emission-factor sources, geography, units, and data quality.
4. Make assumptions and limitations visible to users.
5. Do not publish production credentials, personal data, or private operational configuration.
6. Keep this open-source project separate from any production deployment.
7. Do not describe a method as validated until independent regression evidence is available.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or pull request, and follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Security concerns should follow [SECURITY.md](./SECURITY.md).

## License

The original code and documentation in this repository are intended to be released under the MIT License. This license does not grant rights to third-party content, methodologies, trademarks, or materials referenced by the project. See [LICENSE](./LICENSE) for the terms applying to original project code.

## Project status and separation

This repository is the public development project. It is separate from the existing production calculator. No production database, credentials, OAuth configuration, or deployment target is included here.
