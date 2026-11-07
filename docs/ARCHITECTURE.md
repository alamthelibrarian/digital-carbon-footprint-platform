# Architecture

## Design goals

DCFP is a method-aware platform for digital carbon footprint assessment. It separates the user interface, shared platform services, and calculation engines so that methods can evolve independently.

## Proposed layers

1. **Presentation (Astro):** method selection, input forms, results, explanations, and accessible reporting views.
2. **Application services (TypeScript):** validation, orchestration, provenance, persistence adapters, and export.
3. **Calculation engines:** isolated, versioned implementations for each methodology.
4. **Reference data:** emission factors and supporting datasets with source, geography, period, unit, and quality metadata.

## Method registry

The initial registry is maintained in `src/lib/methods.ts`. Each entry separates its route slug from a stable method identifier and records its implementation state. The DPC v1.0 registry identifier matches the identifier returned by its calculation engine and used for emission-factor applicability. Registry entries for planned methods do not imply that those engines exist.

## Engine boundary

Every engine must declare its method identifier, version, supported scope, required inputs, functional unit, and limitations. It must return a result that identifies the exact method version used.

The shared platform must not rewrite, blend, or silently harmonize method-specific equations. Comparisons between methods require an explicit, documented harmonization process.

## Shared result envelope and adapters

The platform-level result envelope is defined in `docs/RESULT-CONTRACT.md`. Each calculation engine retains its native output and exposes a separate adapter into that envelope. The adapter may map and label outputs but must not recalculate, reinterpret, or harmonize method-specific values. The initial DPC adapter lives in `engines/dpc-v1/result-adapter.ts`.

## Result provenance

A result should retain:

- Method identifier and version
- Reporting period and geography
- Functional unit and system boundary
- Activity data and units
- Emission-factor value, unit, source, and applicable period
- Assumptions, exclusions, and data-quality notes
- Calculation timestamp and software version

## Technology decisions

The initial web application uses Astro and TypeScript. Python may be introduced later as a separate service if advanced life-cycle assessment datasets, batch processing, or scientific computing needs justify it. It is not required for the initial platform foundation.

## Deployment separation

The public repository is a development project. Production deployments, databases, credentials, OAuth clients, and environment-specific configuration must be provisioned independently. Never commit secrets or production identifiers.
