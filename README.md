# Luminary Labs – Dev Shop Website

A vibrant, interactive static site with:

- Home page showcasing featured projects
- Projects page with category filters (Websites, Apps, Experiments)
- Meet the Team page with interactive cards
- Three.js demo page (plane + camera + orbit controls) as a starter game scene

## Run locally

Run `npm start`, then open `http://127.0.0.1:4173/`. The local Node server binds to loopback, serves JavaScript modules with the correct content type, and disables caching during review. Set `PORT` to use another local port.

### Optional: serve with PowerShell

```powershell
# From the repo root
$port=8080; $p=python - <<'PY'
import http.server, socketserver
import os
PORT = int(os.environ.get('PORT','8080'))
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving at", PORT)
    httpd.serve_forever()
PY
```

Then visit http://localhost:8080/

## Shared studio pages

Home, Nexus Arcade, Open Source, Services, Portfolio, Team and Contact share
complete static navigation and footer markup, local Inter typography and a
common set of components. The Arcade library uses the same navigation while
retaining its existing installer and fullscreen player.

- `templates/site-header.html` and `templates/site-footer.html`: shared markup.
- `scripts/build-site-shell.mjs`: generates the shared markup into eight HTML files.
- `assets/css/site-tokens.css`: font, colors, widths, spacing and timings.
- `assets/css/site-shell.css`: navigation, logo, footer and mobile fallback.
- `assets/css/site-components.css`: heroes, buttons, content rows and controls.
- `assets/css/site-motion.css`: transitions, entrances and reduced motion.
- `assets/js/site-nav.js`: enhances the static mobile navigation.
- `assets/js/site-ui.js`: disclosures, project previews, clipboard and email drafts.
- `assets/js/site-motion.js`: visibility-aware decorative motion and portrait scheduling.
- `assets/js/shader-renderer.js`: bounded WebGL rendering, pause and fallback handling.
- `assets/js/page-scenes.js` and `site-studies.js`: atmospheric scenes and one selected study.
- `assets/js/team-portraits.js`: optional portraits using the existing robot geometry.
- `assets/vendor/three/`: self-hosted Three.js 0.160.0 and its MIT license; loaded on demand.
- `assets/css/home.css`, `assets/js/home-hero.js`, `assets/js/luminary-intro.js`: homepage-specific hero and intro.

After changing a shared template, run `npm run build:shell`, then
`npm run check:shell`. Edit page content directly in the corresponding HTML;
page scripts no longer replace the main content. Essential content and links
remain available without JavaScript. Contact prepares an email draft; it does
not submit a form or send email from this site.

Marketing WebGL scenes use a 30 FPS cap and adaptive pixel tiers, detailed below.
The temporary loading bulb uses 24 FPS and at most 130,000 pixels. Paused, hidden and offscreen scenes stop.
Reduced motion uses posters. Shader studies and robot illustrations run only
when selected; switching portraits disposes the previous renderer.

## Content Audit

Run the local audit checker:

```powershell
node scripts/content-audit.mjs
```

Run it every 15 minutes on this machine:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-content-audit.ps1
```

## Notes

- The Three.js demo uses CDN scripts for ease. You can pin versions or move to a bundler later.
- The plane vertices animate slightly and normals are recomputed for nicer lighting.

## Nexus Arcade

- `/nexus-arcade/`: cabinet overview, existing CAD drawings, and Play Games links.
- `/nexus-arcade/play/`: prototype library, installation, verification, and player.
- `/gemini-arcade.html`: legacy redirect to the cabinet overview.
- `nexus-arcade/styles.css`: legacy library base; the cabinet overview uses the shared studio components.
- `nexus-arcade/play/styles.css`: library and player layout.

Serve the exact checkout with `python -m http.server 4173 --bind 127.0.0.1` and visit
`http://127.0.0.1:4173/nexus-arcade/`. Run `npm run test:nexus-arcade` for route and
installer contract checks. Use a browser for desktop/mobile layout, navigation,
installation/cancellation, gameplay/fullscreen, cleanup, and returning-session checks.
The external catalog and pinned installer require network access.

The player imports `../app.mjs`. The service worker stays at `/nexus-arcade/sw.js`
with scope `/nexus-arcade/`, covering both routes and preserving existing game URLs.
The manifest keeps the original application identity (`/nexus-arcade/`) and scope,
but launches `/nexus-arcade/play/`. Package pins and storage keys are unchanged.
Temporary game assets are removed on player close/session exit; game saves are retained.

### Hero scenes and category playlists

`assets/js/shader-library.js` is the authoritative catalog. Each entry has an ID,
name, page category, GLSL source, shader-derived poster, pixel budgets and optional
pointer behavior. The seven marketing pages declare `data-shader-category`;
`page-scenes.js` handles all of them, including Home. The separate Open Source
studies and Team portraits retain their existing controllers.

| Page | Category | Scenes |
| --- | --- | --- |
| Home | Welcoming technology | Soft hallway; Light atrium |
| Nexus Arcade | Gaming | Arcade machines; Pinball lounge |
| Open Source | Fractals | Ten procedural shaders under `assets/shaders/fractals/` |
| Services | Building systems | Assembly bench; Signal foundry |
| Portfolio | Exhibits | Sculpture gallery; Prismatic garden |
| Team | Collaboration | Shared ideas; Idea constellation |
| Contact | Connections | Connected nodes; Resonance rings |

On entry, a category chooses a random scene. Its shuffle bag covers every scene
before refilling and avoids an immediate repeat. Active playback lasts 45 seconds;
the next scene begins preparing at 40 seconds. A 1.2-second fade starts only after
a successful first frame. Pause, hidden document, offscreen state and the intro
suspend the rotation clock. Manual selection disables Auto-switch. Next advances
within the category. Clicking or tapping the image also advances; pointer drags, scrolling, text selection and interactive controls do not. Every current category has at least two scenes. Single-scene categories remain supported.

Only the current and upcoming/outgoing scenes exist during a transition. Both use
half their normal pixel budgets during the fade; the old renderer and GL context
are released afterward. Failed or timed-out preparation keeps the current scene.
Rendering remains capped at 30 FPS with adaptive pixel tiers. Fractals use one
bounded bloom pass (`shader-bloom.js`), with one texture and one additional draw.
The Mandelbulb uses lower budgets than the other fractals.

Reduced motion shows the selected poster, removes scene renderers and disables
Auto-switch. No-JavaScript pages retain their static posters and essential content.
The loading bulb remains an initial-load cover and is not recreated between scenes.
Home uses the same tap-to-next action; its explicit Pause and scroll controls remain available.

`/shaders/` is the live category gallery. `?category=opensource&scene=molten-glass`
opens a particular scene with rotation held. Each page's Scenes menu links to this
gallery. Local reference comparisons, five-second recordings, review notes and
capture metadata from the first pass are in `output/shader-library/`. The current 22-scene material review, mobile compositions and refreshed five-second recordings are in `output/shader-material-review/`.

The ten concepts are real-time procedural interpretations, not exact reproductions
of the generated reference art. Glass is approximated with shading; the shaders do
not perform offline-quality multi-bounce refraction. Existing title/content layout,
Arcade drawings/dimensions and game behavior are preserved.

### Local feedback implementation — 2026-09-21

`WEBSITE_FEEDBACK.md` owns W-001–W-010 status and validation evidence. The seven
marketing pages now reserve an 18px desktop / 12px mobile inset above the compact
navigation. The intro and temporary loading covers share clear-glass and brass
bulb materials; their presentation modes still control background, stars and input.
Contact links are capsules between shared animated node centers. Twelve cell edges
reuse eight cached centers, with four-sample normals and a bounded 48-step trace.
Open Source checks ray convergence and filters its neon bands by pixel footprint.

Posters are captured from the current GLSL at 15 seconds (1440×554; bulb 720×720).
Changed shaders, posters and their relevant controllers use `20260921-feedback-2`,
except the corrected Team shader/poster pair, which uses `20260921-team-center-3`.
Review images and motion samples live under `output/playwright/`; these are local
validation artifacts, not a claim of publication or user aesthetic acceptance.

Run the local Node preview with `npm start` at `http://127.0.0.1:4173/`.
The server serves ES modules with the correct JavaScript MIME type. Local before/after
images and animation clips are collected at `output/playwright/review.html`; see
`WEBSITE_FEEDBACK.md` for completed checks and their limits.

### 2026-09-22 shader library validation

The original library pass used `20260922-library-1`; the current material/variant pass uses `20260922-library-2`. Ten 1440×554 posters are captured from
the running shaders, including their bloom pass, at shader time 8 seconds. Ten
five-second MP4 clips cover approximately shader time 8–13 seconds. The MP4
timeline is 30 FPS; capture metadata records actual rendered frames separately.
See `output/shader-library/manifest.json` and `WEBSITE_FEEDBACK.md` for evidence.

### Material and category expansion

The current library has 22 scenes: two per category except Open Source, which has
ten. All received a material review, including selective environment reflection,
internal light and approximate thin-surface transmission. The current review is
`output/shader-material-review/index.html`; its manifest links sources and posters.
`qa.json` records page interactions, all-scene desktop/mobile checks, touch and
reduced-motion results. `video-metadata.json` verifies 22 five-second 1280×492 clips.
These are local review artifacts, not a deployment.

### Larger-form shader pass

All 22 scene sources use larger framing or broader geometry, with less fine
repetition. Changes are scene-specific: ribbons retain their spiral sheets, coral
retains perforations, roots retain ridges, Mandelbulb retains power-eight lobes,
and the Team globe retains every source and its shared-center bounce. Fractals
use calmer surface patterns, material-specific highlight widths and a bounded
ambient-occlusion probe. Rendering budgets and playlist behavior remain unchanged.

Current cache version: `20260922-library-3`. The before/after review is
`output/shader-scale-review/index.html`; previous source files are preserved in
`before-sources.zip`. Current clips, fallback images and mobile evidence are
refreshed in the existing material-review collection.
