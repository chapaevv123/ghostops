# Security policy

GhostOps 1.0 processes investigations locally in the browser. The static app has no application server, account, telemetry, or analysis API. Imported text is rendered as text, JSON unsafe keys are rejected, and production CSP blocks network connections. This model does not protect against a compromised browser, extension, device, or altered deployment assets.

Do not treat local SHA-256 values as independent source signatures. Preserve original evidence outside GhostOps and export a portable package to a protected location. Avoid putting secrets in files unless the browser profile and backups are under your control.

To report a security issue, contact the repository owner privately through a channel they publish after repository release. Do not post sensitive incident files or exploit details in a public issue. The owner should confirm a private contact channel before publication. The pre-publication npm audit reported zero known vulnerabilities after tooling updates; see [release acceptance](docs/GHOSTOPS_1_0_RELEASE_ACCEPTANCE.md).
