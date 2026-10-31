# GhostOps 1.0.0 release notes

GhostOps 1.0.0 completes the local investigation workflow: create, import owned files, inspect a source-linked timeline and graph, add analyst notes, check integrity, export a portable V2 package, and restore it in another browser profile. V1 session export and earlier V2 package import remain available.

This release reads files in 1 MB chunks with progress, cancellation, and strict UTF-8 validation. Unknown valid JSON records are retained as generic evidence. Integrity checking reuses encoded source bytes; dependency-conflict hypotheses are generated in linear time. The Unknowns view caps rendered rows. New synthetic fixtures cover mixed logs, CI/deployment, conflicting versions, absent timestamps, duplicates, malformed JSONL, and damaged JSON.

See [release acceptance](GHOSTOPS_1_0_RELEASE_ACCEPTANCE.md) for executed gates and [limitations](limitations.md) before using sensitive incident records. Public publication is pending owner authorization.
