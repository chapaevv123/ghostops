# GhostOps 0.3.0 — local release report

Historical snapshot. For the current 1.0.0 gate, see [release acceptance](GHOSTOPS_1_0_RELEASE_ACCEPTANCE.md).

**Date:** 31 October 2026. **Decision:** locally usable and ready for controlled user testing; public release and Kiroween submission are not complete. No GitHub publication, static deployment, video upload, or Devpost submission was performed.

## Delivered product

The existing V2 investigation lifecycle, TXT/JSON/JSONL import, source ledger, OBSERVED/INFERRED/HYPOTHESIS rules, timeline, graph, unknowns, competing hypotheses, IndexedDB persistence, notes, integrity checks, V1 JSON/Markdown export, V2 package round trip, and three built-in demos remain. This completion pass added:

- A dedicated Web Worker for saved-investigation parsing/replay, integrity checks, and package operations, with a cancel control and stage messages.
- Atomic creation with files: a rejected first import leaves no empty investigation; import limits now include 20 files and 100,000 records per investigation.
- Linear-time correlation lookups for rules that could previously scan large record sets quadratically, and an iterative JSON safety walk for deeply nested input.
- Key-sorted JSON for new payload/package hashes, with read compatibility for earlier V2 hashes.
- Investigation search, mobile navigation, graph width-aware fit, clearer graph labels, named zoom controls, and reduced-motion CSS.
- A Render Static Site Blueprint, production-preview E2E, demo screenshots, and Kiroween submission documents.

The original Kiro specs and steering remain unchanged. The only `.kiro` edit was raising the typecheck Hook timeout from 2 to 30 seconds after observed typechecks exceeded the original timeout.

## Executed verification

The exact command log and limits are in [verification](verification.md). `npm install --offline --no-audit`, strict typecheck, separate unit/property/integration suites, coverage, production build, local and production-preview Chrome E2E, Hook configuration checker, secret scan, UI sink scan, and synthetic benchmark passed. The final full Vitest suite passed **36/36 tests** in 14 files: 24 unit, 3 property-based, 9 integration. Coverage: **95.57% lines**, **79.15% branches**. Development and production-preview E2E each passed **68/68 checks**; a separate production screenshot run passed **69/69**. Those tests cover browser persistence, package round trip and tamper detection, negative import, graph interaction, all demos, keyboard smoke, and local-only page requests. The production run saw 29 page requests, all to the local origin, and zero JavaScript exceptions.

On Windows with Node v22.23.1 and Chrome/156.0.8078.76, 15,000 synthetic log records (993,889 UTF-8 bytes) imported and reopened in **906 ms** in the final production-preview run while a 50 ms page timer ticked 17 times. The separate 1,000-record Vitest benchmark measured **18.6059 ms mean** over 28 samples while other checks were running. These are reproducible fixtures, not general performance guarantees. Full 50 MB browser processing was not measured.

`npm audit --audit-level=high` was attempted again with the normal npm cache and a workspace cache. Both attempts failed at the registry audit endpoint. **Dependency vulnerability status is unverified.** The final secret scan found 0 patterns in 93 text files; the UI sink scan checked five UI files. These checks do not replace an external security audit or full WCAG review.

## Kiro Hooks

`npm run hooks:check` reported **5/5 CONFIG VALID** with matching triggers, paths/tool names, commands, and safe timeout. The owner reports all five as **ENABLED** in Kiro IDE. Actual Hook command execution remains **UNVERIFIED** from Codex. See [per-Hook evidence and manual procedure](kiro-usage-evidence.md). Directly running npm commands is not counted as a Kiro Hook firing.

## Deployment, GitHub, and contest readiness

`render.yaml` uses a static build and `dist` output; the production-preview browser test loads the built Worker asset successfully. The app uses no backend or required external API, and its CSP blocks outbound `connect` requests. A public host has not been tested. IndexedDB data belongs to the browser profile and exact origin, so a public domain does not inherit local investigations.

The local Git repository has no commits and no remote. `.gitignore` excludes build output, dependencies, coverage, npm cache, and environment files; `.kiro/`, MIT license, source, docs, tests, and demo screenshots are prepared for a first review. Nothing has been pushed. The [official Kiroween rules](https://kiroween.devpost.com/rules) require a public GitHub repository, functional app URL, public YouTube video under three minutes, and Kiro usage write-up. The submission draft and shot list exist, but no entry has been made. The owner must verify eligibility and project creation timing.

## Known limits and next engineering gates

- `File.text()` and Worker messages still copy full source text. A 50 MB file, quota failure, tab crash during commit, and browser eviction were not fault-injected end to end.
- Provider-specific GitHub Actions/GitLab formats and live integrations are not implemented; supported exported shapes are documented.
- Graph and timeline rendering are capped; complex 100,000-record investigations can still use substantial browser memory.
- Source hashes and package hashes detect local inconsistencies but are not independent signatures or legal chain-of-custody evidence. GhostOps does not automatically prove a root cause.
- Full cross-browser, screen-reader, keyboard-only workflow, and dependency-vulnerability reviews remain before a broad public release claim.

## Status with evidence

| Area | Status | Evidence / blocker |
|---|---|---|
| PRODUCT | PASS | Own-file investigation, analysis, graph, notes, export/reimport, demos in production-preview E2E |
| DATA PERSISTENCE | PASS | Reload/reopen, migration, atomic first import, delete confirmation tested; browser eviction remains a platform risk |
| PERFORMANCE | PARTIAL | Worker and 15,000-record responsiveness measured; full 50 MB and 100,000-record paths not benchmarked |
| EVIDENCE INTEGRITY | PASS | Source offsets, hashes, canonical package hash, deterministic replay, and tamper tests; no independent authenticity claim |
| SECURITY | PARTIAL | CSP, safe DOM text, iterative JSON key rejection, scans passed; npm audit endpoint unavailable |
| KIRO INTEGRATION | PARTIAL | 5/5 configs valid and owner reports enabled; IDE execution unverified |
| TESTING | PARTIAL | 36/36 Vitest and 66/66 production E2E passed; full accessibility/cross-browser/quota fault tests open |
| DEPLOYMENT | BLOCKED | Static config and preview pass; public deploy requires owner authorization and live-origin verification |
| DOCUMENTATION | PASS | README, guides, architecture, verification, privacy, release and contest packet updated |
| HACKATHON READINESS | BLOCKED | Public GitHub/app/YouTube URLs and owner eligibility confirmation absent |

## Owner-dependent actions

1. Confirm eligibility and authorization to publish the source under MIT; provide or approve the GitHub account/repository and Render or equivalent static host.
2. Once public deployment is authorized, verify the live origin, then record and publish the under-three-minute YouTube video and enter the public URLs in Devpost.
3. If claiming automated Kiro Hook use, run the short IDE procedure in `kiro-usage-evidence.md` and keep actual output screenshots. Provide a network path that lets `npm audit` complete before a broad public release claim.
