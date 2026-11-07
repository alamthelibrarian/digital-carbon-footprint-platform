# DPC v1.0 formula and workbook audit

**Source workbook inspected:** `Carbon Footprint Calculation Tool v01_0(1).xlsx`  
**Workbook version shown in Summary:** last updated 16 September 2026  
**Workbook sheets:** Summary, On Premise, In Cloud, Networking, Website Use, Travel, Datasheet, Grid factors, Cloud factors, Read me.

This document records the workbook structure and formula behaviour as an implementation reference. It does not reproduce the workbook, its factor tables, or its visual layout. The DPC publication remains the authoritative source. Confirm reuse terms before redistributing any third-party data or content.

## 1. Calculation boundary

The workbook states that it is intended for an initial indicative estimate for digital archives, not formal carbon reporting, compliance, or audited disclosure. It states that embodied carbon is not currently included in the calculation model.

The reference period is one year. The workbook uses activity data, energy-intensity assumptions, electricity-emission factors, and direct annual carbon values supplied for cloud services and travel.

## 2. Sheet-to-engine mapping

| Workbook sheet | Role in calculation | DCFP engine area |
|---|---|---|
| Summary | Aggregates category totals | Result aggregation |
| On Premise | Server and storage energy/emissions | `on-premise` |
| In Cloud | Provider-reported annual emissions | `cloud` |
| Networking | Data transfer between service machines | `networking` |
| Website Use | End-user website traffic estimate | `website-use` |
| Travel | Externally calculated travel emissions | `travel` |
| Datasheet | Default assumptions and proxy parameters | Versioned assumptions |
| Grid factors | Electricity factors by country | User-selectable factor references |
| Cloud factors | Provider/region reference factors | Reference data (subject to rights review) |
| Read me | Intended use and limitations | Method documentation |

## 3. Formula transcription

### 3.1 On Premise

For each populated server row:

- Server power (W): `((maxPowerW - idlePowerW) × meanUtilisation) + idlePowerW`
- Daily storage power (W): `storageCapacityTB × storageEnergyWhPerTBh`
- Combined power (W): `serverPowerW + dailyStoragePowerW`
- Annual energy including PUE (kWh/year): `combinedPowerW × 24 × 365 ÷ 1000 × PUE`
- Electricity emissions (kgCO2e): `annualEnergyKWh × gridFactorKgCO2ePerKWh`

The workbook groups server rows into five DPC RAM-aligned activity categories: Acquisition, Transfer and Ingest; Bitstream Preservation; Content Preservation; Metadata Management; and Discovery and Access. Each category total is the subtotal of its row-level emissions.

The source workbook uses a linear power curve between idle and maximum power. The utilisation input is expected as a fraction (for example, 20% as 0.20).

### 3.2 In Cloud

The workbook accepts annual emissions in kgCO2e for cloud services as supplied by a provider or estimated externally. It does not calculate emissions from instance-hours in this sheet. The Summary sheet adds the entered Data Centres/Servers and Networking cloud totals to their corresponding on-premise totals.

### 3.3 Networking

For each activity row:

`((transmittedMBPerDay + receivedMBPerDay) ÷ 1000) × (365 ÷ 12) × networkEnergyIntensityKWhPerGB × gridFactorKgCO2ePerKWh`

The workbook groups rows into five activity categories and subtotals each group.

**Important parity note:** the workbook formula uses `365/12`, although the result column is labelled annual carbon footprint (kgCO2e). This implementation must first reproduce the workbook formula exactly for parity. Any alternative annualized interpretation must be a separately named, explicitly selected method variant; never silently replace the source formula.

### 3.4 Website Use

- Data volume (GB): `((averagePageSizeKB ÷ 1000) × annualVisits + (averageDownloadSizeMB × annualDownloads)) ÷ 1000`
- Network intensity midpoint (kWh/GB): simple average of the fixed-line and mobile network intensities in the Datasheet.
- Network energy (kWh): `dataVolumeGB × midpointIntensityKWhPerGB`
- Emissions (kgCO2e): `networkEnergyKWh × meanGlobalGridFactorKgCO2ePerKWh`

The workbook also exposes low and high intensity values based on fixed-line-only and mobile-only assumptions. Those are sensitivity bounds, not the default midpoint calculation.

### 3.5 Travel

The user enters externally calculated emissions. The workbook converts tonnes to kilograms using `tCO2e × 1000`; values already in kgCO2e are entered directly. The total is the sum of the kgCO2e rows.

### 3.6 Summary

The total is the sum of the combined Data Centres/Servers, Networking, Website Use, and Travel categories. Category values are aggregated from the sheets above.

## 4. Reference assumptions observed

The Datasheet includes default values for fixed-line and mobile network energy intensity, a mobile-traffic share, a global electricity factor, and end-user device power proxies. These values must be stored as versioned method assumptions with provenance. Do not silently treat them as current universal factors.

The Grid factors sheet includes sample country factors but does not list Indonesia. It provides an “Other countries” entry. DCFP must not silently substitute an Indonesia-specific value: users must be able to select a documented factor or supply a custom factor with source, unit, geography, and reference period.

The Cloud factors sheet contains AWS, Google Cloud, and Azure region data. Do not copy these datasets into the public repository until their provenance and redistribution terms have been checked. The engine should support explicit provider-reported emissions or a separately sourced factor dataset.

## 5. Implementation and validation gates

Before marking this engine implemented:

1. Transcribe each formula into a pure TypeScript function.
2. Define units and validation rules for every input.
3. Keep the source workbook's `365/12` networking behaviour as the default parity mode.
4. Build regression fixtures from independently checked workbook examples.
5. Compare calculated outputs against Excel-calculated values, not only against hand calculations.
6. Test empty rows, zero values, invalid units, missing factors, and custom factors.
7. Preserve source, confidence, notes, and factor provenance in every result.
8. Document the exclusion of embodied carbon and the tool's indicative-use limitation.
9. Review licensing and attribution before publishing any copied source data or workbook content.

**Current status:** formula audit documented; an initial TypeScript engine and automated tests are present. Coverage includes a synthetic workbook regression fixture recalculated with LibreOffice Calc, multiple rows across all five activity categories, cloud-category separation, an empty assessment, zero-valued activity inputs, and rejection of non-finite derived results caused by numeric overflow. This is partial verification only. Microsoft Excel comparison, fuller edge-case coverage, complete source-method review, and independent expert review remain outstanding. Do not describe the method as fully validated or use it for formal reporting.
