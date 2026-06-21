# Website Repo Memory

## Current Run

- Intent: raise the homepage first fold so the capabilities cards show sooner on desktop without breaking mobile readability.
- Finding: the hero/proof stack still consumed too much vertical space before `Core Capabilities` entered view.
- Change: tightened the homepage hero gutters, reduced proof-card and studio-card padding, and pulled the capabilities block upward. Bumped the shared stylesheet cache key to `20260618-19`.
- Validation: reloaded `index.html`, checked the browser DOM and console state, verified `See Work` still navigates to `portfolio.html`, and captured fresh desktop and mobile screenshots with Playwright CLI after the in-app browser screenshot path timed out.
- Result: desktop now shows the first capability cards in the fold, and the mobile hero still scans cleanly.
- Run time: 2026-06-18T03:46:59.2631304-04:00.

## Current Run

- Intent: improve homepage fold balance and desktop readability.
- Finding: the hero still left too much dead space below the first fold on laptop and desktop screens.
- Change: reduced desktop hero padding, lowered the hero minimum height, centered the fold vertically, and slightly increased proof-card spacing. Bumped the shared stylesheet cache key to `20260618-18` across public pages.
- Validation: reloaded `index.html` locally with Playwright at 1440x1600, 1366x768, and 390px widths, then captured fresh screenshots and inspected them visually.
- Result: the first fold now reads faster on desktop and still scans cleanly on mobile.
- Run time: 2026-06-18T03:29:19.0555152-04:00.

## Current Run

- Intent: improve mobile first-fold readability for the homepage.
- Finding: the proof cards were still too dense on phones, and the tab icon was missing.
- Change: stacked the mobile proof cards vertically, tightened their spacing, added the shared logo favicon, and bumped the stylesheet cache key to `20260618-17`.
- Validation: reloaded `index.html` locally with Playwright at desktop and 390px mobile widths, captured fresh screenshots, and checked for overflow plus console errors.
- Result: the phone hero now scans cleanly, the desktop fold stayed stable, and the browser console is clean.
- Run time: 2026-06-18T03:14:43.2806844-04:00.

## Current Run

- Intent: improve mobile first-fold readability for the homepage.
- Finding: the proof cards still tried to read like a horizontal strip on phones, which made the number/title/body stack feel cramped.
- Change: forced the mobile proof cards into a single-column vertical stack, tightened their internal spacing, and bumped the shared stylesheet cache key to `20260618-17`.
- Validation: pending fresh desktop and 390px Playwright screenshots after the cache-busted reload.
- Run time: 2026-06-18T06:54:27.044Z.

## Current Run

- Intent: improve homepage fold balance and small-screen readability.
- Finding: the desktop hero still left a large dead band before the next section, and the 390px mobile proof strip was too compressed to scan easily.
- Change: shortened hero vertical padding, reduced the hero minimum height, increased heading/body spacing, and switched the smallest mobile proof strip to a single-column stack. Bumped the shared stylesheet cache key to `20260618-16`.
- Validation: reloaded `index.html` locally with Playwright at desktop and 390px mobile widths, then captured fresh screenshots and inspected them visually.
- Result: the first fold now reads faster on desktop, and the mobile hero proof points are legible without crowding the next section.
- Run time: 2026-06-18T02:58:25.8571403-04:00.

- Intent: improve mobile first-fold readability without changing the desktop hero.
- Finding: the three proof cards were too vertically dense on phone-sized screens and pushed the capabilities section lower than needed.
- Change: switched the mobile proof strip to a two-up grid with the third card spanning full width, and bumped the shared stylesheet cache key to `20260618-15` across public pages.
- Validation: reloaded the homepage at 390x844 and desktop sizes, captured screenshots, and checked the mobile nav menu after the layout update.
- Result: the mobile hero now reveals more of the next section while staying readable, and desktop remains visually stable.
- Run time: 2026-06-18T02:42:33.8555385-04:00.

## Current Run

- Intent: improve homepage readability with a quick-scan Nexus summary and better hero spacing.
- Finding: the in-app Browser bridge still timed out, so local Chrome/Playwright was the reliable validation path; the new Nexus strip needed stronger contrast on first render.
- Change: added a three-item Nexus summary strip under the section header, loosened the hero H1 line-height, increased strip contrast, and bumped the shared stylesheet cache key to `20260618-14` across public pages.
- Validation: reloaded desktop and mobile in local Chrome/Playwright, captured viewport and full-page screenshots, and verified the `See Work` CTA navigates to `portfolio.html`.
- Result: the homepage now scans better above and below the fold, and the Nexus section has clearer at-a-glance context.
- Run time: 2026-06-18T02:32:28.3740117-04:00.

## Current Run

- Intent: improve homepage mobile visibility and keep the first fold readable.
- Finding: the clean local 8001 server showed the mobile reveal system hiding too many mid-page sections until scroll.
- Change: made `.reveal` content visible immediately on mobile and for reduced-motion users, then bumped the shared stylesheet cache key to `20260618-13` across public pages.
- Validation: verified the real repo build on `http://127.0.0.1:8001/` with Playwright screenshots and DOM checks after the Browser bridge timed out.
- Result: desktop remains balanced, and mobile now shows the capabilities, Nexus, and project sections without blank reveal gaps.
- Run time: 2026-06-18T02:25:00.0000000-04:00.

## Current Run

- Intent: integrate Nexus Arcade and NexusCentral into the main site without breaking shared navigation.
- Finding: the homepage had only one Nexus product surfaced, and NexusCentral still used a separate white-page layout.
- Change: added a two-card Nexus Suite section to the homepage, standardized the arcade page onto the shared header/footer, and moved NexusCentral onto the shared header plus dark-theme overrides.
- Validation: captured desktop screenshots for the homepage, both product pages, the Nexus section anchor, and verified the mobile menu opens from the shared header via a DOM-node click.
- Result: both Nexus products now sit inside the main site flow, and the nav behaves consistently across desktop and mobile.
- Run time: 2026-06-18T02:14:12.2053495-04:00.

## Current Run

- Intent: improve homepage first-fold readability and visibility again.
- Finding: the hero compression helped, but the capabilities heading still clipped the first card in the desktop fold.
- Change: tightened the proof cards into horizontal rows, reduced hero and capabilities header spacing, and bumped the shared stylesheet cache key to `20260618-11`.
- Validation: Browser screenshot capture still timed out on this page, so I used local Playwright screenshots for desktop and mobile verification, then reloaded the live tab for DOM and console checks.
- Result: the hero is more compact, mobile remains clean, and the desktop fold now shows more of the next section without a structural rewrite.
- Run time: 2026-06-18T02:00:46.7009699-04:00.

Luminary Labs public website is a static HTML/CSS/JS site deployed from `Website` with `CNAME` set to `luminarylabs.dev`. Keep the public site lightweight and additive: hidden/internal experiments should not be linked from the main nav unless explicitly requested.

Moonlit Labs is the private internal workspace brand. `Website` only hosts the public static gate, browser decrypt loader, and encrypted vault artifacts under `vault/`. The public loader decrypts `vault/moonlit-shell.enc` with the top password, then decrypts individual project pages from opaque `vault/projects/*.enc` paths with top password plus project password.

## Current Run

- Intent: improve first-fold readability and human visibility on the homepage.
- Finding: the first compression pass still left the capability cards too low in the fold.
- Change: tightened the hero a second time, reduced proof-card and snapshot-card density further, and lifted the capability section again.
- Validation: Browser screenshot capture timed out on this page, so I used local Playwright screenshots for desktop and mobile verification.
- Result: the desktop fold now shows more of the capability cards, and mobile reveals the studio snapshot sooner without a structural redesign.
- Run time: 2026-06-18T01:45:08.1836054-04:00.

Prototype Moonlit passwords are intentionally insecure for now. Do not treat the static encrypted vault as a place for production secrets or API credentials.

Encrypted Moonlit project payload filenames in the public `Website/vault/projects/` folder should be opaque IDs, not project slugs or titles. Public code may expose the existence of a hidden encrypted workspace, but must not expose plaintext project titles, project content, project-specific passwords, or private source paths.

Private source builds should generate and validate a plaintext preview before encryption so internal pages can be visually checked before `Website/vault/*.enc` is republished.

## Active Intent

Create a local-only automation that audits Luminary Labs website content for clarity and SEO/GEO optimization every 15 minutes.

## Automation Notes

- Runs every 15 minutes.
- Scans page copy for concise, clear, search-friendly text.
- Local-only; do not push to GitHub.

## Current Run

- Intent: ensure the content audit analyzes every site page.
- Finding: the previous audit only scanned root-level HTML and skipped `moonlit.html` because it exited early on `noindex`.
- Change: made the audit recursive across the full site tree, included `noindex` pages in reporting, and tightened image-alt detection to avoid false positives on text-only pages.
- Validation: ran `node scripts/content-audit.mjs` and confirmed it now reports 14 HTML pages.
- Result: the local audit now covers all site pages, including nested game pages and the Moonlit gate.
- Run time: 2026-06-18T01:34:45.0000000-04:00.

## Current Run

- Intent: improve homepage section readability and remove the capabilities overlap.
- Finding: the desktop capabilities heading was still sitting on top of the cards because the section was pulled upward with a negative margin.
- Change: removed the overlap, added a clearer section divider and glow, and raised capability card contrast, spacing, and icon treatment. Bumped the shared stylesheet cache key to `20260618-9`.
- Validation: reloaded the local site in Chrome at desktop and mobile widths, captured fresh screenshots, and compared the visible fold.
- Result: desktop now reads as a clean hero-to-capabilities transition, and the capability cards are easier to scan.
- Run time: 2026-06-18T01:28:23.9361389-04:00.

## Current Run

- Intent: improve homepage fold balance and readability again.
- Finding: the desktop fold was still colliding between the hero proof strip and the capabilities section.
- Change: softened the desktop-only pull-up on `#capabilities`, reduced the card lift slightly, and bumped the shared stylesheet cache key to `20260618-8` across public pages.
- Validation: reloaded the local site in the in-app browser at desktop and mobile widths, captured fresh screenshots, and checked the page identity plus console warnings.
- Result: desktop now shows a cleaner section break with the capability heading visible below the hero, and mobile still stacks cleanly.
- Run time: 2026-06-18T01:12:59.6811279-04:00.

## Current Run

- Intent: improve homepage fold balance and readability again.
- Finding: the desktop fold still clipped the first capability card, even after hero compression.
- Change: shortened hero proof copy, tightened hero and capability spacing, and pulled the capability grid upward harder.
- Validation: reloaded the local site in the in-app browser at desktop and mobile widths, captured fresh screenshots, and checked page identity plus console warnings.
- Result: mobile still stacks cleanly, and desktop now shows more of the capability section inside the first viewport.
- Run time: 2026-06-18T01:00:33.7650880-04:00.

## Current Run

- Intent: improve homepage fold balance and readability again.
- Finding: the hero was readable, but desktop still stopped at the capabilities heading instead of showing the cards.
- Change: tightened the hero card, reduced proof spacing, pulled `#capabilities` upward harder, and kept mobile spacing compact.
- Validation: reloaded the local site in the in-app browser at desktop and mobile widths, captured fresh screenshots, and checked the page identity plus console state.
- Result: desktop now reveals the first capability cards in the fold, and mobile still stacks cleanly.
- Run time: 2026-06-18T00:45:05.1818823-04:00.

## Current Run

- Intent: improve homepage fold balance and readability again.
- Finding: the hero was already clear, but it still left the capabilities section slightly low in the fold on desktop.
- Change: trimmed hero padding, lowered the hero title scale, compressed proof-card and stat spacing, and nudged `#capabilities` upward.
- Validation: reloaded the local site in the in-app browser at desktop and mobile widths, captured fresh screenshots, and checked the page identity and console state.
- Result: desktop now shows more of the next section without harming the mobile layout.
- Run time: 2026-06-18T00:27:40.2744785-04:00.

## Current Run

- Intent: improve first-fold readability and section balance on the homepage.
- Finding: the hero was readable, but it still consumed too much vertical space before `Core Capabilities` came into view.
- Change: tightened desktop hero spacing, slightly reduced hero card padding, and pulled `#capabilities` upward for a cleaner fold.
- Validation: reloaded the local site in the in-app browser at desktop and mobile widths, then captured fresh screenshots and inspected them with `view_image`.
- Result: the homepage now shows more of the next section at desktop without hurting the mobile layout.
- Run time: 2026-06-18T00:13:39.8292815-04:00.

## Current Run

- Intent: improve capability-card readability and first-fold hierarchy on the homepage.
- Finding: the desktop capabilities row still read like one flat dark band, with icons and copy not separated enough.
- Change: upgraded capability cards with stronger gradients, persistent accent bars, icon pills, brighter body text, and bumped the shared stylesheet cache key.
- Validation: reloaded the local homepage in Playwright-backed Chrome at desktop and mobile widths, then captured before/after screenshots.
- Result: the capabilities section now reads as distinct cards and the mobile hero still stays clean.
- Run time: 2026-06-17T23:58:28.0580256-04:00.

## Current Run

- Intent: improve first-fold readability and proof clarity on the homepage.
- Finding: the hero was already strong, but the proof cards still felt slightly flat and one stat label was vague.
- Change: strengthened proof-card contrast, added a thin accent bar, and changed `Quest` to `Quest Store`.
- Validation: reloaded the local site in Browser at desktop and mobile sizes and captured fresh screenshots.
- Result: the first fold reads a bit crisper and the proof area feels more deliberate.
- Run time: 2026-06-17T23:44:06.1374766-04:00.

## Current Run

- Intent: refine first-fold readability and human visibility on the Luminary Labs homepage.
- Finding: the hero proof strip and studio card were legible but still a little flat on both desktop and mobile.
- Change: increased hero proof contrast, tightened spacing, and strengthened hero card separation.
- Validation: reloaded the local site and captured fresh desktop and mobile screenshots in the browser.
- Result: the first fold reads cleaner and the proof cards feel more deliberate.
- Run time: 2026-06-17T23:27:52.8456104-04:00.

## Current Run

- 2026-06-17T23:13:01.8574143-04:00: the hero copy still read a bit slogan-heavy and the proof cards were slightly muted.
- Updated the homepage headline to `Drives Revenue`, sharpened the subcopy, and lifted contrast in the hero proof cards and supporting text.
- 2026-06-17T23:14:33.5546680-04:00: desktop and mobile re-test passed; the first fold now reads cleaner and the mobile nav toggle opens correctly.
- Remaining note: Tailwind CDN still emits a non-blocking production warning in the console.

- 2026-06-17T23:03:23-04:00: the first post-hero section was too dim and low in the fold.
- Removed the reveal delay from the Core Capabilities header and tightened the section's top spacing.
- Bumped stylesheet cache keys across all public pages so local renders pick up the CSS changes.
- Verified with desktop and mobile screenshots; desktop now shows the section header in view.

## Current Run

- 2026-06-17T21:57:23-04:00: captured a desktop screenshot of the live homepage.
- The hero still wastes vertical space on desktop, especially below the CTA row.
- Added a compact proof strip under the hero actions to fill the fold with scanable value.
- Next pass should verify the new strip improves balance and does not crowd mobile.

## Current Run

- Added a local content-audit script and 15-minute PowerShell loop.
- Added canonical URLs to public pages.
- Added a concise meta description to NexusCentral.
- Local audit now passes on public pages.
- Created Windows Scheduled Task `LuminaryLabsContentAudit`.
- Task runs every 15 minutes and logs to `logs/content-audit.log`.

## Current Run

- Intent: improve Luminary Labs homepage visibility and readability locally.
- Finding: the hero still dominated the first viewport on desktop and mobile.
- Change: tightened hero spacing, reduced proof-card chrome, and shortened hero copy.
- Validation: re-rendered desktop and mobile; inspected both screenshots locally.
- Result: the first fold now reads faster and mobile shows all three proof cards cleanly.
- Run time: 2026-06-17T22:29:21.6902159-04:00.

## Current Run

- Intent: refine the homepage hero balance again.
- Finding: desktop hero still felt oversized and left too little fold variety.
- Change: reduced hero padding, headline size, and card chrome.
- Validation: Browser screenshot timed out, so Playwright screenshots were used locally.
- Result: desktop now reveals the Core Capabilities section at the fold; mobile remains readable.
- Run time: 2026-06-17T22:46:24.7348794-04:00.

