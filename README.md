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

## Editing

- Styles: `assets/css/style.css`
- Site data: `assets/js/data.js`
- Page scripts: `assets/js/*.js`

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
- `nexus-arcade/styles.css`: shared minimalist theme and cabinet layout.
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
