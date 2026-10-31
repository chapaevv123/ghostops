# GhostOps 1.1.0 release acceptance

**Date:** 31 October 2026. **Local verdict:** RELEASE READY WITH DISCLOSED LIMITATIONS. Publication status is recorded below after GitHub and Render verification.

## Product audit and fixes

The 1.0.0 local-first architecture, V2 package schema, IndexedDB investigations, original source text, deterministic analysis and Kiro files remain in place. The audit used the existing Chrome browser suite, source review, three built-in scenarios and a new three-file synthetic incident.

Five real defects were fixed:

1. A manual note/finding linked only the first source of a multi-source claim. It now stores every referenced evidence ID, displays the selected locations before save, and exposes clickable ledger links afterward.
2. A graph selection could leave an unrelated prior claim or evidence in the inspector. Node and edge selection now clear stale selection.
3. The deployment-regression and resource-pressure hypothesis rules could say an event preceded an error even when the available error was earlier. They now require normalized timestamps in the stated order.
4. Graph `TEMPORALLY_PRECEDES` edges followed import order, so an out-of-order file could produce a false relation. Visible graph records are now sorted by normalized timestamp; equal timestamps get no precedence edge.
5. Importing from the Investigations list could append files to the previously open investigation. Entering that list now clears the active context; imports inside an investigation still append there.

Integrity Check also validates analyst entry evidence IDs and reports dangling links as failures. The landing screen now explains the workflow in four steps. The [orders API synthetic incident](demo-incident-1.1.md) provides contradictory pre-deployment evidence and a reproducible end-to-end demonstration. No automated root cause is asserted.

## Executed release gates

| Gate | Result |
|---|---|
| TypeScript and Vite production build | PASS; Vite 7.3.7 emitted HTML, CSS, JS and Worker assets |
| Vitest unit, property and integration | 49/49 PASS across 18 files; includes new time-order, evidence-link and synthetic incident regressions |
| Coverage gate | PASS; 93.12% overall lines, 96.42% Ledger lines against its 95% threshold |
| Development Chrome E2E | 84/84 PASS; package source-link assertion was added afterward and repeated in production |
| Production Chrome E2E | 85/85 PASS |
| Production performance Chrome E2E | 93/93 PASS, including 10 MB and 50 MB imports and 50 MB integrity check |
| Persistence / clean browser profile | PASS; notes, two-source finding and V2 package restored |
| Legacy compatibility | PASS; legacy browser migration, V1 session import, prior V2 package test |
| Malformed / tampered data | PASS; damaged JSON rejected without replacing saved data; altered package rejected |
| Desktop / mobile / keyboard | PASS at tested 1366×768, 1920×1080, and 390×844 viewports; graph Enter key and accessible control names checked |
| Secret scan | PASS; 109 text files checked, zero pattern findings |
| UI security sink check | PASS; 7 UI source files checked |
| npm audit | PASS; `npm audit --audit-level=high` reported zero known vulnerabilities on 31 October 2026 |
| Kiro Hooks configuration | 5/5 CONFIG VALID; IDE runtime execution UNVERIFIED |

**Performance on this host:** Windows, Node 22.23.1, Chrome 156.0.8078.76. End-to-end duration includes file selection, chunk reading, Worker analysis, IndexedDB save and reopening. The 993,889-byte/15,000-record import took 774 ms with 15 UI timer ticks; 10 MiB/10,382 records took 1,817 ms with 36 ticks; 50 MiB/51,910 records took 9,102 ms with 176 ticks and its source hash/offset Integrity Check passed. These are measurements, not device-independent limits. The 100 MB aggregate limit was enforced in code but not load-tested in this release.

## Security, UX, and limitations

Imported text is rendered as text nodes. JSON parsing rejects dangerous prototype keys. Source hashes, canonical payload/package digests, source byte offsets, deterministic replay, and analyst evidence references are checked locally. The Chrome run saw only same-origin requests and no JavaScript exceptions. There are no paid APIs or incident-data upload routes. A local hash does **not** authenticate the original source: anyone able to alter both data and hashes can recompute them.

The app still assembles file text before Worker transfer, so peak browser memory can exceed source size. Cancellation and progress work during chunk reading; an operation already committed to IndexedDB may complete before cancellation is observed. Browser profile deletion, storage eviction, and changing origins can remove locally stored investigations: export portable packages regularly. Nginx, Docker, stack traces and provider-specific CI formats remain generic text unless they match the documented object schema. Graph/timeline rendering is capped. Screen-reader, physical touch-device, Firefox/Safari, crash-injection and 100 MB aggregate-load tests were not performed. Manual findings are analyst statements, not verified causal conclusions.

The original Kiro Specs and Steering remain under `.kiro/`; five Hook configurations pass static validation. The owner previously reported them enabled in Kiro IDE. Codex has no observed Hook execution log, so no runtime claim is made. The MIT license is present. The [official Kiroween rules](https://kiroween.devpost.com/rules) require a public app, GitHub repo with open-source license and root `.kiro/`, a Kiro usage write-up and public YouTube demo shorter than three minutes. The owner should verify personal eligibility and review the final submission.

## Publication and owner actions

GitHub: pending 1.1.0 push. Render: pending 1.1.0 deploy and public smoke. No video or Devpost submission was performed. The owner must review the [video script](demo-script.md), record/upload the public video, provide its URL, and submit the entry. For a stronger Kiro automation claim, capture actual Hook output in Kiro IDE.
