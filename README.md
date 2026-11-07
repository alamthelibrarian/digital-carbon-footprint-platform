# Digital Carbon Footprint Platform (DCFP)

An open-source, multi-method platform for digital carbon footprint calculation, analysis, and reporting.

> **Project status:** Initial foundation. The first calculation method planned for implementation is the Digital Preservation Coalition (DPC) Carbon Footprint Toolkit v1.0. Other methods are roadmap items and are not yet implemented.

## Project scope

DCFP is designed as a modular platform for assessing the carbon footprint of digital activities and infrastructure. It will support method-specific calculation engines while sharing platform capabilities for data validation, provenance, reporting, and export.

The initial use case is digital preservation. The platform is intended to expand to other digital contexts without silently mixing methodologies or emission-factor datasets.

## Methodology and attribution

The initial calculation implementation is based on:

Digital Preservation Coalition. (2026). *Carbon Footprint Toolkit*. https://doi.org/10.7207/carbonfootprinttoolkit26-01

This project is an independent software implementation based on the DPC toolkit. It is not an official DPC product and is not endorsed by the Digital Preservation Coalition. The DPC publication remains the authoritative source for its methodology. Availability of the original workbook does not imply permission to redistribute its contents; third-party materials remain subject to their own rights and terms.

## Planned architecture

- **Astro + TypeScript:** web application and platform layer.
- **Method-specific engines:** isolated implementations with explicit method versions and calculation contracts.
- **Shared services:** validation, source and emission-factor provenance, reporting, and export.
- **Transparent results:** each result records its method, version, functional unit, system boundary, reporting period, assumptions, data quality, and limitations.

Results from different methodologies are not automatically comparable. Any comparison or aggregation will require documented harmonization.

## Method roadmap

| Method or framework | Intended role | Status |
|---|---|---|
| DPC Carbon Footprint Toolkit v1.0 | Initial digital-preservation calculation engine | Planned initial implementation |
| Software Carbon Intensity (SCI), ISO/IEC 21031 | Software carbon-intensity assessment | Planned |
| GHG Protocol | Organizational and value-chain GHG accounting/reporting alignment | Under evaluation; not a standalone formula engine |
| ITU-T L.1410 / life-cycle assessment | ICT goods, networks, and services life-cycle assessment | Planned research and evaluation |

No roadmap item should be interpreted as implemented until its calculation logic, tests, documentation, and validation are published.

## Development principles

1. Preserve the source methodology's calculation logic and document any implementation decisions.
2. Keep each methodology isolated and versioned.
3. Record emission-factor sources, geography, units, and data quality.
4. Make assumptions and limitations visible to users.
5. Do not publish production credentials, personal data, or private operational configuration.
6. Keep this open-source project separate from any production deployment.

## License

The original code and documentation in this repository are intended to be released under the MIT License. This license does not grant rights to third-party content, methodologies, trademarks, or materials referenced by the project. See `LICENSE` for the terms applying to original project code.

## Project status

This repository is the public development project. It is separate from the existing production calculator. No production database, credentials, OAuth configuration, or deployment target is included here.

## Contributing

Contribution guidelines and technical setup instructions will be added as the application foundation is implemented.
