# GhostOps 1.2.0 release candidate

GhostOps is a local-first workbench for reconstructing software incidents from exported evidence. It keeps original source text, builds a reproducible timeline, links claims to file locations, and separates observations, rule-based inferences, hypotheses, and unknowns. The project began from Kiro IDE specifications for Kiroween 2026; Codex implemented the application.

Incident reviews often mix facts, timing correlations, and plausible explanations in one narrative. GhostOps keeps those layers separate. An analyst can reopen the exact file record behind a claim, inspect competing explanations, and export a package that another browser can replay and check. It does not need an account, server, paid model, or live access to production systems.

**Published version:** [GhostOps on Render](https://ghostops-3xix.onrender.com) is the existing public deployment. GhostOps 1.2 is currently prepared on a local branch; its public deployment has not been verified.

![GhostOps 1.2 investigation overview using demo data](docs/images/ghostops-1.2-stage2/overview-no-selection.png)

![GhostOps 1.2 investigation graph using demo data](docs/images/ghostops-1.2-stage2/full-graph.png)

## Start

Node.js 20+ is required. In Windows PowerShell, from this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`. Create an investigation, give it a title, then import local files. Investigations and source files persist in IndexedDB for this browser profile and origin. Export a portable `.ghostops-investigation.json` package before clearing browser data or moving devices. A static production build is produced with `npm.cmd run build` and can be hosted without an application server. Use `npm.cmd run preview` to inspect that build locally.

For an evidence-first walkthrough with your own files, follow the [synthetic orders incident](docs/demo-incident-1.1.md). It includes a pre-deployment error that contradicts a simple deployment-regression story. For a zero-import preview, open **Deployment outage**. See the [user guide](docs/user-guide.md).

## Supported inputs

- Plain UTF-8 text logs, one record per line, with ISO 8601 timestamps when present. Nginx, Docker, Node.js, and Python output is retained as generic text evidence; there are no dedicated parsers for those formats.
- JSON arrays/objects and JSONL CI records containing `step`, `status`, and optional `timestamp`; `dependency` and `version` enable the version-disagreement rule.
- JSON arrays/objects and JSONL deployment records containing `service`, `version`, `event`, and optional `timestamp`.
- Git text lines beginning with `commit ` plus a 40-character hex hash; JSON Git objects with `commit` and optional `timestamp`.

Other text and unfamiliar valid JSON objects are kept as generic log evidence, without a CI/deployment/Git label. GitHub Actions and GitLab CI live API connections are **not** implemented. See [supported formats](docs/supported-formats.md) for exact examples and limits.

## Working with an investigation

The sidebar opens Investigations, Overview, Timeline, Investigation Graph, Evidence Ledger, Hypotheses, Unknowns, Notes / Findings, Integrity & Export, and Privacy. Create, rename, duplicate, archive, reopen, and delete investigations. Deletion asks for confirmation. Source records, analyst notes, manual findings, and a local action history are kept separately. Graph nodes and edges open explanations and evidence; zoom, pan, fit, reset, filters, and a text relationship list are available. The three bundled incidents are labelled **DEMO DATA** and are not saved until you choose “Save demo.”

Export options are a portable V2 JSON package, a JSON session export, and Markdown. Older V1 sessions and previously exported V2 packages remain importable. Importing a package validates schema, source hashes, source offsets, local digest, and deterministic replay before saving it. Analysis replay, local data integrity, and external source authenticity have separate statuses; the latter is unavailable without independent attestation. The package hash is not a signature. See [integrity model](docs/integrity-model.md).

## What this tool does and does not do

GhostOps emits `OBSERVED` direct record claims, `INFERRED` correlations under rules R-01–R-07, and `HYPOTHESIS` explanations tied to evidence patterns. Root-cause claims require two corroborating source types, a causal diagnostic, and no blocking gap. Temporal proximity alone does not prove cause. The app makes no outbound requests during analysis. Findings depend entirely on imported records and can be incomplete or wrong if those records are incomplete or misleading. GhostOps does not autonomously determine the real cause of an incident or replace analyst judgment. Numeric claim scores required by the original Kiro contract are retained in the legacy model but are **not** shown as calibrated probabilities in the V2 UI.

The browser applies a Content Security Policy and renders imported text as text. Those controls do not establish absolute security or legal admissibility of evidence. Imported data is not executed. IndexedDB can be cleared by browser/profile changes; it is not server-grade durable storage.

## Architecture and performance

The ingestion, ledger, rule engine, claim verifier, timeline, graph, integrity checker, package format, persistence service, and UI are separate TypeScript modules. Local files are read in 1 MB chunks with progress and cancellation; saved-investigation import, reopen, integrity checks, and package operations run in a dedicated Web Worker. IndexedDB writes the investigation head and payload in one transaction. New package and payload hashes use key-sorted JSON; previously exported V2 packages remain readable. Rendering caps the graph, timeline, and unknowns to keep navigation usable. The browser accepts at most 20 files per import, 50 MB per source file, 100 MB of source text and 100,000 evidence records per investigation. Assembled text and Worker transfer still consume browser memory.

The synthetic Chrome E2E fixture contains 15,000 timestamped log records (993,889 UTF-8 bytes). The reproducible measurement and machine context are in [verification](docs/verification.md). This is a measured fixture, not a promise for every file or device. See [architecture](docs/architecture.md), [integrity model](docs/integrity-model.md), and [data persistence](docs/data-persistence.md).

## Kiro and Kiroween

The original requirements, design, tasks, and steering documents under `.kiro/` were created in Kiro IDE. Codex implemented the application, tests, and release documentation from that contract. Five Kiro hook configurations are valid against the published v1 schema and are reported as enabled in the owner's IDE; their actual IDE execution is still unverified. See [Kiro usage evidence](docs/kiro-usage-evidence.md) and the [Frankenstein submission draft](docs/kiroween-submission.md). No Kiro session logs have been invented.

## Static hosting

`render.yaml` describes the Render Static Site with `npm ci && npm run build` and `dist` as the publish directory. The [public site](https://ghostops-3xix.onrender.com) was deployed from the [public GitHub repository](https://github.com/chapaevv123/ghostops) and tested in Chrome with synthetic data. No backend or user-data upload route is configured. Browser investigations belong to the exact site origin and browser profile; moving between domains requires package export/import.

## Verification

See [1.2 final release acceptance](docs/GHOSTOPS_1_2_FINAL_RELEASE_ACCEPTANCE.md) for the current quality gate, [Stage 2 acceptance](docs/GHOSTOPS_1_2_STAGE2_ACCEPTANCE.md) for implementation details, and [1.1 release acceptance](docs/GHOSTOPS_1_1_RELEASE_ACCEPTANCE.md) for the previous public release.

```powershell
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:property
npm.cmd run test:integration
npm.cmd run coverage
npm.cmd run build
npm.cmd run e2e
npm.cmd run e2e:production
npm.cmd run secret-scan
npm.cmd run hooks:check
npm.cmd run benchmark
npm.cmd audit --audit-level=high
```

`e2e` uses a locally installed Google Chrome and the Chrome DevTools Protocol. The benchmark is synthetic and reports its environment in [verification](docs/verification.md). Before publication, Vite and Vitest tooling were updated and `npm audit --audit-level=high` reported zero known vulnerabilities. This is a point-in-time dependency check, not a security guarantee.

The original `.kiro/specs` and `.kiro/steering` files remain unchanged. V2 owner requirements are traced separately in [V2 requirements trace](docs/v2-requirements-trace.md); implementation status is in [feature matrix](docs/feature-matrix.md).
