# Supported import formats

**1.0 clarification:** Nginx, Docker, Node.js stack traces, Python tracebacks, and other unknown text are retained as generic line-based evidence. Unknown valid JSON objects are also retained as generic evidence. There are no dedicated parsers for those vendor formats. Browser reading uses 1 MB chunks, reports byte progress, supports cancellation, and rejects invalid UTF-8. The assembled text and Worker transfer still use browser memory.

| Format | Detection and required structure | Notes |
|---|---|---|
| Plain text log | Line-per-record UTF-8 text | Timestamp can be absent; source remains verbatim. |
| CI JSON / JSONL | Object with string `step` and `status`; optional ISO `timestamp` | `dependency` and `version` strings enable R-03. |
| Deployment JSON / JSONL | Object with string `service`, `version`, `event`; optional ISO `timestamp` | `deploy` and `rollback` events participate in rules. |
| Git text | Line begins `commit ` and 40 hex characters | ISO timestamp is optional; multi-line `git log` bodies are not joined. |
| Git JSON | Object with `commit` as 40 hex characters; optional ISO `timestamp` | Other scalar fields are retained for rule inspection. |

JSON arrays and single JSON objects are accepted. JSONL is a sequence of one JSON object per line. A `.jsonl` file is read line by line, so one malformed line is rejected with its original text, line number, byte offset, and reason while valid lines remain evidence; unsafe keys anywhere (`__proto__`, `constructor`, `prototype`) reject the whole file. A malformed standalone JSON file is rejected. Unknown JSON fields and records without specialized CI/deployment/Git fields remain raw log evidence. Duplicate lines are counted within each file and retained as separate source records. Nested JSON is kept verbatim, but current rules index only top-level scalar fields. Source offsets refer to UTF-8 bytes and handle LF/CRLF and Unicode; original records are not rewritten.

Limits: 20 files per import, 50 MB per file before browser read, 1 MB per record, 100,000 records per file and investigation, and 100 MB total source text per investigation. Saved-investigation parsing and analysis run in a Worker; assembled text and message copying still use browser memory. There is no automatic authentication or live connection to GitHub Actions, GitLab CI, monitoring systems, or deployment providers. Their exported plain-text logs may be imported as generic logs; provider-specific structured exports require a future tested adapter.
