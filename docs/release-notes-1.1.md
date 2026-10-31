# GhostOps 1.1.0 release notes

GhostOps 1.1 strengthens the evidence trail and time-order reasoning while preserving the existing V2 investigation and package schemas.

- Inferred claims with multiple sources now attach every source to a manual note or finding. The form shows selected sources, and saved entries link back to exact ledger records.
- Integrity Check now reports analyst entries with missing evidence IDs. Existing valid V2 packages continue to import.
- Deployment-regression and resource-pressure hypotheses require a failure record at or after the proposed preceding event. Graph `TEMPORALLY_PRECEDES` edges are sorted by normalized timestamps and omit equal-time pairs.
- Switching to Investigations clears the active investigation context, so importing from the list starts a new investigation. Importing from within an open investigation still adds to it.
- The first screen explains the raw-record-to-finding path. A new synthetic incident shows contradictory evidence, linked findings, graph relationships, integrity checking, and export.

The browser still assembles each file into text before Worker analysis. The 50 MB per-file limit is host-tested, not a guarantee across devices. There are no live provider adapters, independent source signatures, or autonomous root-cause determinations. Local storage requires exported backups. Kiro Hook configurations are present; runtime execution has not been observed by Codex.
