# Changelog

## 2026-09-06

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
