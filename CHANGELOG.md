# Changelog

## 2026-09-05

- Simplify the hero to its headline, animated hallway, and one centered down arrow. Remove the supporting copy, eyebrow, CTA buttons, and visible pause button.
- Add a transparent, keyboard-accessible background control that pauses and resumes without moving the camera; keep text selection, drag gestures, and arrow scrolling separate from playback.
- Rebalance desktop/mobile spacing and retain navigation, intro controls, reduced-motion fallback, and existing shader performance limits.
- Validate the simplified hero on localhost with 17 browser checks, an independent Three.js render, and a mobile touch swipe. Preserve the initial software-rendering intro timeout in the evidence; isolated intro/fallback checks passed. Physical-device performance remains unverified.
- Reframe the homepage around “Turning specialized knowledge into working technology.” with direct contact and portfolio links, lighter typography, and simpler capability sections.
- Add a procedural GLSL hallway with continuous forward camera travel, cyan and amber lighting, analytic surface intersections, and a single rendering pass.
- Keep headline and navigation in accessible HTML above the canvas. Supply a real shader-frame poster and a locally hosted, OFL-licensed Inter font.
- Add animation pause/resume, reduced-motion fallback, adaptive pixel budgets, a 30 FPS limit, offscreen suspension, and integration with intro skip, replay, and Escape.
- Validate desktop and mobile emulation, real WebGL output, intro behavior, navigation, context-loss fallback, and JavaScript-disabled content in Chromium using SwiftShader. Lavapipe and physical-device frame rates are outside this environment's validation coverage.
