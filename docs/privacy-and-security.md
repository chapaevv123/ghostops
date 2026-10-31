# Privacy and security

**1.0 update:** Local files are read in 1 MB chunks with cancellation. The completed text and Worker transfer still use browser memory; the 50 MB per-file and 100 MB per-investigation limits remain. A local SHA-256 mismatch check detects changes against locally stored metadata, not independent source authenticity. A pre-publication npm audit found zero known vulnerabilities after updating build and test tooling.

GhostOps processes imported files in the browser and stores saved investigations in IndexedDB. Incident data is not sent to an application server. The production HTML has a CSP with `connect-src 'none'`; browser E2E observed only the local origin in both development and production-preview runs. Vite development tooling uses local HMR connections. No paid API, LLM, cloud account, or telemetry endpoint is required.

Imported text is displayed with `textContent` and is not executed. JSON keys associated with prototype pollution are rejected recursively. File and record limits constrain memory use. Portable packages are plain JSON; ZIP files and executable archives are unsupported. Source names are displayed as text and are not used as filesystem paths.

Limits: heavy saved-investigation analysis runs in a Web Worker, but reading and copying a large file still consumes browser memory; local SHA-256 checks cannot prove authenticity if an attacker changes both content and hashes; a compromised browser/profile can alter stored data; no independent signature, encryption at rest, or legal chain of custody is provided. Avoid importing secrets unless the local browser profile and backups are protected by your own operational controls. See [integrity model](integrity-model.md).

The first release-gate `npm audit` attempt could not reach the registry endpoint. A later authorized pre-publication run did reach it, found vulnerable dev tooling, and was followed by updates and a clean audit. This point-in-time result does not replace future security review.
