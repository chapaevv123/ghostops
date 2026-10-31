# Kiro usage and Hook validation

The original GhostOps requirements, design, tasks, and five steering files were produced in Kiro IDE. Codex implemented the application, tests, Worker upgrade, and release documents. The original specs/steering are preserved. No fabricated session log or Kiro-authored code claim is included.

`npm run hooks:check` validates each v1 JSON wrapper, expected trigger, matcher against a representative path/tool, command, enabled state in configuration, and a safe timeout. The owner reports that the five Hooks appear enabled after restarting Kiro IDE. Neither JSON parsing nor an enabled switch proves a command executed. The Codex environment has no usable `kiro` command or access to Kiro's IDE output panel.

| Hook | Config | IDE state | Execution | Trigger and command | Limitation |
|---|---|---|---|---|---|
| ts-strict-check | CONFIG VALID | ENABLED (owner report) | UNVERIFIED | PostFileSave `src/.*\\.ts$` → `npm.cmd run typecheck`; timeout raised from 2 to 30 s after measured runs exceeded 2 s | Kiro output not available here |
| integrity-property-tests | CONFIG VALID | ENABLED (owner report) | UNVERIFIED | PostFileSave core TS → `npm.cmd run test:property` | Kiro output not available here |
| scenario-validation | CONFIG VALID | ENABLED (owner report) | UNVERIFIED | PostFileSave scenario JSON → `npm.cmd run test:integration` | Kiro output not available here |
| security-lint | CONFIG VALID | ENABLED (owner report) | UNVERIFIED | PostFileSave UI TS → `node scripts/check-ui-security.mjs` | Kiro output not available here |
| full-test-suite-before-shell | CONFIG VALID | ENABLED (owner report) | UNVERIFIED | PreToolUse shell tool → `npm.cmd test` | Kiro output not available here; filename says “pre-commit” but it is **not** a Git pre-commit hook |

The trigger and wrapper shapes match the current [Kiro Hook schema](https://kiro.dev/docs/hooks/) and [trigger reference](https://kiro.dev/docs/hooks/types/). The commands were each run directly in this project, which verifies the commands, not their Kiro activation.

## Short manual execution check in Kiro IDE

1. Open this workspace in Kiro IDE. Confirm all five Hooks show enabled in Agent Hooks and open the **Kiro output panel** for Hook execution logs, as described in [Kiro troubleshooting](https://kiro.dev/docs/hooks/troubleshooting/).
2. Have Kiro save a harmless edit in `src/ui/App.ts`; verify `ts-strict-check` and `security-lint` execute with exit code 0. Revert the edit.
3. Have Kiro save a harmless edit in `src/engine/AnalysisEngine.ts`; verify `integrity-property-tests` and `ts-strict-check`. Revert.
4. Have Kiro save a harmless edit in one `src/scenarios/*.json`; verify `scenario-validation`. Revert without changing expected outputs.
5. Ask Kiro to run a benign shell command once; verify `full-test-suite-before-shell` executes before the tool call. Record the Hook name, time, command, exit code, and output screenshot. Stop if any Hook loops or blocks unexpectedly.

This procedure may use a small number of Kiro credits. Do it only when the owner wants runtime evidence; never replace a missing observation with a synthetic log.
