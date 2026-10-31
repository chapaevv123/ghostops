# GhostOps V2 requirements trace (Codex-authored)

This document records owner-requested V2 requirements separately from the original Kiro specification. It is not a Kiro-generated spec.

| Requirement | Implementation | Verification |
|---|---|---|
| Persistent investigations | `src/workspace/` IndexedDB model/service | Service tests, browser reload and migration |
| Evidence integrity | `src/integrity/`, source manifest and replay | Integrity/package tests, browser tamper check |
| Specific hypotheses | `src/hypotheses/` | Pattern and contradiction tests |
| Investigation graph | `src/graph/`, `src/ui/GraphView.ts` | Determinism tests, browser node/edge checks |
| Analyst workflow | `src/ui/App.ts`, workspace notes/status/history | Browser note reload and lifecycle checks |
| Portable package | `src/package/` versioned JSON | Round-trip, malformed/tampered and browser reimport |
| Professional UI | `src/ui/` local-first workbench | 58 Chrome checks and responsive smoke |

Status and evidence for each feature are maintained in `docs/feature-matrix.md` and `docs/verification.md` after implementation.
