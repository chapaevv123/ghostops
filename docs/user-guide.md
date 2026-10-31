# User guide

1. Run `npm.cmd run dev` and open the local address. Choose **New investigation**, enter a title and optional description. The Investigations screen can search saved titles, descriptions, and statuses.
2. Choose **Import evidence** and select local `.log`, `.txt`, `.json`, or `.jsonl` files. Files are checked before reading against the 50 MB limit; at most 20 files can be selected together. Reading reports byte progress and can be cancelled. A file with a duplicate name in the same investigation is rejected to keep source references unambiguous. Saved-investigation analysis runs in a Worker with a stage indicator and a Cancel control. If cancellation happens after a save commits, check the investigation list before retrying. Invalid UTF-8 is rejected.
3. Review **Timeline**. Direct source records have readable titles; click an event to inspect its original text, file name, line, and byte offset. Use classification filters and search. Unknown timestamps are labelled.
4. Open **Investigation Graph**. Drag the background to pan, use mouse wheel or controls to zoom, choose Fit/Reset, filter nodes or links, and select a node or link. Expand the text relationship list if SVG navigation is inconvenient.
5. Compare **Hypotheses**. Each card shows its supporting and contradicting evidence, missing records, next diagnostic steps, and status. Hypotheses are suggestions, not conclusions.
6. Add **Notes** or **Manual Findings**. A selected evidence item or timeline claim is linked to a new entry. Manual findings remain separate from machine-verified claims.
7. Change status on **Overview**. Rename, duplicate, archive, or delete there. Deletion requires confirmation.
8. Run **Integrity Check**, then export a portable package. Store backups outside the browser profile. Importing a package rechecks its contents before saving. Markdown is a readable report; V1 JSON session export remains available for compatibility.

Three built-in scenarios can be opened from the sidebar. They are marked DEMO DATA and are ephemeral until saved as a new investigation. Imported files and saved investigations are marked USER DATA. See [persistence](data-persistence.md) and [privacy](privacy-and-security.md) before using sensitive incident records.
