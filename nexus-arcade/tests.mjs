import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  LATEST_URL,
  PACKAGE_REF,
  PACKAGE_URL,
  SERVICE_WORKER_PACKAGE_URL,
  hostedGameUrl,
  publicGameUrl,
  trustedThumbnailUrl,
} from "./config.mjs";

const root = path.dirname(new URL(import.meta.url).pathname);
const siteRoot = path.join(root, "..");
const read = (name) => readFile(path.join(root, name), "utf8");
const files = await readdir(root);

assert.deepEqual(files.sort(), ["app.mjs", "config.mjs", "index.html", "manifest.webmanifest", "play", "styles.css", "sw.js", "tests.mjs"].sort());
assert(!files.some((name) => /\.(?:wasm|mp3|wav|ogg|webp|jpe?g|png)$/i.test(name)), "Website route must not contain game assets");

assert.match(PACKAGE_REF, /^[a-f0-9]{40}$/);
assert.equal(PACKAGE_REF, "c7d1ac67063c9950d59a09c51d1cb068c1028652");
assert.equal(PACKAGE_URL, `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/nexus-arcade.mjs`);
assert.equal(SERVICE_WORKER_PACKAGE_URL, `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/service-worker.mjs`);
assert.equal(LATEST_URL, "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Games@main/registry/latest.json");
assert.equal(hostedGameUrl("blood-maiden"), "https://luminarylabs-dev.github.io/NexusArcade-Games/games/blood-maiden/");
assert.equal(publicGameUrl("wrong-floor"), "https://luminarylabs.dev/arcade/wrong-floor/");
assert.throws(() => publicGameUrl("../private"), /Invalid game slug/);
assert.equal(trustedThumbnailUrl(`https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Games@${"a".repeat(40)}/games/bumble-beez/build/cover.png`).includes("bumble-beez"), true);
assert.throws(() => trustedThumbnailUrl("https://cdn.jsdelivr.net/gh/attacker/games@main/cover.png"), /Untrusted/);

const overview = await read("index.html");
const legacyPlay = await read("play/index.html");
const arcade = await readFile(path.join(siteRoot, "arcade", "index.html"), "utf8");
assert.match(overview, /href="https:\/\/luminarylabs\.dev\/nexus-arcade\/"/);
assert.match(overview, /href="\/arcade\/"/);
assert.doesNotMatch(overview, /<iframe|src="[^"\n]*app\.mjs/);
assert.match(legacyPlay, /href="https:\/\/luminarylabs\.dev\/nexus-arcade\/play\/"/);
assert.match(arcade, /href="https:\/\/luminarylabs\.dev\/arcade\/" rel="canonical"/);
assert.match(arcade, /src="\/nexus-arcade\/app\.mjs\?v=/);
assert.match(arcade, /<iframe id="game-frame"[^>]*allow="autoplay; fullscreen; gamepad"[^>]*allowfullscreen><\/iframe>/);
assert.doesNotMatch(arcade, /<iframe[^>]*\bsandbox\b/);
assert.doesNotMatch(arcade, /<iframe[^>]*\bsrc=/);

const manifest = JSON.parse(await readFile(path.join(siteRoot, "arcade", "manifest.webmanifest"), "utf8"));
assert.equal(manifest.id, "/arcade/");
assert.equal(manifest.start_url, "/arcade/");
assert.equal(manifest.scope, "/arcade/");

const arcadeEntries = await readdir(path.join(siteRoot, "arcade"), { withFileTypes: true });
const routeDirs = arcadeEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
assert(routeDirs.includes("wrong-floor"), "Wrong Floor public game route is missing");
for (const slug of routeDirs) {
  const page = await readFile(path.join(siteRoot, "arcade", slug, "index.html"), "utf8");
  assert.match(page, /^<!-- generated:arcade-game-route -->/);
  assert.match(page, new RegExp(`data-game-slug="${slug}"`));
  assert.match(page, new RegExp(`https://luminarylabs\\.dev/arcade/${slug}/`));
}

const app = await read("app.mjs");
assert.match(app, /PUBLIC_ARCADE_ROUTE/);
assert.match(app, /RUNTIME_SCOPE_PATH/);
assert.match(app, /requestedGameSlug/);
assert.match(app, /publicGameUrl\(game\.slug\)/);
assert.match(app, /library\.getManifest\(game\)/);
assert.match(app, /player\.play\(manifest\)/);
assert.match(app, /new arcade\.ArcadePlayer\(frame, \{ scopePath: RUNTIME_SCOPE_PATH \}\)/);
assert.match(app, /navigator\.serviceWorker\.register\(SERVICE_WORKER_PATH/);
assert.match(app, /new arcade\.BrowserInstaller\(\{ fetchImpl: browserFetch, sessionId: SESSION_ID \}\)/);
assert.match(app, /await installer\.remove\(closing\.manifest\)/);
assert.doesNotMatch(app, /localStorage\.clear\(/);

const publicSw = await readFile(path.join(siteRoot, "arcade", "sw.js"), "utf8");
assert.match(publicSw, new RegExp(PACKAGE_REF));
assert.match(publicSw, /scopePath: "\/arcade\/"/);
const legacySw = await read("sw.js");
assert.match(legacySw, new RegExp(PACKAGE_REF));
assert.match(legacySw, /scopePath: "\/nexus-arcade\/"/);

const legacy = await readFile(path.join(siteRoot, "gemini-arcade.html"), "utf8");
assert.match(legacy, /http-equiv="refresh" content="0;url=\/nexus-arcade\/"/);

console.log(`Nexus Arcade Website contract validation ok: ${routeDirs.length} public game routes`);
