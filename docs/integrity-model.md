# Integrity model

The integrity checker reports PASS, FAIL, or INCOMPLETE. It checks the local workspace payload digest, per-file SHA-256, deterministic re-ingestion, source byte offsets, and agreement between replayed counts and saved metadata. An empty investigation is INCOMPLETE. A broken source reference or hash mismatch is FAIL.

The portable V2 package adds a hash over metadata, original files, analysis, hypotheses, and graph. New package and payload hashes use JSON with object keys sorted at every level; array order is retained. The importer accepts both this form and the earlier V2 `JSON.stringify` hash so existing exports remain readable. Import validates version and JSON safety, checks hashes, then recomputes the same pipeline. The V1 session importer separately checks its ledger hash, source offsets, and analysis replay. Markdown is a human-readable export and cannot be re-imported as an investigation.

These checks detect accidental corruption and simple modifications relative to stored hashes. They do **not** authenticate the source of evidence, prevent a person with write access from recalculating hashes, or establish a legally protected chain of custody. Claim source references prove only that a displayed statement points to the locally loaded file bytes. Root-cause verification remains a conservative application rule, not a forensic certification.
