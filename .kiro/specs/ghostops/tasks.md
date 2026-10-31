# Implementation Plan

## Overview

This plan breaks the GhostOps implementation into 14 sequential milestones. Each milestone builds on the previous. Codex should complete each task group before moving to the next. All tasks assume the project is TypeScript-only, Vite-based, browser-only, and tested with Vitest + fast-check.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5"] },
    { "wave": 6, "tasks": ["6", "7"] },
    { "wave": 7, "tasks": ["8"] },
    { "wave": 8, "tasks": ["9"] },
    { "wave": 9, "tasks": ["10"] },
    { "wave": 10, "tasks": ["11"] },
    { "wave": 11, "tasks": ["12"] },
    { "wave": 12, "tasks": ["13"] },
    { "wave": 13, "tasks": ["14"] }
  ]
}
```

Tasks 1–7 form the core pipeline and must be completed in order. Tasks 8–10 are the test layer and depend on the complete pipeline. Task 11 (UI) depends on Tasks 1–10. Tasks 12–14 are finishing work. Tasks 6 (reconstructor) and 7 (serialiser) can be developed in parallel after Task 5.

## Tasks

---

- [ ] 1. Project scaffold and shared types
  - Initialise a Vite + TypeScript project at the workspace root with `"strict": true` in `tsconfig.json`
  - Install exact-version dev dependencies: `vite`, `typescript`, `vitest`, `@vitest/coverage-v8`, `fast-check`, `@fast-check/vitest`
  - Create `src/types/index.ts` containing all shared types: `SourceReference`, `EvidenceItem`, `SkippedRecord`, `IngestionSummary`, `ClaimClassification`, `Claim`, `UnsupportedRootCauseNotice`, `Gap`, `TimelineEntry`, `AnalysisResult`, `Result<T,E>`
  - Add `index.html` with the CSP `<meta>` tag as specified in `security-guidelines.md`
  - Add `vitest.config.ts` with coverage thresholds matching `deterministic-testing-approach.md`
  - Create the folder structure: `src/types/`, `src/ingester/`, `src/ledger/`, `src/engine/`, `src/verifier/`, `src/reconstructor/`, `src/serialiser/`, `src/ui/`, `src/scenarios/`, `tests/unit/`, `tests/property/`, `tests/integration/`, `tests/fixtures/`
  - **Requirement references**: architecture-principles.md, security-guidelines.md
  - **Acceptance**: `npx tsc --noEmit` passes with zero errors; folder structure matches the spec

- [ ] 2. Evidence_Ledger implementation
  - Implement `src/ledger/EvidenceLedger.ts` with the interface defined in the design document
  - Apply `Object.freeze()` to each `EvidenceItem` at insertion time
  - Implement `getBySourceType`, `getByTimeRange`, `getById`, `itemCount`, `nullTimestampCount`
  - Maintain insertion-order array sorted by timestamp (nulls last) using ISO 8601 lexicographic compare
  - Expose a frozen `gaps` array that can be appended by the Claim_Verifier post-analysis
  - **Requirement references**: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
  - **Acceptance**: `tests/unit/ledger.test.ts` passes; mutation attempt throws TypeError

- [ ] 3. Evidence_Ingester implementation
  - Implement `src/ingester/Ingester.ts` with `ingest(file: File): Promise<Result<IngestionSummary, IngestionError>>`
  - Implement format detection from file content (not file extension) for all four formats
  - Implement parsers for: plain-text log (line-per-record), JSON CI output, JSON deployment event, Git log
  - Enforce 50 MB file-size limit before reading
  - Apply JSON safety checks (`__proto__`, `constructor`, `prototype` key rejection)
  - Preserve `rawExcerpt` verbatim; apply `Object.freeze()` before ledger insertion
  - Write unparseable records to `skippedRecords` with verbatim raw text and parse error
  - **Requirement references**: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1, 10.3
  - **Acceptance**: `tests/unit/ingester.test.ts` passes for all four formats plus error cases

- [ ] 4. Analysis_Engine implementation
  - Implement `src/engine/AnalysisEngine.ts` as a pure function: `analyze(ledger: Readonly<EvidenceLedger>): CandidateClaim[]`
  - Implement all seven documented rules (R-01 through R-07) as named, individually testable functions
  - Apply rules in fixed order R-01 → R-07 with no branching based on runtime state
  - Do not use `Date.now()`, `Math.random()`, or any import that reads external state
  - Document each rule's evidence pattern in a code comment citing the rule ID
  - **Requirement references**: Requirements 8.1, 8.2, 8.3, 8.4
  - **Acceptance**: `tests/unit/engine.test.ts` passes; same ledger input produces identical output on two calls

- [ ] 5. Claim_Verifier implementation
  - Implement `src/verifier/ClaimVerifier.ts` with `verify(candidates, ledger): Result<VerifierOutput, VerifierError>`
  - Implement the three-tier classification algorithm (OBSERVED / INFERRED / HYPOTHESIS) as specified in the design
  - Enforce Confidence_Score rules: OBSERVED = 1.0; HYPOTHESIS ≤ 0.5
  - Implement the root-cause gate: reject single-source or same-type root-cause candidates with `UnsupportedRootCauseNotice`
  - Generate Gap records for: empty source types, incomplete causal chains, null timestamps used in time-based rules
  - Reject any Claim whose SourceReferences are not all present in the Evidence_Ledger
  - **Requirement references**: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.5, 5.1, 5.2
  - **Acceptance**: `tests/unit/verifier.test.ts` passes; root-cause gate unit tests cover all three failure modes

- [ ] 6. Timeline_Reconstructor implementation
  - Implement `src/reconstructor/TimelineReconstructor.ts` as a pure function: `reconstruct(claims, gaps): TimelineEntry[]`
  - Sort OBSERVED + INFERRED claims by timestamp ascending; nulls last
  - Apply tie-breaking by sourceType priority: `git` > `deployment` > `ci` > `log`
  - Insert Gap markers at the appropriate positions in the sorted sequence
  - Place HYPOTHESIS claims in a separate trailing block after all Gap markers
  - Use a stable sort (standard `Array.prototype.sort` with deterministic comparator)
  - **Requirement references**: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
  - **Acceptance**: `tests/unit/reconstructor.test.ts` passes; same input produces identical output on two calls

- [ ] 7. Serialiser implementation
  - Implement `src/serialiser/Serialiser.ts` with `serialise` and `deserialise` functions
  - Include `"schemaVersion": 1` in all exported JSON
  - Compute `ledgerHash` using `crypto.subtle.digest('SHA-256', ...)` and store as hex string
  - On deserialise: validate schema version, validate JSON safety, recompute and compare `ledgerHash`
  - On hash mismatch: return a `DeserialiseError` with variant `'tampered'`
  - **Requirement references**: Requirements 10.5, 11.1, 11.2, 11.3, 11.4, 11.5
  - **Acceptance**: `tests/unit/serialiser.test.ts` passes; tamper detection test passes

- [ ] 8. Property tests
  - Implement `tests/fixtures/arbitraries.ts` with all arbitraries defined in `deterministic-testing-approach.md`
  - Implement `tests/property/determinism.prop.test.ts` — Property 1 (determinism)
  - Implement `tests/property/roundtrip.prop.test.ts` — Property 2 (round-trip serialisation)
  - Implement `tests/property/invariants.prop.test.ts` — Properties 3–6, 9, 10 (invariants and metamorphic)
  - All property tests must pass with the default fast-check number of runs (100)
  - **Requirement references**: Requirements 8.1, 8.3, 11.4
  - **Acceptance**: `npx vitest --run tests/property/` passes with zero failures

- [ ] 9. Demo Scenarios
  - Create `src/scenarios/scenario-deployment-outage.json` — incident archetype: deployment-caused outage; triggers R-01; includes ≥1 OBSERVED, ≥1 INFERRED, ≥1 HYPOTHESIS, ≥1 Gap
  - Create `src/scenarios/scenario-dependency-conflict.json` — incident archetype: dependency version conflict via CI; triggers R-03; same coverage requirements
  - Create `src/scenarios/scenario-resource-exhaustion.json` — incident archetype: cascading failure from resource exhaustion; triggers R-04 + R-05; same coverage requirements
  - Each scenario file includes `evidenceBundle`, `expectedClaims`, `expectedTimeline`, `expectedGaps`, `description`
  - Implement `src/scenarios/validateScenario.ts` that runs the full pipeline and deep-equals actual vs expected output
  - **Requirement references**: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
  - **Acceptance**: `npx vitest --run tests/integration/scenarios.test.ts` passes for all three scenarios

- [ ] 10. Integration tests
  - Implement `tests/integration/scenarios.test.ts` — loads each scenario, runs full pipeline, asserts deep-equal to expected output, then runs pipeline a second time and asserts identical output (determinism check)
  - Implement `tests/integration/pipeline.test.ts` — loads a multi-file Evidence_Bundle (all four formats), runs full pipeline, asserts structural correctness of Claims, Gap list, and timeline
  - **Requirement references**: Requirements 8.1, 9.2, 9.6
  - **Acceptance**: `npx vitest --run tests/integration/` passes with zero failures

- [ ] 11. Browser UI implementation
  - Implement `src/ui/EmptyState.ts` — rendered when Evidence_Ledger has zero items
  - Implement `src/ui/FileDropZone.ts` — file picker with File System Access API and `<input>` fallback
  - Implement `src/ui/IngestionSummaryPanel.ts` — shows files loaded, items produced, skipped records
  - Implement `src/ui/TimelineView.ts` — vertically scrolling list of TimelineEntry items with OBSERVED/INFERRED/HYPOTHESIS badges
  - Implement `src/ui/ClaimDetail.ts` — click-to-expand detail panel with sources and raw excerpts
  - Implement `src/ui/GapReport.ts` — gap report section below timeline
  - Implement `src/ui/RootCausePanel.ts` — root-cause Claim or UnsupportedRootCauseNotice with distinct styling
  - Implement `src/ui/ScenarioLoader.ts` — three buttons to load each Demo_Scenario
  - Implement `src/ui/ExportButton.ts` — serialises session to JSON and triggers browser file download
  - All evidence text rendered with `element.textContent`; no `innerHTML` with user-controlled values
  - Apply CSS classes: `.badge-observed` (blue), `.badge-inferred` (amber), `.badge-hypothesis` (grey), `.unsupported-root-cause` (red border), `.gap-marker` (dashed border)
  - **Requirement references**: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
  - **Acceptance**: Opening `index.html` in a browser shows empty state; loading a Demo_Scenario renders a complete timeline

- [ ] 12. Kiro hooks
  - Create `.kiro/hooks/ts-strict-check.json` — PostFileSave hook on `src/.*\.ts$` running `npx tsc --noEmit --strict`
  - Create `.kiro/hooks/integrity-property-tests.json` — PostFileSave hook on `src/(engine|verifier|ledger)/.*\.ts$` running `npx vitest --run tests/property/`
  - Create `.kiro/hooks/scenario-validation.json` — PostFileSave hook on `src/scenarios/.*\.json$` running `npx vitest --run tests/integration/scenarios.test.ts`
  - Create `.kiro/hooks/security-lint.json` — PostFileSave hook on `src/ui/.*\.ts$` running ESLint with the `no-restricted-properties` rule blocking `innerHTML`
  - Create `.kiro/hooks/full-test-suite-pre-commit.json` — PreToolUse hook on `execute_bash` running `npx vitest --run`
  - **Requirement references**: design.md Kiro Hooks section
  - **Acceptance**: Hook JSON files are valid; `npx tsc --noEmit` confirms hook files do not affect application type-checking

- [ ] 13. README and documentation
  - Write `README.md` at the workspace root with: project description, folder structure, setup instructions (`npm install`, `npm run dev`, `npm test`), supported input formats, three-tier claim taxonomy explanation, "What this tool does and does not do" section (as required by `truthful-technical-claims-policy.md`), and instructions for loading Demo_Scenarios
  - Write `docs/analysis-rules.md` documenting each of the seven Analysis_Engine rules (R-01 through R-07) with their evidence patterns, thresholds, and the Claim type they produce
  - **Requirement references**: truthful-technical-claims-policy.md
  - **Acceptance**: README contains the required "What this tool does and does not do" section; all format support claims enumerate tested formats

- [ ] 14. Final validation
  - Run `npx vitest --run --coverage` and verify all subsystem coverage thresholds are met
  - Run `npx tsc --noEmit` and verify zero errors
  - Load all three Demo_Scenarios in the browser and verify: timeline renders correctly, Gap report is visible, root-cause panel shows correct classification, clicking a Claim shows the detail panel with source references
  - Verify the Export button produces a valid JSON file that re-imports without a tamper warning
  - **Requirement references**: all requirements
  - **Acceptance**: Zero test failures, zero TypeScript errors, all three Demo_Scenarios render correctly in the browser

## Notes

- All `npm` dependencies must be pinned to exact versions (no `^` or `~`). Run `npm audit` before finalising `package.json`.
- Never use `innerHTML` with user-controlled content. All evidence text must use `element.textContent`.
- The Analysis_Engine must be a pure function with no side effects. Do not use `Date.now()` or `Math.random()` anywhere in the engine, verifier, or reconstructor.
- Run `npx vitest --run` (not `npx vitest`) in all hook and CI contexts to avoid watch mode blocking.
- Demo Scenario JSON files must be self-contained — no network requests to load them.
- The Kiro hooks in Task 12 configure `.kiro/hooks/*.json` files only; no application code is produced in that task.
- See `.kiro/steering/` for detailed guidance on architecture principles, evidence integrity rules, security requirements, testing approach, and truthful technical claims policy.
