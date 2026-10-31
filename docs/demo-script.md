# GhostOps 1.1 video script (2:45 target)

Use only the synthetic files in [`tests/fixtures/demo-incident`](../tests/fixtures/demo-incident). Record the public Render site and show the browser URL. Keep the screen capture under three minutes; the [official rules](https://kiroween.devpost.com/rules) say judges need not watch beyond three minutes and require a public YouTube link.

| Time | Screen and narration |
|---|---|
| 0:00–0:20 | “An incident report often mixes logs, correlations, and guesses. GhostOps keeps them separate and lets an engineer reopen each source record.” Show the first-screen workflow. |
| 0:20–0:45 | Create “Orders API 503”, import the three fixture files. Show ten evidence records and the local-data label. |
| 0:45–1:10 | Open Timeline. Inspect the 09:58:12Z 503 before the deployment and the 10:02:05Z 503 after it. Show exact file, line and byte offset; explain OBSERVED versus INFERRED. |
| 1:10–1:35 | Select the two-source CI/deployment correlation; open both source cards. In Graph, open the accessible relationship list and select `CONTRADICTS`. |
| 1:35–2:00 | Show deployment-regression hypothesis and its pre-deployment counterevidence. Mention missing upstream telemetry. Do not say the deployment caused the incident. |
| 2:00–2:25 | Use the selected sources in a manual finding. Show both linked records, run Integrity Check, export a portable package. Explain local browser storage and backups. |
| 2:25–2:45 | Show `.kiro/specs/ghostops`, Steering, five Hook configurations, and MIT license on GitHub. State accurately: Kiro produced the original specs and steering; Codex implemented the app; Hook runtime is unverified. Close with GitHub and Render URLs. |

Do not publish a video or submit Devpost until the owner reviews the capture and entry text. The product has no native provider adapters, independent source signature, or proven root-cause detection.
