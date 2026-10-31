# GhostOps 1.0.0 release acceptance

**Date:** 31 October 2026. **Verdict:** RELEASE READY WITH DISCLOSED LIMITATIONS for owner-reviewed static publication. No public push, deployment, or contest submission was performed.

## Product and fixes

The existing local-first application was retained. A user can create an investigation; import their own UTF-8 TXT, JSON, and JSONL; inspect a timestamped timeline, claim classification, source file, line and byte offset; review unknowns, hypotheses and graph relationships; add notes and change status; run integrity checks; reload; export a portable V2 package; and restore it in a clean browser context. V1 session JSON and earlier V2 packages remain readable. Kiro Specs, Steering, and all five Hook configurations remain in the repository.

The 1.0 fixes replace pre-Worker `File.text()` with 1 MB chunk reads, visible byte progress, cancellation, and a filename-specific invalid UTF-8 error. Unknown valid JSON objects now remain generic evidence rather than disappearing as skipped records. Integrity checks encode each source once instead of once per record. Version-conflict hypothesis generation is linear in the number of CI records and reports one conflict per dependency. The Unknowns view caps rendered rows and explains the cap. Focus styling and long-record wrapping were improved. IndexedDB continues to write head and payload in one transaction; rejected files do not replace saved data.

## Executed release gates

| Gate | Observed result |
|---|---|
| Typecheck and production build | PASS; Vite emitted the static app and a dedicated Worker asset |
| Vitest unit, property, integration | 43/43 PASS in 16 files; property suites include 100 generated cases each |
| Coverage | 95.58% lines, 81.36% branches; IndexedDB paths also exercised in Chrome |
| Development Chrome E2E | 71/71 PASS |
| Production Chrome E2E with performance | 80/80 PASS; no JavaScript exceptions |
| Persistence and clean-profile package round-trip | PASS; isolated browser context began empty, then restored source records and a note |
| Tamper, malformed input, missing source, compatibility | PASS in unit/integration/browser tests; altered package hash rejected; V1 storage migration and V2 package import exercised |
| Mobile, keyboard, graph | PASS at 390×844 and desktop 1366×768/1920×1080 for horizontal overflow; graph keyboard selection and accessible control names checked |
| Secret and UI sink scans | 0 findings in 102 text files; 6 UI files checked for forbidden sinks |
| Kiro configuration | 5/5 CONFIG VALID; actual IDE execution UNVERIFIED |
| npm audit | Initial gate UNVERIFIED; pre-publication audit found 8 dev-tool vulnerabilities (4 moderate, 1 high, 3 critical). Updated Vite, Vitest, coverage and property adapter; repeat audit reported zero known vulnerabilities. Production-only audit also reported zero. |

The browser scenario exercised user-owned TXT/JSON/JSONL fixtures, notes, statuses, graph selection, timeline source inspection, reload, export, package tampering, legacy session import, Markdown export, delete cancellation, and all bundled demos. An integration fixture combines Nginx/HTTP errors, Docker exit logs, Node.js stack lines, Python traceback lines, resource pressure, mixed time zones, missing timestamps, duplicates, contradictory health evidence, CI version conflicts, deploy and rollback events, an unfamiliar JSON object, malformed JSONL, and a damaged standalone JSON file. The unfamiliar object stays generic source evidence; malformed JSONL is reported as skipped; damaged standalone JSON is rejected. Specialized Nginx/Docker/stack-trace parsing is not claimed.

**Pre-publication rerun:** after dependency updates, `npm ci --dry-run` succeeded; typecheck, 43/43 Vitest, production build, 71/71 development Chrome E2E, 71/71 production Chrome E2E, secret scan (102 files, zero findings), and 5/5 Kiro configuration checks passed. The production run observed 29 requests to the local origin and zero JavaScript exceptions. This rerun did not repeat the 10 MiB and 50 MiB performance measurements below; those remain measurements from the earlier 1.0.0 code with previous dev tooling.

## Performance and data safety

Measured with Windows, Node 22.23.1, Chrome 156.0.8078.76, and the production preview on 31 October 2026. Each duration includes file selection, chunk reading, Worker analysis, IndexedDB save, and reopen. These are host measurements, not service-level guarantees.

| Input | Records | Duration | 50 ms UI timer ticks | Result |
|---|---:|---:|---:|---|
| 993,889 bytes | 15,000 | 774 ms | 15 | PASS |
| 10 MiB | 10,382 | 1,978 ms | 38 | PASS |
| 50 MiB | 51,910 | 9,473 ms | 183 | PASS; subsequent source hash and offset Integrity Check PASS |

The 1,000-record synthetic analysis benchmark measured 18.2413 ms mean over 28 samples. The current 50 MB per-file limit passed on this host, but assembled strings, Worker transfer, analysis and storage still use substantial browser memory. The 100 MB aggregate investigation limit was enforced in code but not separately load-tested. Cancellation is tested at the chunk reader boundary; a cancellation racing an already committed IndexedDB write can leave the completed import in the list. Interrupted-write crash injection and quota-fault simulation were not performed. Existing investigations were not deleted or migrated in this workspace.

## Security and integrity findings

Imported text uses text nodes, not HTML execution. Recursive JSON key checks reject `__proto__`, `constructor`, and `prototype`. JSON parsing, per-file and per-record limits, deterministic replay, canonical SHA-256 package and payload digests, source hashes and byte offsets, tamper rejection, and IndexedDB transaction atomicity were reviewed or tested. The static source contains no `fetch`, XHR, beacon, WebSocket, or external analysis endpoint; the production E2E observed 36 requests, all to the local origin. The production CSP declares `connect-src 'none'`. No paid API is used.

These checks do not prove absolute security. An attacker who can alter both evidence and local hashes can recompute them. Browser profile compromise, extension access, storage eviction, and altered static hosting assets are outside the integrity guarantee. The pre-publication audit found zero known dependency vulnerabilities after updates, but this is a point-in-time result. The secret scan found no common key patterns but is not a full security audit. See [security policy](../SECURITY.md) and [limitations](limitations.md).

## UX and Kiro findings

Desktop screenshots and Chrome interactions confirm a readable dark interface and functional graph controls; mobile navigation, form names, keyboard graph selection, and horizontal overflow passed at the tested viewport. Empty states, rejected-record reports, progress, cancellation, local-storage guidance, and long-log wrapping are present. A full screen-reader, touch-device, and cross-browser audit was not performed. The graph and timeline are intentionally capped; search and ledger navigation expose more records.

The original `.kiro/specs/ghostops` and `.kiro/steering` are preserved. `npm run hooks:check` validated all five Hook wrappers, trigger matchers, and commands. The owner reported all five enabled after restarting Kiro IDE. Codex cannot observe the IDE output panel, so **EXECUTION VERIFIED is not claimed**. Minimal safe check: in Kiro IDE, open this workspace and the Hook output panel, save a harmless comment in `src/ui/App.ts`, and confirm `ts-strict-check` plus `security-lint` names, commands, exit codes, and timestamps appear; revert the comment. Then inspect the remaining three configurations against [Kiro usage evidence](kiro-usage-evidence.md). Only spend credits on additional runtime triggers if the owner wants those claims verified.

## Delivery and owner actions

The production build, [README](../README.md), [release notes](release-notes-1.0.md), [user guide](user-guide.md), [limitations](limitations.md), [security policy](../SECURITY.md), [backup procedure](data-persistence.md), [Render blueprint](../render.yaml), [publication checklist](release-checklist.md), [Kiroween draft](kiroween-submission.md), [sub-three-minute script](demo-script.md), and [demo walkthrough](user-guide.md) are prepared. The repository is on `master`; local commits will use the GitHub noreply address before the first public push. Deployment and hackathon materials are ready for owner review, not published or submitted.

Before public release, the owner should review this report and source, verify the Kiro Hook runtime if claiming execution, confirm public Git author metadata, connect GitHub and Render accounts, test the final hosted origin, and record/upload the demo video. Users should export `.ghostops-investigation.json` backups outside the browser profile before clearing site data or changing domains.
