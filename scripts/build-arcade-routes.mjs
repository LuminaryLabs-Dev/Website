import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LATEST_URL } from "../nexus-arcade/config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arcadeRoot = path.join(root, "arcade");
const baseHtml = await fs.readFile(path.join(arcadeRoot, "index.html"), "utf8");

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const latest = await fetchJson(LATEST_URL);
if (!/^(?:registry-v[0-9]+\.[0-9]+\.[0-9]+|[a-f0-9]{40})$/.test(latest?.ref || "")) throw new Error("Registry latest pointer is not immutable");
if (latest.indexPath !== "registry/index.json") throw new Error("Unexpected registry index path");
const indexUrl = `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Games@${latest.ref}/registry/index.json`;
const index = await fetchJson(indexUrl);
if (!Array.isArray(index.games)) throw new Error("Registry index has no games array");

function gamePage(game) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug || "")) throw new Error(`Invalid game slug: ${game.slug}`);
  const marker = "<!-- generated:arcade-game-route -->\n";
  return marker + baseHtml
    .replace("<title>Nexus Arcade Games — Luminary Labs</title>", `<title>${game.title} — Nexus Arcade — Luminary Labs</title>`)
    .replace('href="https://luminarylabs.dev/arcade/" rel="canonical"', `href="https://luminarylabs.dev/arcade/${game.slug}/" rel="canonical"`)
    .replace('<body class="ll-site arcade-player-page">', `<body class="ll-site arcade-player-page" data-game-slug="${game.slug}">`);
}

const live = new Set();
for (const game of index.games) {
  live.add(game.slug);
  const dir = path.join(arcadeRoot, game.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), gamePage(game));
}

for (const entry of await fs.readdir(arcadeRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || live.has(entry.name)) continue;
  const file = path.join(arcadeRoot, entry.name, "index.html");
  try {
    const current = await fs.readFile(file, "utf8");
    if (current.startsWith("<!-- generated:arcade-game-route -->")) await fs.rm(path.join(arcadeRoot, entry.name), { recursive: true, force: true });
  } catch {}
}

console.log(`Generated ${index.games.length} /arcade/<slug>/ routes from registry ${index.registryVersion}.`);
