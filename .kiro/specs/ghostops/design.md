# Design Document

## Overview

GhostOps is a browser-only, TypeScript-based incident reconstruction platform. It ingests exported artefacts from a software incident (logs, CI output, deployment events, Git records), runs a deterministic analysis pipeline, and renders a verified, evidence-grounded timeline in a browser UI.

The platform's defining property is epistemic honesty: every claim is classified by the strength of the evidence behind it, missing evidence is surfaced explicitly, and unsupported root-cause assertions are refused. There is no backend server. All computation happens client-side using standard browser APIs.

---

## Architecture

### System Context

```
Analyst (browser)
  │
  ├── File Picker (HTML input or File System Access API)
  │     │
  │     ▼
  │   Evidence_Ingester
  │     │  parses & normalises
  │     ▼
  │   Evidence_Ledger (immutable, in-memory)
  │     │
  │     ▼
  │   Analysis_Engine
  │     │  produces candidate Claims
  │     ▼
  │   Claim_Verifier
  │     │  classifies, gates, generates Gaps
  │     ▼
  │   Timeline_Reconstructor
  │     │  orders, inserts Gap markers
  │     ▼
  │   UI Renderer
  │     │  renders timeline, ledger view, gap report
  │     ▼
  └── Browser DOM
```

Data flows in one direction. No subsystem writes upstream.

---

## Components and Interfaces

See the sub-sections below for each component's interface contract. All TypeScript interfaces are defined in `src/types/` and shared across subsystems.

---

## Data Models

The canonical data structures for the platform are defined as TypeScript types in `src/types/index.ts`. The key models are:

- **EvidenceItem**: A single normalised evidence record with id, timestamp, sourceType, source reference, and verbatim rawExcerpt.
- **SkippedRecord**: A record the ingester could not parse, preserved verbatim with its parse error.
- **IngestionSummary**: Per-file summary of items produced and records skipped.
- **Claim**: A verified statement with classification (OBSERVED / INFERRED / HYPOTHESIS), confidenceScore, and non-empty sources array.
- **UnsupportedRootCauseNotice**: Replaces a rejected root-cause Claim; contains the candidate text, found evidence, and blocking gaps.
- **Gap**: A missing evidence record with description, missingSourceType, time window, and affected claim id.
- **TimelineEntry**: A discriminated union of `{ kind: 'claim' }` and `{ kind: 'gap-marker' }` entries.
- **AnalysisResult**: The complete output of one analysis session — claims, root-cause notice, gaps, timeline, and ledger hash.

All model fields use TypeScript `readonly` to enforce immutability at compile time.

---

## Component Design

### 1. Shared Types (`src/types/`)

All subsystems share a single type contract. Key types:

```typescript
// Source reference — points back to the originating file
type SourceReference = {
  readonly fileName: string;
  readonly lineNumber: number;   // 1-indexed
  readonly byteOffset: number;   // 0-indexed
};

// A single normalised evidence record
type EvidenceItem = {
  readonly id: string;           // UUID v4
  readonly timestamp: string | null;  // ISO 8601 or null
  readonly sourceType: 'log' | 'ci' | 'deployment' | 'git';
  readonly source: SourceReference;
  readonly rawExcerpt: string;   // verbatim, immutable
};

// Evidence item that could not be parsed
type SkippedRecord = {
  readonly fileName: string;
  readonly rawText: string;
  readonly parseError: string;
};

// Result of ingesting one file
type IngestionSummary = {
  readonly fileName: string;
  readonly itemsProduced: number;
  readonly skippedRecords: SkippedRecord[];
};

// Claim types
type ClaimClassification = 'OBSERVED' | 'INFERRED' | 'HYPOTHESIS';

type Claim = {
  readonly id: string;
  readonly text: string;
  readonly classification: ClaimClassification;
  readonly confidenceScore: number;  // always 1.0 for OBSERVED
  readonly sources: [SourceReference, ...SourceReference[]]; // non-empty
  readonly isRootCause: boolean;
};

// Unsupported root-cause notice (replaces a rejected root-cause Claim)
type UnsupportedRootCauseNotice = {
  readonly candidateText: string;
  readonly foundEvidence: SourceReference[];
  readonly missingGaps: Gap[];
};

// A gap in evidence
type Gap = {
  readonly id: string;
  readonly description: string;
  readonly missingSourceType: EvidenceItem['sourceType'] | 'any';
  readonly timeWindow: { start: string | null; end: string | null };
  readonly affectedClaimId: string | null;
};

// Timeline entry
type TimelineEntry =
  | { kind: 'claim'; claim: Claim; timestamp: string | null }
  | { kind: 'gap-marker'; gap: Gap; at: string | null };

// Full analysis output
type AnalysisResult = {
  readonly claims: Claim[];
  readonly rootCauseNotice: UnsupportedRootCauseNotice | null;
  readonly gaps: Gap[];
  readonly timeline: TimelineEntry[];
  readonly ledgerHash: string;  // SHA-256 of serialised Evidence_Ledger
};
```

All types use `readonly` to enforce immutability at compile time.

---

### 2. Evidence_Ingester (`src/ingester/`)

**Responsibility:** Accept raw file bytes, detect format, parse records, produce Evidence_Items.

**Interface:**
```typescript
interface Ingester {
  ingest(file: File): Promise<IngestionSummary>;
  getLedger(): EvidenceLedger;
}
```

**Format detection** is by file content, not file extension:

| Format | Detection heuristic |
|---|---|
| Plain-text log | Lines not parseable as JSON; each line treated as one record |
| JSON CI output | Root JSON array of objects with `step`, `status`, `timestamp` |
| JSON deployment event | Root JSON array of objects with `service`, `version`, `timestamp`, `event` |
| Git log | Lines matching `commit [0-9a-f]{40}` |

**Parsing pipeline per format:**

1. Read file as UTF-8 text.
2. Split into records (newline for logs/git, JSON item per array element for JSON formats).
3. For each record: extract timestamp (ISO 8601 or null), build SourceReference (fileName, lineNumber, byteOffset), copy rawExcerpt verbatim.
4. On parse failure: append to `skippedRecords`, continue.
5. Freeze each Evidence_Item with `Object.freeze()`.
6. Insert into Evidence_Ledger.

**Size limit:** Reject files > 50 MB before reading (check `file.size`).

**JSON safety:** Before parsing any JSON, scan for `__proto__`, `constructor`, `prototype` keys and reject if found.

---

### 3. Evidence_Ledger (`src/ledger/`)

**Responsibility:** Immutable, queryable store of Evidence_Items and Gaps.

**Interface:**
```typescript
interface EvidenceLedger {
  readonly items: ReadonlyArray<EvidenceItem>;
  readonly gaps: ReadonlyArray<Gap>;
  getBySourceType(type: EvidenceItem['sourceType']): EvidenceItem[];
  getByTimeRange(start: string, end: string): EvidenceItem[];
  getById(id: string): EvidenceItem | undefined;
  readonly itemCount: number;
  readonly nullTimestampCount: number;
}
```

**Internal structure:** An array of Evidence_Items sorted by timestamp (nulls last) at insertion time. Sorting uses `String.prototype.localeCompare` on ISO 8601 strings, which preserves lexicographic order. The sorted order is established once at insertion and never changed.

**Gap management:** Gaps are written by the Claim_Verifier after analysis. A separate mutable `gapList` is populated post-ingestion; the `gaps` property exposes a frozen copy.

---

### 4. Analysis_Engine (`src/engine/`)

**Responsibility:** Query the Evidence_Ledger and produce candidate Claims. Must be a pure function.

**Interface:**
```typescript
type AnalyzeFunction = (ledger: Readonly<EvidenceLedger>) => CandidateClaim[];

type CandidateClaim = {
  text: string;
  isRootCause: boolean;
  candidateSources: SourceReference[];
};
```

**Rule set (documented correlation rules):**

The engine applies a fixed, ordered set of named rules. Rules are evaluated in the order listed. Each rule inspects the Evidence_Ledger and emits zero or more CandidateClaims.

| Rule ID | Name | Evidence pattern | Claim type |
|---|---|---|---|
| R-01 | DeploymentPrecedesOutage | A deployment event is followed by an error log entry within 15 minutes | Root cause candidate |
| R-02 | CIFailurePrecedesDeployment | A failed CI step is followed by a deployment event within 60 minutes | INFERRED candidate |
| R-03 | DependencyVersionConflict | Two CI records reference the same dependency with different versions | INFERRED candidate |
| R-04 | ResourceExhaustionPattern | Log records show memory or disk usage > 90% followed by error entries | Root cause candidate |
| R-05 | CascadingFailure | Three or more error log entries from different services within 5 minutes | INFERRED candidate |
| R-06 | RollbackDetected | A deployment event with `event: 'rollback'` follows a deployment event with `event: 'deploy'` | OBSERVED candidate |
| R-07 | GitCommitPrecedesCI | A git commit timestamp precedes a CI run timestamp by < 10 minutes | OBSERVED candidate |

Each rule implementation is a named function that takes the ledger and returns CandidateClaims with their supporting SourceReferences. New rules can be added to the array without modifying existing rules.

**Determinism guarantee:** The engine iterates the ledger in insertion order (which is sorted). It applies rules in the fixed order above. It does not use `Date.now()` or `Math.random()`.

---

### 5. Claim_Verifier (`src/verifier/`)

**Responsibility:** Classify candidate claims, enforce the root-cause gate, generate Gaps.

**Interface:**
```typescript
interface ClaimVerifier {
  verify(
    candidates: CandidateClaim[],
    ledger: Readonly<EvidenceLedger>
  ): VerifierOutput;
}

type VerifierOutput = {
  claims: Claim[];
  rootCauseNotice: UnsupportedRootCauseNotice | null;
  gaps: Gap[];
};
```

**Classification algorithm:**

For each CandidateClaim:

1. Count supporting Evidence_Items (`n = candidateSources.length`).
2. Verify each SourceReference exists in the ledger.
3. If `n >= 1` and all sources directly match text in the Claim: classify OBSERVED, set confidenceScore to 1.0.
4. If `n >= 2` and no single source fully supports the claim: classify INFERRED, set confidenceScore = n / (n + gapCount).
5. Otherwise: classify HYPOTHESIS, set confidenceScore = min(n / (n + gapCount + 1), 0.5).

**Root-cause gate:**

If `isRootCause = true`:
- Require: at least 2 sources from at least 2 different `sourceType` values.
- Require: no Gap record would negate the causal chain.
- Require: classification is OBSERVED or INFERRED.
- If any requirement fails: emit `UnsupportedRootCauseNotice` and do not emit a Claim.

**Gap generation:**

- For each ingested source type that produced 0 Evidence_Items: emit a Gap of type "empty source type".
- For each INFERRED or HYPOTHESIS claim where a causal chain is incomplete: emit a Gap describing the missing evidence.
- For each record with a null timestamp that was used in a time-based rule: emit a Gap of type "unresolvable timestamp".

---

### 6. Timeline_Reconstructor (`src/reconstructor/`)

**Responsibility:** Order Claims and insert Gap markers into a final timeline.

**Interface:**
```typescript
type ReconstructFunction = (
  claims: ReadonlyArray<Claim>,
  gaps: ReadonlyArray<Gap>
) => TimelineEntry[];
```

**Ordering algorithm:**

1. Separate HYPOTHESIS claims from OBSERVED/INFERRED claims.
2. Sort OBSERVED/INFERRED claims by timestamp ascending. Nulls are placed at the end.
3. Tie-break by sourceType priority: `git` > `deployment` > `ci` > `log`.
4. Insert Gap markers at positions where a Gap's `timeWindow.start` falls in the sorted sequence.
5. Append HYPOTHESIS claims as a separate block at the end of the timeline.

**Determinism:** Uses a stable sort (TypeScript's `Array.prototype.sort` is stable in V8 and all modern engines). The comparator is a pure function of the two entries' timestamps and sourceTypes. No external state is consulted.

---

### 7. Serialiser (`src/serialiser/`)

**Responsibility:** Convert the full analysis result to JSON and restore it losslessly.

**Interface:**
```typescript
interface Serialiser {
  serialise(ledger: EvidenceLedger, result: AnalysisResult): string;
  deserialise(json: string): { ledger: EvidenceLedger; result: AnalysisResult };
}
```

**Round-trip guarantee:** The JSON schema is versioned (`"schemaVersion": 1`). All fields in `EvidenceItem`, `Claim`, `Gap`, and `TimelineEntry` are included. Arrays are serialised in their canonical order (same as in-memory). The output of `serialise(deserialise(serialise(x)))` must equal `serialise(x)`.

**Tamper detection:** Before serialising, compute `SHA-256(JSON.stringify(ledger.items))` using `crypto.subtle.digest`. Store the hex digest as `ledgerHash` in the export. On deserialise, recompute and compare.

---

### 8. UI (`src/ui/`)

**Responsibility:** Render the full analysis in the browser with no framework dependencies.

**Component breakdown:**

| Component | File | Renders |
|---|---|---|
| FileDropZone | `ui/FileDropZone.ts` | File picker + drag-and-drop target |
| IngestionSummaryPanel | `ui/IngestionSummaryPanel.ts` | Summary of loaded files and skipped records |
| TimelineView | `ui/TimelineView.ts` | Ordered list of TimelineEntry items |
| ClaimDetail | `ui/ClaimDetail.ts` | Expanded claim with sources and raw excerpts |
| GapReport | `ui/GapReport.ts` | List of Gap records |
| RootCausePanel | `ui/RootCausePanel.ts` | Root-cause claim or UnsupportedRootCauseNotice |
| EmptyState | `ui/EmptyState.ts` | Shown when no evidence is loaded |
| ScenarioLoader | `ui/ScenarioLoader.ts` | Buttons to load Demo_Scenarios |
| ExportButton | `ui/ExportButton.ts` | Triggers session JSON export |

**Rendering rules:**

- All evidence text rendered with `element.textContent`. Never `innerHTML`.
- Classification badges use CSS classes: `.badge-observed` (blue), `.badge-inferred` (amber), `.badge-hypothesis` (grey).
- `UnsupportedRootCauseNotice` rendered with class `.unsupported-root-cause` (red border).
- Gap markers in the timeline rendered with class `.gap-marker` (dashed border).

**File loading:**

```typescript
// Detect File System Access API support
if ('showOpenFilePicker' in window) {
  // Use File System Access API
} else {
  // Fall back to <input type="file" multiple>
}
```

---

### 9. Demo Scenarios (`src/scenarios/`)

Three self-contained scenarios, each as a JSON file:

| Scenario | File | Incident archetype |
|---|---|---|
| 1 | `scenario-deployment-outage.json` | Deployment-caused outage (R-01 triggers) |
| 2 | `scenario-dependency-conflict.json` | CI-detected dependency version conflict (R-03 triggers) |
| 3 | `scenario-resource-exhaustion.json` | Cascading failure from resource exhaustion (R-04 + R-05 trigger) |

Each scenario file contains:
- `evidenceBundle`: Array of Evidence_Items (pre-parsed, not raw files).
- `expectedClaims`: Array of expected Claim objects.
- `expectedTimeline`: Array of expected TimelineEntry kinds and timestamps.
- `expectedGaps`: Array of expected Gap descriptions.
- `description`: Human-readable scenario summary.

**Scenario validator:** `src/scenarios/validateScenario.ts` runs the full pipeline on the bundle and performs a deep-equal comparison against the expected outputs. Any mismatch surfaces a structured diff.

---

## Kiro Hooks

These hooks run automatically via `.kiro/hooks/` configuration. They validate code as it changes — no application code is produced here.

### Hook 1: TypeScript Strict Check on Save

```json
{
  "name": "ts-strict-check",
  "trigger": "PostFileSave",
  "matcher": "src/.*\\.ts$",
  "action": {
    "type": "command",
    "command": "npx tsc --noEmit --strict"
  }
}
```

Fires on every `.ts` file save. Blocks if TypeScript strict mode reports errors.

### Hook 2: Evidence Integrity Property Tests on Engine/Verifier Change

```json
{
  "name": "integrity-property-tests",
  "trigger": "PostFileSave",
  "matcher": "src/(engine|verifier|ledger)/.*\\.ts$",
  "action": {
    "type": "command",
    "command": "npx vitest --run tests/property/"
  }
}
```

Fires when engine, verifier, or ledger files change. Runs only the fast-check property tests.

### Hook 3: Scenario Validation on Scenario Data Change

```json
{
  "name": "scenario-validation",
  "trigger": "PostFileSave",
  "matcher": "src/scenarios/.*\\.json$",
  "action": {
    "type": "command",
    "command": "npx vitest --run tests/integration/scenarios.test.ts"
  }
}
```

Fires when any scenario JSON file is modified. Validates that expected outputs still match.

### Hook 4: Security Lint on UI Files

```json
{
  "name": "security-lint",
  "trigger": "PostFileSave",
  "matcher": "src/ui/.*\\.ts$",
  "action": {
    "type": "command",
    "command": "npx eslint --rule '{\"no-restricted-properties\": [\"error\", {\"object\": \"element\", \"property\": \"innerHTML\"}]}' src/ui/"
  }
}
```

Fires when UI files change. Enforces the `textContent`-only rule by rejecting `innerHTML` usage.

### Hook 5: Full Test Suite Before Commit

```json
{
  "name": "full-test-suite-pre-commit",
  "trigger": "PreToolUse",
  "matcher": "execute_bash",
  "action": {
    "type": "command",
    "command": "npx vitest --run"
  }
}
```

Fires before any git commit tool use. Ensures all tests pass before code is committed.

---

## Data Flow: Full Pipeline Trace

Given an Evidence_Bundle of three files (a plain-text log, a JSON CI output, a JSON deployment event):

1. **Ingestion**: Evidence_Ingester parses all three files. Evidence_Ledger now holds N items.
2. **Analysis**: Analysis_Engine queries the ledger. Emits CandidateClaims for rules R-01, R-02, R-07.
3. **Verification**: Claim_Verifier classifies each candidate. R-07 → OBSERVED. R-02 → INFERRED. R-01 → root-cause gate check.
4. **Gap generation**: No git records present → Gap emitted for missing git evidence.
5. **Root cause**: R-01 has 2 sources from 2 different types; gate passes → INFERRED root-cause Claim emitted.
6. **Timeline**: Reconstructor sorts OBSERVED + INFERRED claims by timestamp; inserts gap marker for the git gap; HYPOTHESIS block is empty.
7. **Render**: UI renders 8 timeline entries, 1 gap marker, root-cause panel with the R-01 claim, gap report with 1 item.

---

## Error Handling

Every subsystem uses a typed Result pattern rather than throwing exceptions:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

- **Evidence_Ingester**: Returns `Result<IngestionSummary, IngestionError>`. File-size violations, unsupported formats, and JSON safety failures each produce a typed `IngestionError` variant.
- **Claim_Verifier**: Returns `Result<VerifierOutput, VerifierError>`. An invalid SourceReference produces a `VerifierError` and halts verification of the offending claim; other claims are still processed.
- **Serialiser**: `deserialise` returns `Result<SerialisedSession, DeserialiseError>`. Hash mismatch, schema version mismatch, and invalid JSON each produce distinct error variants.
- **UI**: Every Result error is displayed to the Analyst as a structured message (file name + error description). Errors never produce a blank or frozen UI.

Unhandled exceptions at the top-level UI event handlers are caught by a global `window.onerror` handler that renders a recovery panel prompting the Analyst to reload the page.

---

## Testing Strategy

See `.kiro/steering/deterministic-testing-approach.md` for the full testing specification.

Summary:
- **Unit tests** (Vitest): Every subsystem in isolation with fixed inputs and expected outputs.
- **Property tests** (fast-check): Determinism, round-trip serialisation, invariants, metamorphic properties.
- **Integration tests** (Vitest): Full pipeline against all three Demo_Scenarios, exact equality checks.
- **Scenario validation**: Built-in platform check that runs at startup in development mode.
- All tests run with `npx vitest --run` (single-execution, no watch mode).
- CI must pass `npx vitest --run --coverage` with all subsystems meeting their minimum coverage thresholds before merge.

---

## Correctness Properties

The following properties are verified by the test suite (see `.kiro/steering/deterministic-testing-approach.md`).

### Property 1: Determinism

For all valid Evidence_Bundles, two sequential runs of the full pipeline on the same bundle produce byte-identical JSON output.
- Type: Property (fast-check)
- Test file: `tests/property/determinism.prop.test.ts`
- **Validates: Requirements 8.1, 8.3, 8.4**

### Property 2: Round-Trip Serialisation

For all valid Evidence_Ledgers, `serialise(deserialise(serialise(ledger)))` equals `serialise(ledger)`.
- Type: Property (fast-check, round-trip)
- Test file: `tests/property/roundtrip.prop.test.ts`
- **Validates: Requirements 11.4, 11.5**

### Property 3: Source Reference Validity

For all Claims in any AnalysisResult, every SourceReference in `claim.sources` resolves to an existing Evidence_Item in the Evidence_Ledger.
- Type: Invariant (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 2.6, 10.2**

### Property 4: OBSERVED Confidence Invariant

For all OBSERVED Claims, `confidenceScore === 1.0`.
- Type: Invariant (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 3.2, 3.5**

### Property 5: HYPOTHESIS Confidence Bound

For all HYPOTHESIS Claims, `confidenceScore <= 0.5`.
- Type: Invariant (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 3.4, 3.5**

### Property 6: Non-Empty Sources

For all Claims, `claim.sources.length >= 1`. Also enforced at compile time by the TypeScript non-empty tuple type `[SourceReference, ...SourceReference[]]`.
- Type: Invariant (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 3.6, 10.2**

### Property 7: Demo Scenario Exact Match

For each of the three Demo_Scenarios, the pipeline output deep-equals the pre-defined expected output.
- Type: Example (integration test, exact equality)
- Test file: `tests/integration/scenarios.test.ts`
- **Validates: Requirements 9.2, 9.6**

### Property 8: Immutability After Ingestion

For all Evidence_Items in the ledger, attempting to assign to any field throws a TypeError (enforced by `Object.freeze()`).
- Type: Example (unit test)
- Test file: `tests/unit/ledger.test.ts`
- **Validates: Requirements 2.2, 10.1**

### Property 9: Root-Cause Gate

For all AnalysisResults where `rootCauseNotice` is null, the single root-cause Claim (if present) has sources from at least 2 distinct sourceTypes.
- Type: Invariant (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 4.1, 4.2**

### Property 10: Gap Shrink Monotonicity

For any Evidence_Bundle B1 and B1 extended with additional evidence B2, `gapCount(analyse(B2)) <= gapCount(analyse(B1))`.
- Type: Metamorphic (fast-check)
- Test file: `tests/property/invariants.prop.test.ts`
- **Validates: Requirements 5.5**
