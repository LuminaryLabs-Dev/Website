# Changelog

## 2026-09-06 — Full-color hero scenes (local implementation)

- Use seven distinct GLSL heroes with the existing shared renderer. Retain and refine
  the hex hallway, Obsidian and ClusterBots; add an infinite arcade, branching
  structures, terraced arches and shell chambers. Keep Arcade artwork flat and intact.
- Remove hero darkening overlays and saturation filters. Use full-opacity scenes,
  matching 1440×900 posters, and a tight text-only outline for readable hero copy.
- Add per-scene adaptive pixel budgets, retain pause/reduced-motion/offscreen behavior,
  and improve edge stability in the five existing Open Source studies.
- Complete five visual review stages, 17 browser interaction checks, seven unavailable-
  WebGL fallback checks, seven offscreen checks, and 12 production shader renders in
  headless Three.js/SwiftShader. Final 28 desktop/tablet/mobile page captures have no
  overflow, missing hero images or console errors. Camera clearance was sampled 2,407
  times across ten simulated minutes per hero; this is bounded, not exhaustive proof.
- Software rendering measured approximately 2.6–22.5 FPS at initial quality in the
  reviewed environment. Physical-device 30 FPS and exhaustive moving-text contrast
  remain unverified. No commit, push, workflow change or deployment was made.

## 2026-09-06

- Unify the seven studio tabs and Arcade library navigation with generated static
  headers/footers, local Inter, consistent content widths, buttons and motion rules.
  Keep the 32px desktop / 48px mobile white header and transparent bulb logo.
- Preserve Nexus Arcade’s paired cabinet drawings, side studies and game routes.
  Keep installer, service worker, game host logic and existing player styles unchanged;
  position the player above the shared fixed navigation.
- Replace page-wide content injection with complete static HTML. Preserve existing
  service prices, biographies, project descriptions, email address and homepage controls.
  Add service disclosures, project image previews, copy-email feedback and email drafts.
- Use the shared capped shader renderer for Open Source and Contact. Load one selected
  study or robot portrait at a time; retain clean posters, reduced-motion support,
  visibility suspension and user pause controls. Self-host existing Three.js 0.160.0.
- Complete five visual checkpoints (140 route/viewport captures), 25 browser scenario
  checks, the Arcade contract checks and local route/syntax checks. Verify eight production
  shaders in headless Three.js/SwiftShader, and retain desktop/mobile recordings.
- Validation limitation: Arcade service-worker startup fails identically in the baseline
  and candidate sandbox runs, so installation/gameplay/fullscreen remain unverified.
  Physical-device GPU performance and live deployment are outside this local validation.


- Replace the homepage gradient with a persistent solid white header: 32px on desktop and 48px on mobile with 44px touch controls. Remove idle timers, shading changes and upward movement; retain dark links, animated underlines, bulb glow/replay and mobile menu controls.

- Tighten the white homepage header gradient from 128px to 80px and slow its opacity and navigation color transitions to one second. Keep reduced-motion transitions instant and preserve the existing layout and four-second idle delay.

- Change the homepage header gradient to white with dark active links; keep light idle links over the hallway and dark idle links over white sections. Preserve the dark mobile menu and no-JavaScript navigation.

- Install the supplied green/gold bulb as the top-right homepage logo. Use image_gen on the selected artwork, then remove its baked checkerboard with an alpha mask in ImageMagick. Preserve the selected image’s RGB pixels and export an optimized PNG with verified alpha transparency.

- Replace the homepage white header with a 64px overlay and a dark-to-transparent gradient. After four seconds without hover or focus, fade the gradient away and move navigation up 6px; restore it on interaction. Use dark idle links over light sections.
- Add expanding link underlines and a restrained hover/focus glow to the existing transparent Luminary Labs logo. Preserve intro replay, mobile navigation, keyboard access, reduced motion, and no-JavaScript navigation.
- Validate 21 local Chromium checks covering header states, desktop/mobile interactions, existing hero controls, intro and fallback behavior, unchanged Portfolio navigation, and production GLSL in headless Three.js. Validation uses SwiftShader and mobile emulation; physical-device performance and live deployment are outside this check.

## 2026-09-05

- Restore “Explore our work” beneath the hero headline with a white underline, a 200ms rising white fill, black text on hover/focus, and an instant reduced-motion state. Keep portfolio navigation separate from hallway playback.
- Validate nine localhost checks covering visual states, fixed geometry, keyboard focus, reduced motion, navigation, mobile tapping, and the unchanged GLSL in headless Three.js with SwiftShader.
- Simplify the hero to its headline, animated hallway, and one centered down arrow. Remove the supporting copy, eyebrow, CTA buttons, and visible pause button.
- Add a transparent, keyboard-accessible background control that pauses and resumes without moving the camera; keep text selection, drag gestures, and arrow scrolling separate from playback.
- Rebalance desktop/mobile spacing and retain navigation, intro controls, reduced-motion fallback, and existing shader performance limits.
- Validate the simplified hero on localhost with 17 browser checks, an independent Three.js render, and a mobile touch swipe. Preserve the initial software-rendering intro timeout in the evidence; isolated intro/fallback checks passed. Physical-device performance remains unverified.
- Reframe the homepage around “Turning specialized knowledge into working technology.” with direct contact and portfolio links, lighter typography, and simpler capability sections.
- Add a procedural GLSL hallway with continuous forward camera travel, cyan and amber lighting, analytic surface intersections, and a single rendering pass.
- Keep headline and navigation in accessible HTML above the canvas. Supply a real shader-frame poster and a locally hosted, OFL-licensed Inter font.
- Add animation pause/resume, reduced-motion fallback, adaptive pixel budgets, a 30 FPS limit, offscreen suspension, and integration with intro skip, replay, and Escape.
- Validate desktop and mobile emulation, real WebGL output, intro behavior, navigation, context-loss fallback, and JavaScript-disabled content in Chromium using SwiftShader. Lavapipe and physical-device frame rates are outside this environment's validation coverage.
