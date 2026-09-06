# Luminary Labs – Dev Shop Website

A vibrant, interactive static site with:

- Home page showcasing featured projects
- Projects page with category filters (Websites, Apps, Experiments)
- Meet the Team page with interactive cards
- Three.js demo page (plane + camera + orbit controls) as a starter game scene

## Run locally

Open `index.html` directly in your browser, or serve the folder with a simple HTTP server to avoid CORS issues on some browsers.

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

Decorative WebGL scenes use a 24 FPS / 260,000-pixel budget; the homepage keeps
its existing 30 FPS adaptive renderer. Paused, hidden and offscreen scenes stop.
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
