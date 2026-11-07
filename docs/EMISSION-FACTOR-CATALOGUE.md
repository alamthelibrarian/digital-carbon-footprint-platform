# Emission Factor Catalogue Specification

**Status:** Initial contract; metadata and validation are implemented in `src/lib/emission-factors.ts`. Persistence, user interfaces, import/export, and bundled datasets are not implemented.

## Purpose

The catalogue provides a shared way to describe emission factors without assuming that a factor is valid for every calculation method. It stores provenance and applicability metadata; it does not decide which factor a method must use.

A factor is usable by an engine only when the engine's method identifier is explicitly included in `applicableMethods` and the factor's boundary, geography, time period, unit, and source are suitable for that method.

## Record fields

| Field | Meaning | Rule |
|---|---|---|
| `id` | Stable identifier within the catalogue | Required; unique within one catalogue |
| `name` | Human-readable factor name | Required |
| `category` | Factor category, such as grid electricity or network energy intensity | Required; category vocabulary is method/domain governed |
| `value` | Numeric factor value | Required; finite and non-negative; a value of zero requires an explanatory evidence/rationale note |
| `unit` | Explicit denominator/numerator unit | Required; do not infer or silently convert |
| `source.name` | Publisher or dataset/source title | Required |
| `source.publisher` | Publishing organisation | Optional |
| `source.url` | Source location | Optional; when supplied, must be HTTP(S) |
| `source.publishedYear` | Publication year | Optional |
| `source.accessedAt` | Date source was accessed | Optional |
| `geography` | Applicability geography | Optional in the initial type; should be supplied whenever the source is geographically bounded |
| `referencePeriod` | Year or complete date range represented by the factor | Optional in the initial type; should be supplied whenever known |
| `dataKind` | Nature of the data | Required: `measured`, `provider-reported`, `secondary-literature`, or `proxy` |
| `dataQuality` | Qualitative data-quality rating | Optional: `high`, `medium`, or `low` |
| `applicableMethods` | Explicit method identifiers | Required; at least one |
| `license` | Licence or reuse terms | Optional in the type; required before redistribution where licensing applies |
| `notes` | Context, caveats, or transformation details | Optional generally; required to explain and evidence a zero factor value |

## Data kind and quality

- **Measured:** derived from direct measurement or monitoring. Record the measurement context and period in notes or supporting metadata.
- **Provider-reported:** published by a service, infrastructure, or technology provider. Record provider and service/region scope.
- **Secondary literature:** taken from a publication or compiled dataset rather than measured by this project.
- **Proxy:** substituted for a missing or unavailable value. Explain why it is appropriate and identify the original proxy source.

Data kind describes origin; data quality describes confidence in its suitability and completeness. They are not interchangeable. A measured or provider-reported value is not automatically high quality, and a proxy is not automatically low quality: rate quality from documented suitability, representativeness, completeness, and uncertainty rather than from the data-kind label alone.

## Geography and reference period

Use the narrowest defensible geography level: `site`, `grid-zone`, `provider-region`, `region`, `country`, or `global`. The geography name should be understandable and a code may be supplied where a stable code exists.

Use either a calendar year or a complete inclusive date range. Do not imply that a factor is current merely because it is the latest value in a local file. Preserve the source's actual reference period.

## Method compatibility

Method identifiers are explicit, version-aware identifiers, for example:

- `dpc-carbon-footprint-toolkit` (engine version `1.0`)
- `sci` (engine version tracked separately; only when a corresponding engine and compatibility review exist)
- `itu-t-l1410` (only when the applicable study scope supports it)

These are examples of identifier style, not a declaration that those methods are implemented. A shared unit does not establish methodological equivalence. An engine must check method applicability and any additional method-specific constraints before using a factor.

## Licensing and redistribution

A source being publicly accessible does not automatically permit copying its data into this repository. Before adding a factor dataset, record its licence or terms, attribution requirements, redistribution permissions, and any restrictions. If rights are unclear, keep the source reference and do not bundle the factor value.

The catalogue contract does not grant rights to third-party datasets, standards, workbooks, or publications.

## Validation currently implemented

`validateEmissionFactorRecord(input)` and `validateEmissionFactorCatalogue(records)` currently validate required identity/value/unit fields, source name and optional URL/year, data kind, optional quality, explicit method identifiers, optional geography, optional reference period, duplicate IDs, and an explanatory note whenever a factor value is zero. Custom factor identifiers remain allowed; method-specific engines are responsible for interpreting their own identifiers.

A missing factor must remain absent or unresolved; it must not be encoded as a zero-valued factor. Zero is accepted only when its source and explanatory note support a genuine zero for the stated boundary and period. Validation is structural, not scientific. It does not verify source authenticity, factor correctness, unit compatibility with an engine, methodological suitability, geographic representativeness, licensing, or data-quality ratings. Those checks require review and method-specific validation.

## Example record

The following is a fictional structural example. It is not a recommended factor and must not be used in a real assessment.

```json
{
  "id": "example-grid-factor-2025",
  "name": "Example electricity grid emission factor",
  "category": "grid-electricity",
  "value": 0.42,
  "unit": "kgCO2e/kWh",
  "source": {
    "name": "Example dataset",
    "publisher": "Example publisher",
    "url": "https://example.org/dataset",
    "publishedYear": 2025,
    "accessedAt": "2026-11-07"
  },
  "geography": {
    "level": "country",
    "name": "Example country",
    "code": "XX"
  },
  "referencePeriod": {
    "year": 2025
  },
  "dataKind": "secondary-literature",
  "dataQuality": "medium",
  "applicableMethods": [
    "example-method@1.0"
  ],
  "license": "Example licence; verify before reuse",
  "notes": "Fictional example for schema illustration only."
}
```

## Planned extensions

Potential future work includes controlled category/unit vocabularies, source citation identifiers, factor versioning and supersession, import/export formats, approval status, audit history, and method-specific compatibility validators. These should be added without weakening the explicit method applicability rule.
