# Methodology policy

## Core rule

A calculation result belongs to one explicitly identified methodology and version. DCFP provides software infrastructure; it does not create a universal equation by combining unrelated standards.

## Initial method: DPC Carbon Footprint Toolkit v1.0

The first calculation engine is intended to implement the Digital Preservation Coalition (DPC) Carbon Footprint Toolkit v1.0.

**Primary reference**

Digital Preservation Coalition. (2026). *Carbon Footprint Toolkit*. https://doi.org/10.7207/carbonfootprinttoolkit26-01

This is an independent software implementation, not an official DPC product and not endorsed by DPC. The DPC publication is authoritative for the source methodology. The project must not reproduce protected workbook content, layout, graphics, or substantial text without confirming permission or applicable licensing.

## Method isolation

- Keep equations, assumptions, input requirements, and units inside the relevant engine.
- Version every implementation and document deviations or interpretation decisions.
- Record factor provenance and data quality.
- Do not compare or aggregate outputs from different methods without documented harmonization.
- Clearly distinguish implemented methods from proposed roadmap items.

## Planned evaluations

- **SCI / ISO/IEC 21031:** a software carbon-intensity method with its own functional unit and requirements.
- **GHG Protocol:** accounting and reporting framework alignment; not assumed to be a single calculation engine.
- **ITU-T L.1410:** ICT life-cycle assessment approach requiring its own scope, data model, and assessment rules.
