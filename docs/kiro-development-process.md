# Kiro and Codex development process

The Kiro IDE-authored `.kiro/specs/ghostops/{requirements,design,tasks}.md` and `.kiro/steering/*.md` files predate application code and remain unchanged. The original MVP and V2 implementation code were written by Codex. Owner-requested V2 requirements are recorded separately in `v2-requirements-trace.md`; their implementation status is in `feature-matrix.md`.

The five hooks in `.kiro/hooks/` use the [current standalone v1 schema](https://kiro.dev/docs/hooks/) with PascalCase triggers and command actions. The project checks that they are parseable JSON, and the referenced npm/node commands are available. The installed Kiro IDE did not run in this session, and `kiro` was not in PATH. Therefore hook firing, matcher behavior, and command permissions remain **unverified**. [Kiro's trigger reference](https://kiro.dev/docs/hooks/types/) describes IDE support; this repository does not claim actual local hook execution. The file named `full-test-suite-pre-commit.json` defines a shell PreToolUse hook, not a Git pre-commit hook.

No Kiro session logs, screenshots of hook execution, or claims that Kiro authored Codex code were created. The owner can verify the five hooks in a real Kiro IDE session after reviewing this build. `kiroween-evidence.md` maps original requirements to code and executed tests.

The 0.3.0 configuration checker (`npm run hooks:check`) validated 5/5 Hook files and representative matchers. The `ts-strict-check` timeout was raised from 2 to 30 seconds because measured typecheck runs exceeded the original limit. This was a Codex configuration correction; Kiro IDE execution remains unverified. See `kiro-usage-evidence.md` for the per-Hook status and manual test procedure.
