# GhostOps 1.0.0 publication handoff

This file records the publication state without inventing public links. The owner authorized a public GitHub repository and a free Render Static Site. GitHub CLI is authorized as `chapaevv123`; the authenticated repository lookup found no `chapaevv123/ghostops` repository. No Render service or public URL has yet been verified. Do not submit the Kiroween entry until the actual links and public smoke test are recorded.

## GitHub

- Owner: `chapaevv123`; repository: `ghostops`; visibility: **Public**; local branch: `master`.
- Planned URL, **not yet verified**: `https://github.com/chapaevv123/ghostops`.
- The owner approved GitHub noreply metadata for every unpublished commit. The account was created in 2019 and GitHub's ID-based noreply format applies. A local backup ref preserves the old unpublished history; it must never be pushed.
- Check the repository's actual existence and history under authenticated access. Create it only if absent; never force-push or overwrite an existing history.

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

The checked-in `render.yaml` defines `type: web`, `runtime: static`, the same build command and publish directory, and security response headers. Do not create a paid Web Service. Use Render's free Static Site, wait for a successful deploy, then copy the actual HTTPS `onrender.com` URL from Render. No URL is reserved or inferred from the service name.

## Kiroween 2026 package

- **Title:** GhostOps — Evidence-First Incident Reconstruction.
- **Category:** Frankenstein.
- **Description:** GhostOps combines exported application logs, CI and deployment records, Git metadata, a browser-local evidence ledger, deterministic reconstruction, an investigation graph, and local integrity checks. Engineers can inspect the exact source record behind a claim while distinguishing OBSERVED facts, INFERRED correlations, HYPOTHESIS explanations, and unknowns. It runs without an account or paid API and stores user investigations in their browser profile.
- **Kiro usage:** Kiro IDE produced `.kiro/specs/ghostops/` requirements, design, tasks, and `.kiro/steering/`. Codex implemented the app from that contract. Five Agent Hook configurations validate; the owner reports them enabled in IDE, but actual execution remains **UNVERIFIED**.
- **Video:** Follow [the script under three minutes](demo-script.md) and [shot list](video-shot-list.md); owner records and publishes it after review.
- **Limitations:** Generic line-based treatment of Nginx/Docker/stack traces, in-memory assembled text, browser-local storage and backup requirement, no independent source signature, Kiro Hook runtime unverified. See [limitations](limitations.md).
- **GitHub URL:** pending authenticated publication and verification.
- **Render URL:** pending successful deployment and verification.
- **Video URL:** pending owner publication.

The [submission draft](kiroween-submission.md) and [publication checklist](release-checklist.md) remain the source for the full contest text and owner actions. No contest entry or video was submitted by Codex.
