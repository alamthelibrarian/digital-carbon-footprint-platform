# Contributing

Thank you for considering a contribution to the Digital Carbon Footprint Platform (DCFP).

The project is in early development. Interfaces and folder structures may change, and calculation methods must not be presented as validated until the required evidence is published.

## Ways to contribute

- Report reproducible bugs or documentation issues.
- Review method scope, units, boundaries, and assumptions.
- Add tests and independently verified calculation fixtures.
- Improve accessibility, usability, and documentation.
- Propose new methods through an issue before implementation.

## Before contributing

- Discuss substantial changes through a GitHub issue first.
- Keep each methodology's equations, assumptions, factors, and result interpretation isolated.
- Include primary source references for formulas, factors, and datasets.
- State units explicitly and add tests for calculation logic.
- Preserve provenance: source, geography, unit, reference period, and data-quality information.
- Never commit credentials, personal data, or production configuration.
- Do not copy third-party workbook content, factor tables, standards text, or graphics without confirming permission.
- Do not silently change a source methodology's formula to make it more intuitive. Document deviations as a separate, explicitly named variant.

## Pull request checklist

A pull request should explain:

1. What changed and why.
2. Which method and version are affected.
3. Which source documents support the change.
4. The units, system boundary, functional unit, and reporting period involved.
5. Tests added or updated, including expected values and their provenance.
6. Any assumptions, deviations, limitations, or licensing concerns.

## Calculation validation

A passing unit test alone does not validate a method. Where a source workbook exists, regression tests should compare outputs against independently checked workbook calculations. Validation claims require documented test fixtures, coverage of edge cases, and review evidence.

## Code quality

Run the following before submitting:

```bash
npm run typecheck
npm test
npm run build
```

Keep changes focused and avoid unrelated formatting or dependency updates.
