# Roadmap

The roadmap is directional. A method is not considered implemented until its calculation logic, automated tests, documentation, provenance handling, and validation evidence are available.

## Phase 0 — Public foundation

- [x] Establish public repository and project identity
- [x] Document architecture and method-isolation principles
- [x] Add automated checks and contribution guidance
- [ ] Establish versioning and release policy

## Phase 1 — DPC v1.0

- [x] Audit the source toolkit's inputs, formulas, units, factors, and limitations
- [x] Implement an independent, traceable DPC v1.0 calculation engine
- [x] Build reference test cases and regression tests, including a synthetic workbook comparison fixture
- [x] Document independent implementation decisions and attribution
- [ ] Complete validation against permitted authoritative reference cases and independent review

## Phase 2 — Platform capabilities

- [ ] Method registry and metadata
- [x] Define the method-aware emission-factor provenance catalogue contract and structural validation
- [ ] Add method-specific input validation and data-quality reporting across engines
- [ ] Result persistence and reproducible platform-level exports
- [ ] Adapt method-specific results to the shared result envelope through explicit adapters

## Phase 3 — Additional methods

- [ ] Evaluate and implement SCI / ISO/IEC 21031 as a separate engine
- [ ] Evaluate GHG Protocol alignment and reporting features
- [ ] Research ITU-T L.1410 / LCA requirements before implementation

## Release gate

No method should be labelled available until scope, version, inputs, functional unit, boundary, equations, factors, tests, limitations, and source references are documented.
