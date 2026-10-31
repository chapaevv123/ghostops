# Verification record — GhostOps 0.3.0, 31 October 2026

Historical 0.3.0 measurements. The current 1.0.0 verification record is [release acceptance](GHOSTOPS_1_0_RELEASE_ACCEPTANCE.md).

Run from the workspace root in Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:property
npm.cmd run test:integration
npm.cmd run coverage
npm.cmd run build
npm.cmd run e2e
npm.cmd run e2e:production
npm.cmd run hooks:check
npm.cmd run secret-scan
node scripts/check-ui-security.mjs
npm.cmd run benchmark
npm.cmd audit --audit-level=high
```

## Latest executed results

| Check | Result |
|---|---|
| Install | `npm install --offline --no-audit`: up to date; no dependency change |
| TypeScript strict | PASS |
| Unit tests | 24/24 in 8 files |
| Property tests | 3/3 in 3 files; each fast-check property runs 100 generated cases |
| Integration tests | 9/9 in 3 files; all three built-in scenarios validated |
| Full Vitest / coverage | 36/36 in 14 files; 95.57% line, 79.15% branch coverage |
| Production build | PASS; Vite emitted `dist/index.html`, CSS/JS, and a dedicated Worker asset |
| Browser E2E, development | 68/68 after final UI changes |
| Browser E2E, production preview | 68/68; separate screenshot run 69/69 |
| Secret scan | 93 text files, 0 findings after final documentation additions |
| UI sink scan | 5 UI source files checked; no forbidden sinks found |
| Kiro Hook config check | 5/5 CONFIG VALID; runtime execution UNVERIFIED |
| `npm audit --audit-level=high` | BLOCKED: npm registry audit endpoint returned an error; vulnerability status unverified |

The Chrome E2E is a real browser test through the Chrome DevTools Protocol, not Playwright. It covers own TXT/JSON/JSONL imports, malformed JSON rejection, failure without a partial new investigation, IndexedDB reopen after reload, notes, duplicate/archive/delete confirmation, graph node/edge and keyboard selection, hypotheses, integrity PASS, portable package tamper detection and reimport, V1 session JSON and Markdown exports, version-1 storage migration, all three demos, and 1366×768, 1920×1080, and 390×844 horizontal-overflow checks. The production-preview run recorded 29 page requests, all to the local origin, and zero JavaScript exceptions. Basic button/form names and mobile navigation were checked; this is not a full WCAG or screen-reader audit.

## Performance measurement

The E2E script generates **15,000 timestamped UTF-8 log records, 993,889 bytes** and imports them as a new investigation through the Worker, then reopens the saved result. On Windows, Node v22.23.1 and Chrome/156.0.8078.76, the final production-preview run completed that interaction in **906 ms**, with **17 timer ticks** at 50 ms during the operation. A separate screenshot run measured 761 ms and 15 ticks. Timings include CDP automation and vary with host load; they are not a guaranteed maximum. Run `node scripts/browser-e2e.mjs --production` to reproduce.

The synthetic Vitest benchmark (`tests/benchmark/analysis.bench.ts`) ingests/analyzes 1,000 UTF-8 log records. In the final run it measured **18.6059 ms mean**, 53.7464 operations/s over 28 samples, with ±7.24% relative margin of error. Coverage/build/benchmark were run concurrently, so this result should not be compared directly with an isolated run or extrapolated to 50 MB files.

## Limits of this verification

Vitest V8 coverage excludes IndexedDB repository paths exercised only in Chrome; that is why repository line coverage is 52% while browser persistence passes. The 50 MB per-file and 100 MB aggregate limits are enforced by code, but a full 50 MB browser import, quota fault injection, tab crash during commit, other browsers, and a full accessibility audit were not completed. The local source scan is not a complete security assessment. Dependency vulnerabilities remain unverified because `npm audit` could not contact its endpoint. Kiro IDE Hook execution remains unverified.
