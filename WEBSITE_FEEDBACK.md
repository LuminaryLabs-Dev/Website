# Website Feedback Tracker

Use this file for things that feel wrong, unclear, annoying, or unfinished on the Luminary Labs website.

Last reviewed: 2026-09-21

## Working rules

- Add observations as `noted` while we review the site.
- Move items to `planned` only when we agree they are worth changing.
- Move items to `in progress` when implementation starts.
- Move items to `done` only after the local result is checked.
- Merge duplicate observations and remove stale notes as the tracker is cleaned up.

## Statuses

- `noted` — observed, not yet evaluated
- `planned` — agreed work item
- `in progress` — currently being changed
- `done` — fixed and verified locally
- `wont fix` — intentionally left unchanged

## Issues

| ID | Status | Page | What I do not like | Why it matters | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| W-001 | done | `/` | There is almost no space above the top navigation bar. It feels pressed against the browser edge. | The page feels cramped at the first point of contact and the navigation has less visual separation from the browser frame. | medium | Confirmed visually in the local page at `http://127.0.0.1:4173/`. |
| W-002 | done | `/` | The loading bulb and the main bulb shader do not look like the same visual. | The transition feels like the site changes identity when loading completes instead of continuing one coherent animation. | high | Source correction: both run `fractal-filament.glsl`; the loader uses `uLoadingCover=1` and `hero-loading-bulb.png` as a still fallback. Separate material branches caused a visual mismatch. |
| W-003 | done | All shader pages | The bulb itself could have a better shape and feel more intentionally designed. | The repeated bulb is the visual anchor across the site, so an awkward or generic silhouette weakens every page. | medium | Review the glass envelope, filament, socket, proportions, and visual integration with each scene. |
| W-004 | done | `/` | The Home shader should feel more homey, welcoming, and techno-soft. | The current hard corridor reads more like a generic sci-fi tunnel than a warm entry point for the studio. | high | Direction: soft technological atmosphere, controlled glow, depth, and a stronger sense of welcome. |
| W-005 | done | `/nexus-arcade/` | The arcade machines need an overhaul; their current shapes and presentation look awkward. | The machines are the page’s subject, but the current silhouettes read as rough blocks instead of convincing arcade hardware. | high | Review cabinet proportions, perspective, material separation, lighting, and how the bulb competes with the machines. |
| W-006 | done | `/opensource.html` | The shader needs better anti-aliasing, less full-black background void, and richer faceted distorted geometry. | Jagged edges and large black gaps make the scene feel broken rather than intentionally abstract. | high | Direction: preserve the exploratory distortion while expanding the geometry and improving edge quality and continuity. |
| W-007 | done | `/services.html` | The Services shader is visually weak and needs a major update. | The dark ribbon/tunnel treatment is too generic and low-contrast to communicate building systems and reaching the market. | high | Treat this as a substantial visual redesign, not a small tuning pass. |
| W-008 | done | `/portfolio.html` | The Portfolio shader also needs a major update. | The dark repeating tunnel does not make selected work feel distinctive, concrete, or memorable. | high | Direction should support a curated body of work instead of acting as generic background motion. |
| W-009 | done | `/team.html` | The Team shader needs to be more responsive and have richer ambience, including more cloud-like environmental detail. | The current scene is mostly empty and static-looking, so it does not convey people, collaboration, or living studio energy. | medium | Review movement response, atmospheric depth, cloud/fog layers, and subtle ambient motion. |
| W-010 | done | `/contact.html` | The Contact shader should use connected nodes and wires, not disconnected-looking wire fragments and isolated shapes. | A connected network would directly communicate conversation, collaboration, and a contact pathway. | high | Direction: a readable node graph with visible links, coherent grouping, and responsive connection activity. |
| W-011 | done | All shader pages | Support categorized shader playlists and ten brighter fractal directions. | Each page should keep its theme while scenes vary like a screensaver. | high | Ten scenes, category playback, live gallery, ten verified five-second clips and final browser checks complete locally. |


## Entry template

```text
### W-### — Short description
- Status: noted
- Page: `/path`
- Problem: What feels wrong or what is missing.
- Why it matters: The effect on clarity, trust, usability, or conversion.
- Priority: high / medium / low
- Evidence: Screenshot, exact text, or visible behavior.
- Proposed direction: Optional; do not treat as approved work yet.
```

## Local implementation evidence — 2026-09-21

All ten items are implemented and verified locally. [Open the before/after and motion review](http://127.0.0.1:4173/output/playwright/review.html). Evidence paths below are relative to `output/playwright/`.

| Item | Implemented result | Verification |
| --- | --- | --- |
| W-001 | 18px desktop / 12px mobile space above the compact navigation; offsets and mobile menu move together. | Seven desktop/mobile page pairs; `runtime-checks.txt` verifies menus, 44px links and no horizontal overflow. |
| W-002 | Intro and loader share glass/brass materials in their existing shared shader. External and embedded loading stills were regenerated. | `before-bulb-pair.png`, `after-bulb-pair.png`, loading transition images, `artifact-manifest.json`. |
| W-003 | Slimmer bulb envelope, smoother shoulder, simplified filament supports and refined socket/glass appearance. | Matching bulb comparisons and current shader-derived 720px fallback; inline fallback matches its 160px derivative. |
| W-004 | Warm wood, linen and sage corridor, softer panels, gentle travel and amber/mint lighting. | Home desktop/mobile comparisons and before/after hallway motion. |
| W-005 | Angled cabinets with recessed CRTs, marquees, control decks, joysticks, buttons, coin panels and distinct materials. Foreground CAD drawing is half its former width and height. | Final Arcade desktop/mobile comparisons and motion; `steering-runtime-checks.txt`. Computed scale is 0.5 on both viewports; rendered desktop drawing approximately 362×223px, mobile 150×107px. |
| W-006 | Expanded facets, explicit ray convergence, footprint-filtered neon bands and a mineral-colored distant field. Previous unconverged-ray shading and near-black fade were corrected. | Open Source before/after views and motion; final time samples at 0, 8, 30 and 90 seconds; WebGL error 0. |
| W-007 | Connected assembly bench with layered modules, pins and data buses supports the page’s systems-building offer. | Services desktop/mobile comparisons and before/after motion show the substantial redesign. |
| W-008 | Three distinct sculptures on plinths form a curated gallery, supporting selected completed work. | Portfolio desktop/mobile comparisons and before/after motion. |
| W-009 | Cloud globe and atmosphere, smoothed pointer response, receiving bulbs placed radially outward from the average of all three source positions. Bulbs bounce along that radial direction, squash, overshoot and settle with arrival glow. | `team-arrival.mp4`, final Team desktop/mobile views, `steering-runtime-checks.txt`, pointer measurements in `interaction-checks.txt`, and final time samples. `team-center-checks.txt` and `team-center-sheet.png` cover the corrected shared-center arrangement. |
| W-010 | Wire capsules terminate at the same animated centers used by nodes. Eight cached centers and twelve edges per cell keep tracing bounded. | Contact before/after motion and final time samples; `contact-performance.txt` and `final-live-checks.txt`. |

### Shared validation

- All seven pages passed desktop (1440×900) and mobile (390×844) checks: ready shaders, WebGL error 0, no page errors, readable content, working navigation, mobile menus and no horizontal overflow. Final Arcade/Team checks were repeated after the user’s refinements.
- Pause, keyboard resume, offscreen suspension and simulated document-hidden suspension passed. Reduced-motion, no-JavaScript and forced WebGL-failure contexts showed loaded current posters and usable content: `runtime-checks.txt`, `steering-runtime-checks.txt`, `fallback-checks.txt`.
- Intro Skip, Escape, replay and automatic completion passed. Replay focus return was verified after its animation frame in `final-failure-checks.txt`, superseding the earlier immediate sample in `interaction-checks.txt`.
- Delayed hero loading retained the bulb until readiness; release disposed the bulb and cover. Forced bulb shader/image failures retained a still fallback. Active-loading timeout disposed the renderer, showed the poster and prevented late revival: `interaction-checks.txt`, `final-failure-checks.txt`, `timeout-check.txt`.
- Existing renderer budgets remain in use. Final live Contact, Team and Open Source samples ran approximately 30 FPS at their full adaptive tiers on Apple M2; revised Arcade also measured approximately 30 FPS. The initial Contact regression was fixed by caching node centers. See `final-live-checks.txt`, `steering-performance.txt`, `contact-performance.txt` and `animation-performance.txt`.
- All seven HTML pages match the original markup after normalizing changed cache keys: `content-preservation.json`. Published copy, links, CAD sources/dimensions, player, installer and save logic are preserved.
- All eight affected posters come from implemented GLSL at 15 seconds. Relevant cache keys are `20260921-feedback-2` (Team shader/poster: `20260921-team-center-3`); hashes, dimensions and review-media existence are recorded in `artifact-manifest.json`.
- `npm run check:shell` (8 pages), `npm run test:nexus-arcade`, JavaScript syntax checks and `git diff --check` passed. Shared templates were not changed.
- The Node preview now uses `npm start` / `scripts/serve.mjs`. This fixes the prior server’s incorrect `.mjs` MIME type. The Arcade library loads with HTTP 200 JavaScript and no page errors. Missing files return 404.
- The existing Chrome Team tab was selected and refreshed at `http://127.0.0.1:4173/team.html`; native accessibility state verified its URL and selection. Visual evidence comes from the headed Playwright browser because native screenshot capture returned black.

### Limits and handoff

- Mobile checks use an emulated viewport; performance samples are short measurements on this Apple M2, not guarantees for every device. Document-hidden suspension was simulated.
- The existing Arcade contract check and library loading passed; a complete game installation/fullscreen session was not exercised.
- Technical verification is complete. User aesthetic acceptance remains separate. Changes are local; nothing was pushed, deployed or published.
- W-009 correction: the user clarified that the shared center means the average of all source bulbs in a group. The former screen-up placement was incorrect and has been removed. The receiving socket and all three curve endpoints share the same radial bounce position. Desktop/mobile samples cover all four arrivals and settled times 15, 30 and 90 seconds.

## Shader library follow-up — 2026-09-22

The user preferred the original Open Source glow over the W-006 revision. The new
fractal collection supersedes that visual direction. Ten generated references are
interpreted as real animated geometry with camera travel, lighting and bloom.
`output/shader-library/index.html` presents each reference beside its five-second
recording and records the per-shader review/refinement. `/shaders/` provides live
category and scene selection. No generated image is used as an animated shader.

Current evidence: `pages-qa.txt` covers all seven pages at desktop/mobile sizes;
`switching-qa.txt` covers the real 45-second rotation, shuffle, pause/offscreen/hidden
clock suspension, failure retention and reduced-motion disposal. `final-qa.txt`
covers each fractal on mobile and the corrected initial loading bulb behavior.
These files live in `output/shader-library/`. Earlier HTML-normalization evidence
predates the authorized controls and category markup changes.

### Final library checks

- Ten distinct GLSL sources, ten current shader-derived posters and ten 1440×554 MP4 files; every exported clip is exactly 5.0 seconds. Source/poster/bloom hashes and review notes are in `manifest.json`.
- Each shader received a render review, a geometry/material refinement pass where needed, and a final motion review at 0.2, 2.5 and 4.8 seconds. `motion-review-1.webp` and `motion-review-2.webp` collect those samples.
- All ten mobile scenes rendered with WebGL error 0, loaded 1440px posters and no horizontal overflow. Paused manual selection works without resuming animation.
- Clean-context performance samples for all ten scenes were approximately 30 FPS at their configured full pixel tiers on this Mac. These are short local samples, not all-device guarantees. The fade used two 318,976-pixel renderers and returned to one renderer; the observed maximum was two. See `performance-qa.txt`.
- All seven pages retained loaded, visible posters, headings and unclipped content with JavaScript disabled and with WebGL forced unavailable: `fallback-qa.txt`.
- Delayed initial loading showed the bulb advancing from frame 2 to frame 14 before revealing the hero. Readiness left one scene and no cover. Reduced motion left zero scene renderers.
- The final mobile harness logged a localStorage access error when its earlier test-only init script navigated to `about:blank`; this is not a website error. The separate clean-context shader/performance run reported no page errors.
- Existing shared-shell (8 pages), Nexus Arcade contract and JavaScript syntax checks passed; `git diff --check` passed. No new test files were added to the repository.
- The live library is `/shaders/`; reference/video comparisons are `/output/shader-library/`. Both are local previews. Nothing has been pushed or published.
- Fidelity limit: these are bounded real-time procedural interpretations, including approximated glass lighting. They are not exact reproductions of the generated reference art. User aesthetic acceptance remains separate from the technical checks.

## Material and category expansion — 2026-09-22 (W-012)

Completed locally: every category now has at least two scenes (22 total). Home adds
Light atrium; Arcade adds Pinball lounge; Services adds Signal foundry; Portfolio
adds Prismatic garden; Team adds Idea constellation; Contact adds Resonance rings.
Open Source keeps its ten distinct fractals.

All 22 scenes received a material review. The fractals now include depth-probe
absorption, wrapped backlighting, refracted internal light patterns and Fresnel
reflection. Other scenes apply reflection or transmission selectively to glass,
metal and translucent surfaces. Reflection samples an analytic environment, not
other scene geometry. Subsurface scattering is approximated, not physically traced.
The existing Team globe retains its shared-center destination and attached bounce.

Clicking/tapping the visual advances within its category. Pointer movement over 8px,
scrolling, selection and interactive controls suppress this action. A completed
touch tap survives the browser's subsequent pointer-leave event. The separate Pause
and keyboard-accessible Next buttons remain. Home no longer maps background taps to
Pause. Existing rotation, failure retention, crossfade and reduced-motion rules remain.

Validation and visible review:

- All seven actual pages passed click-to-next, drag-without-switching, Pause-without-switching and switching while paused. Settled renderer count was one.
- All 22 desktop/mobile scenes returned WebGL error 0. Mobile screenshots had loaded 1440px posters and no horizontal overflow. Clean browser contexts reported no page errors.
- Touch Next passed, including reduced-motion poster switching with zero scene renderers.
- Short local performance samples were approximately 29–31 FPS at configured budgets. This is not a guarantee for other devices. Forced higher-resolution capture of Connected nodes was slower than its normal budgeted playback.
- Reviewed all 22 scenes at three moments in their actual exported videos. Fixed oversized repeating foundry geometry, weak new-scene framing, pinball backboard visibility and mobile ring clipping during the loop.
- Refreshed all 22 fallback images and five-second videos. Every clip is 1280×492, exactly 5.0 seconds and 150 encoded frames. Samples, SHA-256 hashes, mobile images and checks live in `output/shader-material-review/`. The original ten reference comparisons remain in `output/shader-library/`.
- Disk exhaustion interrupted capture. Only redundant raw recordings and frame extracts recoverable from the retained original videos were removed. Finished original videos and generated references were preserved. All current clips were subsequently verified.
- Browser metadata confirmed all 22 clips are five seconds; playback advanced normally. The review gallery passed mobile overflow checks.
- Shared-shell, Nexus Arcade contract, JavaScript syntax and diff whitespace checks passed. No test files were added to the repository. No push or deployment performed.

Current review: `/output/shader-material-review/`. Live library: `/shaders/`.
