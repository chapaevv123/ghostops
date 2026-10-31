# Kiroween 2026 submission draft — Frankenstein

**Project:** GhostOps — evidence-first incident reconstruction. **Category:** Frankenstein. **Public app:** https://ghostops-3xix.onrender.com. **GitHub:** https://github.com/chapaevv123/ghostops. **YouTube URL:** pending owner video. This document is a draft, not a submitted entry.

## The Frankenstein stitch

GhostOps brings together exported application logs, CI records, deployment events, and Git change metadata with a browser-local forensic ledger, deterministic rules, graph visualization, Web Crypto integrity checks, and IndexedDB persistence. These sources normally live in separate tools. The useful result is a single investigation where a timing correlation stays a correlation, every claim resolves to a source record, and competing explanations list missing evidence.

## What judges can reproduce

1. Open the public app. No login is required for built-in demos.
2. Load **Deployment outage**. Select the deployment and error in Timeline; inspect original records and note that temporal order is not declared causation.
3. Open Investigation Graph; select a node and an edge, then use the relationship list and source inspector.
4. Compare hypotheses and the Unknowns panel.
5. Create a new investigation, import a TXT log plus JSON/JSONL exports, add a note, run Integrity Check, export a portable package, reload, and import it again.
6. For a negative check, alter a downloaded package and observe hash rejection. Local test fixtures are in `tests/fixtures/`.

The app also includes **Dependency conflict** and **Resource exhaustion** demos. The former links mismatched versions to CI source records; the latter shows missing telemetry and limits causal confidence. The working paths are checked by `npm run e2e:production`.

## Kiro usage and honest provenance

Kiro IDE created `.kiro/specs/ghostops/{requirements,design,tasks}.md` and `.kiro/steering/*`. These files set the evidence taxonomy, deterministic pipeline, source references, root-cause refusal, security controls, and testing approach. Codex authored the main implementation and V2 extensions. Five Agent Hooks are configured and enabled according to the owner's IDE, but their execution is not yet independently observed. See `kiro-usage-evidence.md` for the hook-by-hook status and a short validation procedure. Do not describe unverified Hook runs as completed automation.

## Official rules checked 31 October 2026

The [official Kiroween 2026 rules](https://kiroween.devpost.com/rules) require a working Kiro-built application, a public app URL, a public **GitHub** repository with open-source license and `.kiro/` at its root, a text description, a public YouTube demo under three minutes, and a Kiro usage write-up. The [overview](https://kiroween.devpost.com/) describes Frankenstein as combining seemingly incompatible elements. The official rules list the submission period as **30 October 2026, 9:00 am PT to 4 December 2026, 2:00 pm PT**. The owner must confirm eligibility, project creation timing, ownership, and any other submission conditions before submitting. This document does not assert eligibility or submission.
