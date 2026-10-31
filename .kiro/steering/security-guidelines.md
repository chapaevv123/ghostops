# GhostOps — Security Guidelines

## Purpose

GhostOps processes files uploaded by Analysts. Although it runs entirely in the browser with no backend, it still has a meaningful attack surface: malicious input files, prototype pollution through JSON parsing, and XSS via rendered evidence text. These guidelines define the minimum security posture for the implementation.

---

## Threat Model

| Threat | Source | Likelihood | Impact |
|---|---|---|---|
| Malicious log file with XSS payload | Uploaded file | Medium | High (if evidence text is rendered as HTML) |
| Prototype pollution via JSON import | Uploaded JSON session | Medium | High |
| Path traversal in Source_Reference | Crafted JSON | Low | Low (client-only, no FS access) |
| Denial of service via huge file | Uploaded file | Medium | Medium (browser tab freeze) |
| Tampered session file (integrity bypass) | Uploaded JSON | Medium | High (false evidence) |

---

## Input Handling Rules

### Rule 1: Never render evidence text as HTML

All `rawExcerpt` values, claim texts, and Gap descriptions must be rendered as plain text in the UI. Use `element.textContent = value` rather than `element.innerHTML = value`. If a UI framework is used, use its safe text binding API, never its raw HTML escape hatch.

### Rule 2: Validate all JSON before use

All JSON imported from files (session exports, CI output, deployment events) must be validated against a schema before the data is accepted. Use a TypeScript type guard or a lightweight schema validator. If validation fails, the ingester must reject the file with a structured error — not crash or partially process it.

### Rule 3: Sanitise file names before display

File names provided by the Analyst (via the file picker) must be rendered with `textContent` only. File names must not be used as HTML element IDs, CSS selectors, or `innerHTML` values.

### Rule 4: Limit file size at ingestion

The Evidence_Ingester must reject any single file larger than 50 MB. This limit must be enforced before the file is read into memory. The UI must display a clear error message if a file is rejected for size.

### Rule 5: Prevent prototype pollution

When parsing JSON, validate that the top-level object does not contain `__proto__`, `constructor`, or `prototype` keys. If any of these keys are detected, reject the JSON with a structured error.

Implementation pattern:
```typescript
function isSafeKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}
```

Apply this check recursively to all parsed JSON objects before they are passed to any application logic.

---

## Content Security Policy

The `index.html` file must include a `<meta http-equiv="Content-Security-Policy">` tag with the following minimum policy:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'none';
object-src 'none';
base-uri 'self';
form-action 'none';
```

`connect-src 'none'` enforces the no-network constraint at the browser level.

---

## Cryptographic Operations

- Use the Web Crypto API (`crypto.subtle`) exclusively. No third-party crypto libraries.
- Use SHA-256 for the Evidence_Ledger integrity hash.
- Do not store or transmit any cryptographic keys. The integrity hash is used for tamper detection only, not encryption.

---

## Session Export Security

When the Analyst exports an analysis session:

1. The export package must include the SHA-256 hash of the serialised Evidence_Ledger (see evidence-integrity-rules.md).
2. The export file must be a plain JSON file. No executable content, scripts, or binary blobs.
3. On re-import, the hash must be verified before any data is rendered. A mismatch triggers the tamper-warning banner.

---

## Dependency Policy

- Pin all npm dependencies to exact versions in `package.json` (no `^` or `~` ranges).
- Audit dependencies with `npm audit` before any release. The audit must report zero high or critical vulnerabilities.
- The production bundle must have no runtime dependencies other than those explicitly listed in this specification. Development-only tools (Vite, Vitest, fast-check) are permitted as `devDependencies`.
- Before adding any dependency, verify it is actively maintained and has a clean npm audit report.

---

## Secure Coding Checklist

Before submitting code for review, verify:

- [ ] No `innerHTML`, `outerHTML`, or `insertAdjacentHTML` with user-controlled content.
- [ ] No `eval()`, `new Function()`, or dynamic `import()` with user-controlled strings.
- [ ] All JSON input validated with type guards before use.
- [ ] All file names rendered as `textContent`.
- [ ] File size checked before reading.
- [ ] `__proto__` / `constructor` / `prototype` keys blocked in JSON parsing.
- [ ] CSP meta tag present in `index.html`.
- [ ] No `any` cast that bypasses input validation.
