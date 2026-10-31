# GhostOps — Deterministic Testing Approach

## Purpose

GhostOps makes a specific promise: the same input always produces the same output. This document specifies how that promise is tested and how every other correctness property of the platform is verified.

---

## Testing Layers

| Layer | Framework | What it covers |
|---|---|---|
| Unit tests | Vitest | Individual subsystem logic with fixed inputs |
| Property tests | fast-check | Invariants over generated inputs |
| Integration tests | Vitest | Full pipeline with Demo_Scenario data |
| Scenario validation | Built-in Platform check | Expected vs actual output for each Demo_Scenario |

---

## Running Tests

```bash
# Single-run (use in CI and for spec validation — no watch mode)
npx vitest --run

# With coverage
npx vitest --run --coverage
```

Never use `vitest` without `--run` in automated contexts. The watch mode blocks execution.

---

## Property Tests (fast-check)

### What to test with properties

Properties are appropriate for GhostOps because its core invariants hold for all valid inputs:

| Property | Type | Subsystem |
|---|---|---|
| Same input → same output | Determinism | Analysis_Engine |
| Serialise → deserialise → serialise produces identical JSON | Round-trip | Serialiser |
| Every Claim has at least one Source_Reference | Invariant | Claim_Verifier |
| No Evidence_Item is mutated after ingestion | Immutability | Evidence_Ledger |
| OBSERVED Confidence_Score is always 1.0 | Invariant | Claim_Verifier |
| HYPOTHESIS Confidence_Score is always ≤ 0.5 | Invariant | Claim_Verifier |
| Timeline order is stable under repeated sort | Idempotence | Timeline_Reconstructor |
| Gap list shrinks or stays the same after adding evidence | Monotonicity | Claim_Verifier |
| Parsing a valid file always produces ≥ 1 Evidence_Item | Invariant | Evidence_Ingester |

### What NOT to test with properties

Do not write property tests for:
- File I/O (use integration tests with fixture files).
- UI rendering (use snapshot tests or visual inspection).
- The browser File System Access API (use mocks).
- Demo_Scenario expected outputs (use exact equality integration tests).

---

## Determinism Test Pattern

```typescript
import { fc } from '@fast-check/vitest';
import { buildArbitraryBundle } from '../fixtures/arbitraries';
import { runFullAnalysis } from '../../src/engine';

test.prop([buildArbitraryBundle()])(
  'same evidence bundle produces identical analysis output on two runs',
  (bundle) => {
    const run1 = runFullAnalysis(bundle);
    const run2 = runFullAnalysis(bundle);
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  }
);
```

Key rules for this test:
- `runFullAnalysis` must be a pure function that accepts a bundle and returns a result.
- The function must not read from `Date.now()` or `Math.random()`.
- The function must not retain any state between calls.

---

## Round-Trip Test Pattern

```typescript
import { fc } from '@fast-check/vitest';
import { buildArbitraryLedger } from '../fixtures/arbitraries';
import { serialise, deserialise } from '../../src/serialiser';

test.prop([buildArbitraryLedger()])(
  'serialise then deserialise then serialise produces identical JSON',
  (ledger) => {
    const json1 = serialise(ledger);
    const restored = deserialise(json1);
    const json2 = serialise(restored);
    expect(json2).toBe(json1);
  }
);
```

---

## Arbitraries (fast-check Generators)

Define these in `tests/fixtures/arbitraries.ts`:

| Arbitrary | Generates | Used in |
|---|---|---|
| `arbitraryTimestamp()` | ISO 8601 timestamps and null | Evidence_Item generation |
| `arbitrarySourceType()` | `'log' \| 'ci' \| 'deployment' \| 'git'` | Evidence_Item generation |
| `arbitraryEvidenceItem()` | Valid Evidence_Item | Ledger and claim tests |
| `arbitraryEvidenceBundle()` | 1–50 Evidence_Items across 1–4 source types | Engine determinism tests |
| `arbitraryLedger()` | Evidence_Ledger with 1–100 items | Serialiser round-trip tests |
| `arbitraryClaim()` | Claim with random classification and valid sources | Verifier tests |

All arbitraries must produce deterministic outputs for a given fast-check seed. Do not use `Date.now()` inside an arbitrary.

---

## Demo Scenario Integration Tests

Each of the three Demo_Scenarios has a corresponding integration test that:

1. Loads the scenario's Evidence_Bundle from `src/scenarios/`.
2. Runs the full pipeline.
3. Asserts that the output matches the scenario's expected output file exactly (using `deepEqual`).
4. Asserts that running the pipeline a second time produces the same output (determinism check).

These tests must be in `tests/integration/scenarios.test.ts` and must pass before any release.

---

## Coverage Requirements

| Subsystem | Minimum line coverage |
|---|---|
| Evidence_Ingester | 90% |
| Evidence_Ledger | 95% |
| Analysis_Engine | 85% |
| Claim_Verifier | 95% |
| Timeline_Reconstructor | 95% |
| Serialiser | 100% |
| Scenario validators | 100% |

Coverage is measured by `vitest --coverage`. The CI pipeline must fail if any subsystem falls below its minimum.

---

## Test File Naming Convention

```
tests/
  unit/
    ingester.test.ts
    ledger.test.ts
    engine.test.ts
    verifier.test.ts
    reconstructor.test.ts
    serialiser.test.ts
  property/
    determinism.prop.test.ts
    roundtrip.prop.test.ts
    invariants.prop.test.ts
  integration/
    scenarios.test.ts
    pipeline.test.ts
  fixtures/
    arbitraries.ts
    scenario-*.json    (loaded by integration tests)
```

Files ending in `.prop.test.ts` contain fast-check property tests. Files ending in `.test.ts` contain Vitest unit or integration tests.
