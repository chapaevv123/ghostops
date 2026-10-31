# GhostOps 1.2 Stage 2 acceptance

Status: READY FOR OWNER'S FINAL VISUAL ACCEPTANCE (local branch only). No GitHub push or Render deploy was performed.

## Starting state

- Branch: `feature/ghostops-1.2-design`; last commit `0b05b41` (GhostOps 1.1 release record).
- Stage 1 changes are uncommitted in `App.ts`, `GraphView.ts`, `InvestigationGraph.ts`, CSS, browser E2E, and screenshots. They were preserved.
- Stage 1 final verification recorded 50/50 Vitest, 89/89 development Chrome E2E, 90/90 production Chrome E2E, TypeScript and build PASS.
- Reference: `design/ghostops-1.2-reference.png`; Stage 1 screenshots: `docs/images/ghostops-1.2/`.

## Implemented and corrected

- Replaced the fixed graph rows with a deterministic layered layout. Claims align near their source records, hypotheses near supporting evidence, and gaps near hypotheses. Node cards no longer overlap. Labels wrap inside larger cards; selecting a node reveals the longer model label and each direct relationship. The Evidence Inspector opens the underlying record or hypothesis links. Selected paths are emphasized while unrelated nodes and links are dimmed. A legend explains Evidence, Observation, Inference, Hypothesis, and Unknown. Solid source links and dashed temporal/correlation/possible-explanation links are distinct. Zoom, Fit, Reset, node/link filters, pointer pan, relationship list, Tab/Enter/Space, and arrow-key node navigation were checked. On mobile the graph scrolls horizontally inside its panel so labels remain readable without widening the page.
- Kept the four Stage 1 Brief cards. Observed facts still resolve to exact source references. Explanations are explicitly labeled possible, and each opens the matching Hypotheses card with supporting, contradicting, and missing evidence. Unknowns and recommended checks remain separated from observed facts. The UI does not infer cause from timing alone.
- Separated Analysis replay, Data integrity, and Source authenticity in the header and Integrity & Export. Data integrity starts NOT CHECKED, shows CHECKING while running, and becomes VERIFIED/FAILED/UNAVAILABLE from the actual local check. Source authenticity remains UNAVAILABLE; a local SHA-256 is not an external attestation. Fixed a failed digest message that incorrectly implied the legacy digest matched.
- Added an import summary with read, recognized, raw-evidence, retained, rejected, duplicate-line, and unresolved-time counts. `.jsonl` files now parse line by line even if a malformed line does not begin with `{`; valid lines remain evidence. Rejected line text, reason, line number, and byte offset are preserved. A summary with rejected records opens automatically. Duplicate lines remain separate evidence records. Unknown structured fields remain raw evidence. Duplicate source filenames in one investigation are still rejected to prevent ambiguous references.
- Improved Evidence Inspector source context with file, line, byte offset, and evidence ID; Ledger links open the exact selected item and scroll the inspector into view. Missing hypothesis source IDs show an explicit error. Long JSON remains text in a scrollable, wrapped source panel.
- V2 package import now accepts older graph wording and coordinates while verifying the same graph node/evidence IDs and relationship semantics. Package hash, payload/source hashes, counts, deterministic analysis, and linked notes remain checked. V1 session and version-1 IndexedDB migration still pass browser tests.
- Updated the user guide and supported-format documentation to match the tested behavior and memory limits.

## Verification after final code changes

Environment: Windows, Node 22.23.1, Chrome 156.0.8078.76, local origin. The final TypeScript strict check and production build passed. Vitest coverage gate passed with **54/54 tests in 19 files**; overall line coverage was **93.27%**, branch coverage **76.05%**. Development Chrome E2E passed **95/95**; production-preview E2E with Stage 2 screenshots passed **109/109**; separate production performance and cancellation E2E passed **115/115**. The production screenshot run observed 37 page requests, all local, and zero JavaScript exceptions. The performance run observed 44 local requests and zero exceptions. `git diff --check` passed.

Browser coverage includes first-run creation, own TXT/JSON/JSONL import, partial JSONL, repeated import, malformed standalone JSON rejection, duplicate-line reporting, persisted notes, source-linked findings, exact source inspection, graph focus/selection/filtering, hypotheses and contradictions, integrity, portable export/import in a clean profile, legacy session and schema migration, tamper rejection, inert imported HTML, desktop/tablet/mobile widths, and cancellation. The new unit tests cover deterministic non-overlapping graph coordinates, partial JSONL and timezone normalization, duplicate retention, older V2 graph wording, changed graph relationship rejection, and failed-digest wording.

Security checks: `npm audit --audit-level=high` reached the npm registry and reported **0 vulnerabilities**. Secret scan: 115 text files, 0 findings. UI sink scan: 8 files checked. Imported markup was rendered as inert text in Chrome. No external page requests occurred in local browser E2E. These are regression checks, not a full penetration test.

## Performance

The E2E generated timestamped text logs at exactly 10 and 50 MiB. Figures include file reading, Worker parsing/analysis, IndexedDB save, and initial opening; they are measurements on this machine, not limits for other devices.

| Input | Records | Import and initial open | UI timer ticks (50 ms) | Reopen | Chrome page heap before → after |
|---|---:|---:|---:|---:|---:|
| 10 MiB | 10,382 | 1,705 ms | 33 | 1,099 ms | 18 → 58 MiB |
| 50 MiB | 51,910 | 8,643 ms | 168 | 5,285 ms | 49 → 254 MiB |

Both graphs rendered their capped 260 visible nodes. The 50 MiB source hashes and byte references passed the local integrity check. A separate 50 MiB read was cancelled before commit and left no partial investigation. The page-heap reading excludes Worker heap, IndexedDB storage, and browser process overhead. Input is read in 1 MiB chunks for progress/cancellation, then assembled as complete text before Worker transfer; it is **not** end-to-end streaming.

## Visual acceptance evidence

All files are in `docs/images/ghostops-1.2-stage2/` and were opened for visual inspection after the final mobile graph change:

- `investigations.png` — first-run workspace.
- `overview-no-selection.png` — Brief, Timeline, Graph, empty inspector.
- `overview-selected-evidence.png` — source-linked observation and inspector.
- `full-graph.png` — full Investigation Graph.
- `graph-selected-hypothesis.png` — selected hypothesis and related evidence path.
- `evidence-inspector-long-json.png` — long source JSON in Ledger and Inspector.
- `hypotheses.png` — competing explanations and contradicting record.
- `notes-findings.png` — saved note and evidence-linked manual finding.
- `integrity-export.png` — three distinct verification states and local check findings.
- `mobile-overview.png` — narrow Overview.
- `mobile-graph.png` — readable graph with internal horizontal scroll.

Compared with `design/ghostops-1.2-reference.png`, the four-card Brief, three-column desktop workbench, dark palette, and evidence-first workflow remain. The graph uses simpler shapes and an evidence-centered layout rather than the reference's illustrative service icons. The mobile graph intentionally uses internal horizontal scrolling to preserve legible labels.

## Known limits and acceptance verdict

- Sources and investigations live in the current browser profile and exact origin. A portable package stored outside the profile is needed for backup or transfer. No automatic clearing or remote upload occurs. IndexedDB quota errors have a user-facing message, but browser eviction, tab crashes during commit, and quota fault injection were not simulated in this run.
- Source authenticity cannot be established from a local hash. There is no signed chain, live provider adapter, paid API, or account requirement. Supported format names describe real parsers; unfamiliar exports remain generic log evidence.
- The graph is capped for usability and the SVG can still be dense on very large incidents. Search the Ledger for records outside the visible graph or first 500 Ledger rows. Duplicate counts are per imported file. The 50 MiB run used substantial page memory; slower or memory-constrained devices may need smaller batches.
- Chrome was the tested browser. Screen-reader behavior, other browser engines, full WCAG conformance, and external-source authenticity were not independently audited. No Kiro Hook execution is claimed.

**Verdict:** Stage 2 is ready for the owner's final local visual and workflow acceptance. The local development URL is `http://127.0.0.1:5173/?demo=0`; opening `http://127.0.0.1:5173/` shows the first-run Investigations page. Publication remains out of scope.
