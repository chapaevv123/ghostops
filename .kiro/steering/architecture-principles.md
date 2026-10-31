# GhostOps — Architecture Principles

## Purpose

This document defines the non-negotiable architectural constraints that every implementation decision for GhostOps must satisfy. Codex and future contributors must read this before writing any application code.

---

## Core Architectural Constraints

### 1. Evidence-First Data Flow

All data transformations must flow in one direction:

```
Raw Input Files
  → Evidence_Ingester (parse + normalise)
    → Evidence_Ledger (immutable store)
      → Analysis_Engine (read-only queries)
        → Claim_Verifier (classify + gate)
          → Timeline_Reconstructor (order + assemble)
            → UI (render)
```

No subsystem may write to the Evidence_Ledger after ingestion completes. No subsystem may skip the Claim_Verifier before adding a claim to the timeline.

### 2. Separation of Concerns

Each subsystem is a distinct module with a typed public interface:

| Subsystem | Responsibility | Must NOT |
|---|---|---|
| Evidence_Ingester | Parse raw files into Evidence_Items | Classify claims |
| Evidence_Ledger | Store and query Evidence_Items | Modify stored items |
| Analysis_Engine | Produce candidate Claims from Evidence_Items | Emit claims directly to the timeline |
| Claim_Verifier | Classify and gate Claims | Ingest raw files |
| Timeline_Reconstructor | Order and assemble the timeline | Generate new Claims |
| UI | Render data to the browser | Modify the Evidence_Ledger |

### 3. Determinism

The Analysis_Engine, Claim_Verifier, and Timeline_Reconstructor must be pure functions of their inputs. They must not read from `Date.now()`, `Math.random()`, or any external service during analysis. All sorting must use a stable, documented comparator. All iteration over collections must be over sorted or deterministically ordered structures.

### 4. Immutable Evidence

Evidence_Items in the Evidence_Ledger are write-once. Any code path that attempts to mutate a stored Evidence_Item is a defect. TypeScript `readonly` modifiers must be applied to all Evidence_Item fields. The ledger must be defensively copied before it is exposed to consumers.

### 5. Traceability

Every Claim must carry a non-empty array of Source_References before it leaves the Claim_Verifier. Any Claim with an empty source reference array must be rejected by the verifier. This constraint is enforced at the type level: `sources: [SourceReference, ...SourceReference[]]` (non-empty tuple type).

### 6. No Backend Server

The Platform runs entirely in the browser. All file access, analysis, and rendering happens client-side. No HTTP requests are made during analysis. The only permitted network activity is the initial page load of static assets.

### 7. TypeScript Strictness

All source files must compile with `"strict": true` in `tsconfig.json`. No `any` types are permitted except at the raw file-parsing boundary (immediately after which values must be narrowed to typed structures). All `unknown` values from JSON parsing must be validated before use.

### 8. Module Boundaries via Interfaces

Subsystem interfaces must be defined as TypeScript `interface` or `type` declarations in dedicated `types/` files. Implementation modules must import from the types file, not from each other's implementation files. This enables independent testing of each subsystem.

---

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety for evidence provenance |
| Build | Vite | Fast browser builds, no server needed |
| UI framework | Vanilla TypeScript + DOM | Minimise dependencies, maximise portability |
| Testing | Vitest | Native TypeScript support, fast |
| Property tests | fast-check | Deterministic shrinking for round-trip tests |
| Serialisation | JSON (built-in) | No external dependency, inspectable output |

---

## Folder Structure

```
ghostops/
  src/
    types/           # Shared TypeScript interfaces and types
    ingester/        # Evidence_Ingester implementation
    ledger/          # Evidence_Ledger implementation
    engine/          # Analysis_Engine implementation
    verifier/        # Claim_Verifier implementation
    reconstructor/   # Timeline_Reconstructor implementation
    serialiser/      # JSON serialiser / deserialiser
    ui/              # Browser UI components
    scenarios/       # Demo_Scenario data and validators
  tests/
    unit/            # Per-subsystem unit tests
    property/        # fast-check property tests
    integration/     # Full-pipeline scenario validation tests
  index.html
  tsconfig.json
  vite.config.ts
  package.json
```

---

## Anti-Patterns

These patterns are explicitly forbidden:

- **Implicit state**: Global mutable variables outside the Evidence_Ledger.
- **String typing**: Using raw strings for claim types; use TypeScript union types (`'OBSERVED' | 'INFERRED' | 'HYPOTHESIS'`).
- **Silent failures**: Returning `null` or `undefined` without a typed error discriminant. Use `Result<T, E>` or tagged union error types.
- **Cross-subsystem imports**: The ingester must not import from the engine; the engine must not import from the UI.
- **Hard-coded demo data in production code**: Demo_Scenario data lives only in `src/scenarios/`.
