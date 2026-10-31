# GhostOps — Evidence Integrity Rules

## Purpose

Evidence integrity is the central promise of GhostOps. These rules define what it means for evidence to be "intact" and specify the exact invariants that every code path must preserve. A violation of any rule here is a critical defect, not a minor issue.

---

## The Five Integrity Invariants

### Invariant 1: Verbatim Preservation

The `rawExcerpt` field of every Evidence_Item must be byte-for-byte identical to the corresponding text in the source file. No trimming, normalisation, redaction, or encoding conversion is permitted on this field. If a display layer needs a shortened version, it must derive it at render time without writing back to the ledger.

**Enforcement:** Property test — parse a file, serialise the ledger, deserialise, assert `rawExcerpt` fields are unchanged.

### Invariant 2: Source Reference Validity

Every Source_Reference must point to a real location in the original input file. Specifically:

- `fileName` must match the name of a file loaded in the current ingestion session.
- `lineNumber` must be a positive integer that exists in that file.
- `byteOffset` must be a non-negative integer that falls within the file's byte length.

The Claim_Verifier must reject any Claim whose Source_References fail this check.

**Enforcement:** After each ingestion, validate every Source_Reference against the in-memory file index before analysis begins.

### Invariant 3: No Fabricated Claims

The Analysis_Engine must derive every Claim from Evidence_Items in the Evidence_Ledger. A Claim that asserts a fact not present in any Evidence_Item's content is a fabrication and must not be emitted.

This rule applies equally to Hypothesis claims — the difference between a Hypothesis and a fabrication is that a Hypothesis must still reference at least one Evidence_Item that partially supports it.

**Enforcement:** Every emitted Claim must have `sources.length >= 1`. The Claim_Verifier enforces this at the type level.

### Invariant 4: Immutability After Ingestion

Once an Evidence_Item is added to the Evidence_Ledger its fields must not change. The following operations are forbidden after ingestion:

- Updating any field of an Evidence_Item.
- Removing an Evidence_Item from the ledger.
- Re-ordering items within the ledger's internal store.

Gap records and analysis output are separate data structures and are not subject to this rule.

**Enforcement:** TypeScript `Object.freeze()` applied to each Evidence_Item at insertion time. Tests that attempt mutation must throw.

### Invariant 5: Skipped Records Are Logged, Not Silently Dropped

Any source record that the Evidence_Ingester cannot parse into a valid Evidence_Item must be written to a `skippedRecords` list with:

- The originating file name.
- The raw text of the record (verbatim).
- The parse error message.

The `skippedRecords` list is part of the ingestion summary and is accessible to the UI. The count of skipped records must be included in the ingestion summary displayed to the Analyst.

---

## Claim Classification Rules

| Classification | Minimum evidence | Confidence_Score |
|---|---|---|
| OBSERVED | 1 Evidence_Item with a direct text match | Not required (set to 1.0) |
| INFERRED | 2 or more Evidence_Items, none sufficient alone | Required, range [0.0, 1.0] |
| HYPOTHESIS | 1 or more Evidence_Items, insufficient for INFERRED | Required, range [0.0, 0.5] |

A HYPOTHESIS Confidence_Score must never exceed 0.5. A value above 0.5 indicates the evidence is sufficient to promote the claim to INFERRED.

---

## Root-Cause Assertion Gate

A root-cause Claim must pass all of the following checks before emission:

1. Classification is OBSERVED or INFERRED (never HYPOTHESIS).
2. At least two corroborating Evidence_Items from different source types.
3. No Gap record exists that would negate the causal chain.

If any check fails, the Claim_Verifier must emit an `UnsupportedRootCauseNotice` instead, containing:
- The candidate root-cause text that was rejected.
- The list of Evidence_Items that were found.
- The list of Gaps that prevent confirmation.

---

## Evidence Tampering Detection

On export, the Platform must include a SHA-256 hash of the serialised Evidence_Ledger. On re-import, the Platform must recompute this hash and compare it to the stored value. A mismatch must cause the Platform to display a tamper-warning banner and prevent further analysis until the Analyst acknowledges the warning.

> Implementation note: Use the Web Crypto API (`crypto.subtle.digest`) for hashing. No external library required.

---

## What "Supporting Evidence" Means

For a Claim to reference an Evidence_Item as supporting evidence, the relationship must be one of:

- **Direct**: The claim text is a close paraphrase of a phrase in the Evidence_Item's `rawExcerpt`.
- **Temporal**: The Evidence_Item's timestamp falls within the causal window asserted by the claim.
- **Correlative**: The Evidence_Item co-occurs with another Evidence_Item in a pattern recognised by the Analysis_Engine's documented rule set.

"The engine decided it was relevant" is not a valid basis for a Source_Reference. Every correlation rule must be documented in code comments, referencing the evidence relationship it encodes.
