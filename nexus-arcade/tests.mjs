import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  LATEST_URL,
  PACKAGE_REF,
  PACKAGE_URL,
  SERVICE_WORKER_PACKAGE_URL,
  hostedGameUrl,
  trustedThumbnailUrl,
} from "./config.mjs";

const root = path.dirname(new URL(import.meta.url).pathname);
const read = (name) => readFile(path.join(root, name), "utf8");
const files = await readdir(root);
assert.deepEqual(files.sort(), ["app.mjs", "config.mjs", "index.html", "manifest.webmanifest", "play", "styles.css", "sw.js", "tests.mjs"].sort());
assert(!files.some((name) => /\.(?:wasm|mp3|wav|ogg|webp|jpe?g|png)$/i.test(name)), "Website route must not contain game assets");

assert.match(PACKAGE_REF, /^[a-f0-9]{40}$/);
assert.equal(PACKAGE_URL, `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/nexus-arcade.mjs`);
assert.equal(SERVICE_WORKER_PACKAGE_URL, `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/service-worker.mjs`);
assert.equal(LATEST_URL, "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Prototypes@main/registry/latest.json");
assert.equal(hostedGameUrl("blood-maiden"), "https://luminarylabs-dev.github.io/NexusArcade-Prototypes/games/blood-maiden/");
assert.throws(() => hostedGameUrl("../private"), /Invalid game slug/);
assert.equal(trustedThumbnailUrl(`https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Prototypes@${"a".repeat(40)}/prototypes/bumble-beez/cover.png`).includes("bumble-beez"), true);
assert.throws(() => trustedThumbnailUrl("https://cdn.jsdelivr.net/gh/attacker/games@main/cover.png"), /Untrusted/);

const overview = await read("index.html");
const html = await read("play/index.html");
assert.match(overview, /href="https:\/\/luminarylabs.dev\/nexus-arcade\/"/);
assert.match(overview, /href="\/nexus-arcade\/play\/"/);
assert.doesNotMatch(overview, /<iframe|src="[^"\n]*app\.mjs/);
assert.match(html, /href="https:\/\/luminarylabs.dev\/nexus-arcade\/play\/"/);
assert.match(html, /href="\.\.\/styles\.css\?v=/);
assert.match(html, /href="\.\/styles\.css\?v=/);
assert.match(html, /src="\.\.\/app\.mjs\?v=/);
assert.match(html, /href="\.\.\/manifest\.webmanifest"/);
const manifest = JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.id, "/nexus-arcade/");
assert.equal(manifest.start_url, "/nexus-arcade/play/");
assert.equal(manifest.scope, "/nexus-arcade/");
assert.equal(manifest.background_color, "#f2f1ed");
assert.equal(manifest.theme_color, "#d94824");

// Resolve both documents' local resources from their actual nested route.
// Canonical URLs, anchors, and external links are deliberately excluded.
for (const [route, document] of [["/nexus-arcade/", overview], ["/nexus-arcade/play/", html]]) {
  for (const [, resource] of document.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    const url = new URL(resource, `https://luminarylabs.dev${route}`);
    if (url.origin !== "https://luminarylabs.dev") continue;
    let local = path.join(root, "..", decodeURIComponent(url.pathname));
    if (url.pathname.endsWith("/")) local = path.join(local, "index.html");
    assert.ok((await readFile(local)).length > 0, `Missing resource: ${route} -> ${resource}`);
  }
}
const theme = await read("styles.css");
assert.match(theme, /color-scheme: light/);
assert.match(theme, /\[hidden\]\s*\{\s*display: none !important/);
assert.match(theme, /:focus-visible/);
assert.match(theme, /prefers-reduced-motion/);
assert.match(await read("play/styles.css"), /#game-frame[^}]*background: #000/s);
const legacy = await readFile(path.join(root, "..", "gemini-arcade.html"), "utf8");
assert.match(legacy, /http-equiv="refresh" content="0;url=\/nexus-arcade\/"/);
assert.match(legacy, /<a href="\/nexus-arcade\/">/);
assert.match(html, /<iframe id="game-frame"[^>]*allow="autoplay; fullscreen; gamepad"[^>]*allowfullscreen><\/iframe>/);
assert.doesNotMatch(html, /<iframe[^>]*\bsandbox\b/);
assert.doesNotMatch(html, /<iframe[^>]*\bsrc=/);

const app = await read("app.mjs");
assert.match(app, /image\.loading = "lazy"/);
assert.match(app, /primary\.addEventListener\("click"/);
assert.match(app, /library\.getManifest\(game\)/);
assert.match(app, /player\.play\(manifest\)/);
assert.match(app, /new DOMException\("Install cancelled", "AbortError"\)/);
assert.match(app, /dataset\.packageRef = PACKAGE_REF/);
assert.match(app, /register\(`\/nexus-arcade\/sw\.js\?v=\$\{PACKAGE_REF\}/);
assert.match(app, /scope: "\/nexus-arcade\/"/);
assert.match(app, /nexus-arcade-catalog/);
assert.match(app, /nexus-arcade-manifests/);
assert.match(app, /installed games can still launch/);
assert.match(app, /sessionStorage\.getItem\(SESSION_STORAGE_KEY\)/);
assert.match(app, /new arcade\.BrowserInstaller\(\{ fetchImpl: browserFetch, sessionId: SESSION_ID \}\)/);
assert.match(app, /installer\.removeStaleSessions\(SESSION_ID\)/);
assert.match(app, /await unloadPlayerFrame\(\)/);
assert.match(app, /await installer\.remove\(closing\.manifest\)/);
assert.match(app, /releaseSessionMetadata\(SESSION_ID\)/);
assert.match(app, /type: "NEXUS_ARCADE_RELEASE_SESSION"/);
assert.match(app, /window\.addEventListener\("pagehide", releaseCurrentSession\)/);
assert.match(app, /Saved game data was kept/);
assert.doesNotMatch(app, /localStorage\.clear\(/);
assert.doesNotMatch(app, /indexedDB\.deleteDatabase\(/);
assert.doesNotMatch(app, /caches\.delete\(/);
assert.ok(app.indexOf("await unloadPlayerFrame()") < app.indexOf("await installer.remove(closing.manifest)"), "The iframe must unload before its asset cache is removed");

const serviceWorker = await read("sw.js");
assert.match(serviceWorker, new RegExp(PACKAGE_REF));
assert.match(serviceWorker, /scopePath: "\/nexus-arcade\/"/);

console.log("Nexus Arcade Website contract validation ok");
