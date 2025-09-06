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

## Notes

- The Three.js demo uses CDN scripts for ease. You can pin versions or move to a bundler later.
- The plane vertices animate slightly and normals are recomputed for nicer lighting.
