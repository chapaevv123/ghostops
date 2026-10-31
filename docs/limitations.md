# Current limitations

- Nginx, Docker, Node.js, Python, and other vendor logs are generic line-based text evidence. Only the documented CI, deployment, and Git shapes receive specialized labels and rules. Multiline stack traces are not merged into one event.
- Missing or malformed timestamps remain unresolved. The app does not invent event times, missing records, or causal diagnoses. A local hash detects mismatches against local metadata but does not authenticate the source.
- Reading is chunked, but a complete source string, Worker transfer, analysis result, and IndexedDB payload still occupy browser memory. The tested per-file ceiling is 50 MB on one Windows/Chrome host; slower devices may need smaller files.
- Browser IndexedDB is scoped to origin and profile, can be evicted, and has no cloud sync. Export portable packages for backup. A cancellation racing a committed transaction may leave a completed import in the list.
- The graph and visible timeline/unknowns are capped for navigation; the ledger and portable package retain the full accepted evidence. Search the ledger to inspect records beyond the initial display.
- No dedicated adapters or live authentication for GitHub Actions, GitLab CI, Nginx, Docker, Kubernetes, or monitoring providers. No independent digital signature or encryption at rest.
- The GhostOps 1.2 release candidate npm audit found zero known vulnerabilities. This is a point-in-time check. Kiro Hook runtime remains UNVERIFIED. Full cross-browser, screen-reader, quota-fault, and crash-recovery testing has not been completed. Chrome page-heap measurements exclude the Worker, IndexedDB, and browser process overhead.
