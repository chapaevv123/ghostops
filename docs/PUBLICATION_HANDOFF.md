# GhostOps 1.0.0 publication handoff

The owner authorized public publication. The repository and free Render Static Site were created and independently checked on 31 October 2026. The video and contest entry remain owner actions.

## GitHub

- Owner: `chapaevv123`; repository: `ghostops`; visibility: **Public**; local branch: `master`.
- Verified public URL: https://github.com/chapaevv123/ghostops. The published `master` contains Kiro Specs, `render.yaml`, release acceptance, and the application source.
- The owner approved GitHub noreply metadata for every unpublished commit. The account was created in 2019 and GitHub's ID-based noreply format applies. A local backup ref preserves the old unpublished history; it must never be pushed.
- The three published commits show only the GitHub ID-based noreply address for author and committer. The original unpublished history is preserved in a local backup ref and was not pushed. No force push was used.

## Render Static Site form

| Field | Value |
|---|---|
| Service type | **Static Site**; static sites have no compute plan field |
| Repository | The verified `chapaevv123/ghostops` repository |
| Branch | `master` |
| Root directory | Repository root (leave blank) |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Environment variables | None required |
| Routes/rewrites | None required; GhostOps has no path-based client routes |

Render service `srv-dbis6jcs728c73860eog` is a `static_site` on branch `master`, with the checked-in build command and publish directory, no paid compute plan, and no required environment variables. Its first deploy reached `live`. Three response-header rules from `render.yaml` were added through the Render API; confirm their appearance in the public HTTP response after the next deploy. Verified public URL: https://ghostops-3xix.onrender.com. The public Chrome workflow passed 71/71 checks with synthetic files and an isolated clean browser context; HTML, JS, CSS, and Worker files returned HTTP 200.

## Kiroween 2026 package

- **Title:** GhostOps — Evidence-First Incident Reconstruction.
- **Category:** Frankenstein.
- **Description:** GhostOps combines exported application logs, CI and deployment records, Git metadata, a browser-local evidence ledger, deterministic reconstruction, an investigation graph, and local integrity checks. Engineers can inspect the exact source record behind a claim while distinguishing OBSERVED facts, INFERRED correlations, HYPOTHESIS explanations, and unknowns. It runs without an account or paid API and stores user investigations in their browser profile.
- **Kiro usage:** Kiro IDE produced `.kiro/specs/ghostops/` requirements, design, tasks, and `.kiro/steering/`. Codex implemented the app from that contract. Five Agent Hook configurations validate; the owner reports them enabled in IDE, but actual execution remains **UNVERIFIED**.
- **Video:** Follow [the script under three minutes](demo-script.md) and [shot list](video-shot-list.md); owner records and publishes it after review.
- **Limitations:** Generic line-based treatment of Nginx/Docker/stack traces, in-memory assembled text, browser-local storage and backup requirement, no independent source signature, Kiro Hook runtime unverified. See [limitations](limitations.md).
- **GitHub URL:** https://github.com/chapaevv123/ghostops.
- **Render URL:** https://ghostops-3xix.onrender.com.
- **Video URL:** pending owner publication.

The [submission draft](kiroween-submission.md) and [publication checklist](release-checklist.md) remain the source for the full contest text and owner actions. No contest entry or video was submitted by Codex.
