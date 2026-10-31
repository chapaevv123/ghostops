# Kiroween engineering provenance

The original `.kiro/specs/ghostops/requirements.md`, `design.md`, `tasks.md`, and five `.kiro/steering/*.md` files existed before Codex wrote the MVP. They define evidence ingestion, ledger, claim taxonomy, root-cause refusal, gaps, timeline, browser UI, deterministic rules, three demos, integrity, and round-trip serialization. Their architecture chooses TypeScript strict, Vite, browser-only processing, Vitest, fast-check, and seven rule IDs. These files remain unchanged.

Codex wrote the MVP application, original tests, demo data, documentation, and hook JSON files. In V2, Codex added IndexedDB investigations, manifest hashes, integrity checks, package import/export, specific hypotheses, graph, human-readable titles, notes/status workflow, browser E2E, and user documentation. `docs/v2-requirements-trace.md` is Codex-authored from the owner's V2 prompt; it is not an original Kiro specification.

| Source requirement | Implementation | Executed verification |
|---|---|---|
| Kiro ingestion and ledger | `src/ingester/`, `src/ledger/` | Parser/ledger unit tests, property tests |
| Kiro R-01–R-07, claim verifier, timeline | `src/engine/`, `src/verifier/`, `src/reconstructor/` | Three golden scenario tests, unit/property tests |
| Kiro export/integrity | `src/serialiser/` | Round-trip and tamper tests |
| Owner V2 persistence | `src/workspace/` | Service tests, browser create/reload/migration flow |
| Owner V2 graph/hypotheses | `src/graph/`, `src/hypotheses/`, `src/ui/GraphView.ts` | Model tests, browser node/edge selection |
| Owner V2 package and integrity | `src/package/`, `src/integrity/` | Package/tamper tests and browser import/export |

The five `.kiro/hooks/*.json` files conform to the documented standalone v1 wrapper (`version`, `hooks`, PascalCase triggers, matcher, command action). Their JSON parses and their commands can be run manually. This does **not** prove they activated in Kiro IDE. No Kiro CLI executable was found in PATH; actual IDE version, hook trigger matching, and hook execution need an owner-led Kiro IDE check. The fifth filename says “pre-commit,” but its actual configuration is a PreToolUse shell gate, not a Git pre-commit hook. No Kiro session logs or development history have been fabricated.

The 0.3.0 completion work added a dedicated Web Worker, atomic first import, canonical JSON hashes with V2 legacy compatibility, source and graph usability changes, mobile navigation, static Render configuration, and the contest packet. These were also Codex-authored. Hook configuration and manual verification steps are recorded in `kiro-usage-evidence.md`; the official submission requirements are linked in `kiroween-submission.md`.
