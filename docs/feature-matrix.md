# V2 feature matrix

| Capability | Status | Evidence / limit |
|---|---|---|
| Create, reopen, rename, duplicate, archive, delete investigations | IMPLEMENTED | IndexedDB service and browser E2E |
| Notes, manual findings, status, local action history | IMPLEMENTED | Saved/reopened in browser E2E; history is not independent audit trail |
| TXT, JSON, JSONL, CI/deployment/Git-shaped files | IMPLEMENTED | Parser tests and browser import; exact shapes in supported-formats.md |
| Provider-specific GitHub Actions/GitLab export adapters | PLANNED | No tested provider adapter or live API connection |
| Source manifest SHA-256 and integrity check | IMPLEMENTED | Unit, package, and browser tests; local hashes are not signatures |
| Deterministic R-01–R-07 and claim verification | IMPLEMENTED | Existing scenario and property tests preserved |
| Evidence-driven hypotheses and alternatives | IMPLEMENTED | Pattern rules, counterevidence test, UI cards |
| Interactive investigation graph | IMPLEMENTED | SVG zoom/pan/filter/select/list and browser E2E; capped size |
| Human-readable timeline | IMPLEMENTED | Source-derived event titles, search, classification filters; capped DOM |
| Portable V2 JSON package and V1 session compatibility | IMPLEMENTED | Round-trip, tamper, browser import/export tests |
| Browser persistence migration and interrupted-write behavior | PARTIAL | Version-1 migration and atomic transaction tested; real crash/eviction cannot be simulated reliably |
| Worker-based saved-investigation ingestion and replay | IMPLEMENTED | Dedicated Worker, cancel control, browser responsiveness test with 15,000 records |
| Full streaming import without in-memory text copy | PARTIAL | 1 MB chunk reading, progress and cancellation implemented; assembled text and Worker message still copy source text; 50 MB per-file cap tested in Chrome |
| Provider live API integrations | UNSUPPORTED | No authentication UI or network requests |
| Independent authenticity signature / chain of custody | UNSUPPORTED | SHA-256 alone does not establish authorship |
| Full accessibility audit | PARTIAL | Keyboard controls, focus styles, text relationship list, browser smoke; no full screen-reader audit |
| Dependency vulnerability clearance | PARTIAL | npm audit attempted; registry endpoint unavailable |
| Kiro hook runtime execution | PARTIAL | v1 JSON files validated; IDE execution not observed |
