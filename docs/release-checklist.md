# Publication and Kiroween release checklist

## Local gates

- [x] TypeScript strict typecheck, full Vitest suite, production build.
- [x] Chrome E2E against development server and built static site; three demos and user-file round trip.
- [x] Secret scanner and static UI sink check; no secrets found by those checks.
- [x] Static Render Blueprint prepared; build output includes Worker asset.
- [x] MIT license, root `.kiro/`, English README, screenshots, reproducible demo steps.
- [x] `npm audit --audit-level=high` returned zero known vulnerabilities after updating Vite, Vitest, coverage, and the property-test adapter; recheck after future dependency changes.
- [ ] Full accessibility and cross-browser review on the intended release URL.
- [ ] Real Kiro IDE Hook execution captured in Kiro output panel.

## Actions requiring owner authorization or identity

- [ ] Confirm personal/team eligibility, ownership, and that creation timing satisfies the [official rules](https://kiroween.devpost.com/rules).
- [x] Owner authorized public GitHub publication; the PUBLIC repository contains the MIT license and `.kiro/` at its root.
- [x] Owner authorized a free Render Static Site; deployment is live and the public Chrome smoke test passed 71/71 with local-only network requests.
- [ ] Record and publish a sub-three-minute YouTube video using the tested product; provide its public URL.
- [ ] Fill the Devpost submission with app URL, GitHub URL, video URL, Frankenstein category, project description, and accurate Kiro usage write-up before **4 December 2026, 2:00 pm PT**.

GitHub and Render publication were performed under owner authorization. Browser IndexedDB is tied to an exact origin; users must export a package before moving domains or devices. Static hosting serves only application assets and bundled demos; user investigations remain in that browser profile unless the user explicitly exports them. The owner has not published a video or submitted the contest entry.
