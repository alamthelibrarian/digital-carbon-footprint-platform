# Release and versioning policy

## Project status

DCFP is in pre-1.0 development. Releases in the 0.x series are development previews and must not be presented as validated tools for formal reporting, regulatory compliance, or audited disclosure.

The initial calculation method is an independent implementation of the Digital Preservation Coalition (DPC) Carbon Footprint Toolkit v1.0. DCFP is not an official DPC product and is not endorsed by DPC.

## Versioning

DCFP follows Semantic Versioning (SemVer):

- **0.y.z:** pre-1.0 development. Minor releases may introduce features or change interfaces; patch releases contain backwards-compatible fixes.
- **1.0.0:** reserved for a stable platform release after the release criteria below are met.
- **1.y.z and later:** follow SemVer compatibility rules.

A release tag must use the `v` prefix (for example, `v0.1.0`) and must point to the exact commit reviewed for that release.

## Release types

- **Pre-release:** appropriate for early development previews such as the first `v0.1.0`. GitHub's pre-release flag must be enabled.
- **Stable release:** only when the project has met its stated stability and validation requirements.

Release notes should identify the release status, supported functionality, notable changes, known limitations, and upgrade or migration considerations where applicable.

## Minimum release checklist

Before publishing a release:

1. Confirm the working tree and target commit are the intended release state.
2. Run `npm run typecheck`, `npm test`, and `npm run build` successfully.
3. Confirm the GitHub Actions CI workflow passes for the exact release commit.
4. Review dependency audit results and disclose unresolved material vulnerabilities.
5. Check documentation, license and third-party attribution.
6. Confirm that calculation formulas, units, scope, assumptions, and limitations are documented.
7. State validation status accurately. Passing software tests does not establish scientific or methodological validity.
8. Publish release notes and mark a 0.x development release as a pre-release.

## DPC v1.0 validation status

The DPC v1.0 engine has automated tests and regression fixtures. These are software verification measures, not proof of independent methodological validation. Until permitted authoritative reference cases have been checked and independent review evidence is documented, describe the engine as **not independently validated** and do not claim suitability for formal reporting, compliance, or audited disclosure.

## Tag and release discipline

- Do not move or reuse a published version tag.
- Prefer annotated tags for releases.
- Do not publish a release from a commit whose required CI checks have not passed.
- If a release contains a material defect, publish a new patch version and document the correction rather than silently replacing the release artifact.
