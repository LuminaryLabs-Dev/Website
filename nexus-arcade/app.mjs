import {SessionStorageAdapter,sessionScope} from './session-storage.mjs?v=20261016-2';
import {
  LATEST_URL,
  PACKAGE_REF,
  PACKAGE_URL,
  REGISTRY_PIN,
  REGISTRY_VERSION,
  publicGameUrl,
  trustedThumbnailUrl,
} from "./config.mjs?v=20261002-1";

const grid = document.querySelector("#game-grid");
const status = document.querySelector("#library-status");
const count = document.querySelector("#game-count");
const playerShell = document.querySelector("#player-shell");
const playerTitle = document.querySelector("#player-title");
const frame = document.querySelector("#game-frame");
const newTabButton = document.querySelector("#new-tab-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const closePlayerButton = document.querySelector("#close-player");

const manifests = new Map();
const installs = new Map();
const CATALOG_STORAGE_KEY = "nexus-arcade-catalog";
const MANIFEST_STORAGE_KEY = "nexus-arcade-manifests";
const SESSION_STORAGE_KEY = "nexus-arcade-session";
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;
const gameViews = new Map();
const PUBLIC_ARCADE_ROUTE = location.pathname === "/arcade/" || location.pathname.startsWith("/arcade/");
const RUNTIME_SCOPE_PATH = PUBLIC_ARCADE_ROUTE ? "/arcade/" : "/nexus-arcade/";
const SERVICE_WORKER_PATH = `${RUNTIME_SCOPE_PATH}sw.js?v=20261016-2`;

function requestedGameSelector() {
  const query = new URLSearchParams(location.search).get("game");
  if (query && /^NXA-[0-9]{6}$/.test(query)) return { gameId: query, slug: null };
  if (query && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query)) return { gameId: null, slug: query };
  const match = location.pathname.match(/^\/arcade\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  const slug = match?.[1] || document.body.dataset.gameSlug || null;
  return slug ? { gameId: null, slug } : null;
}

const REQUESTED_GAME = requestedGameSelector();
let serviceWorkerReady = false;
let library;
let installer;
let player;
let activeGame = null;
let sessionReleased = false;

function currentSessionId() {
  let existing = null;
  try { existing = sessionStorage.getItem(SESSION_STORAGE_KEY); }
  catch { /* A valid in-memory session still permits temporary installs. */ }
  if (SESSION_ID_PATTERN.test(existing || "")) return existing;
  const created = crypto.randomUUID();
  try { sessionStorage.setItem(SESSION_STORAGE_KEY, created); }
  catch { /* Startup reconciliation still removes abandoned caches. */ }
  return created;
}

const SESSION_ID = currentSessionId();

function setStatus(message, state = "ready") {
  status.textContent = message;
  status.dataset.state = state;
}

function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
  catch { return fallback; }
}

function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Storage is optional; verified runtime caches remain authoritative. */ }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { type: "module", scope: RUNTIME_SCOPE_PATH });
  const expected = new URL(SERVICE_WORKER_PATH, location.href).href;
  if (navigator.serviceWorker.controller?.scriptURL !== expected) {
    await new Promise((resolve, reject) => {
      const check = () => { if (navigator.serviceWorker.controller?.scriptURL === expected) { cleanup(); resolve(); } };
      const cleanup = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', check); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('The game service is updating. Refresh and try again.')); }, 15000);
      navigator.serviceWorker.addEventListener('controllerchange', check);
      check();
    });
  }
  return true;
}

async function manifestFor(game) {
  if (!manifests.has(game.id)) {
    manifests.set(game.id, library.getManifest(game).then((manifest) => {
      const stored = readStored(MANIFEST_STORAGE_KEY, {});
      stored[game.id] = manifest;
      writeStored(MANIFEST_STORAGE_KEY, stored);
      return manifest;
    }).catch((error) => {
      const cached = readStored(MANIFEST_STORAGE_KEY, {})[game.id];
      if (cached?.id === game.id && cached.version === game.version && cached.slug === game.slug) return cached;
      manifests.delete(game.id);
      throw error;
    }));
  }
  return manifests.get(game.id);
}

function textElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function installedVersion(game) {
  return installer.storage.listInstalled()[game.id]?.version === game.version;
}

function syncPrimaryAction(game) {
  const view = gameViews.get(game.id);
  if (!view) return;
  const installed = installedVersion(game);
  view.primary.className = installed ? "play-button" : "install-button";
  view.primary.textContent = installed ? "Play" : "Install";
  view.primary.setAttribute("aria-label", `${view.primary.textContent} ${game.title}`);
  view.progressWrap.hidden = true;
  if (!installed) {
    view.progress.value = 0;
    view.progressText.textContent = "0%";
  }
}

function openPlayer(game, manifest) {
  if (!serviceWorkerReady) throw new Error("The local game service is not ready. Refresh and try again.");
  playerTitle.textContent = game.title;
  const launchPath = player.play(manifest);
  newTabButton.href = launchPath;
  playerShell.hidden = false;
  document.body.style.overflow = "hidden";
  activeGame = { game, manifest };
  closePlayerButton.focus();
}

function renderGame(game) {
  const article = document.createElement("article");
  article.className = "game-card";
  article.dataset.gameId = game.id;

  const cover = document.createElement("div");
  cover.className = "cover";
  let thumbnail = null;
  try { thumbnail = trustedThumbnailUrl(game.thumbnail); } catch { thumbnail = null; }
  if (thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail;
    image.alt = `${game.title} cover art`;
    image.loading = "lazy";
    image.decoding = "async";
    cover.append(image);
  } else {
    cover.append(textElement("span", "cover-fallback", game.id.slice(-2)));
  }
  cover.append(textElement("span", "game-id", game.id));

  const body = document.createElement("div");
  body.className = "game-body";
  body.append(textElement("span", "game-meta", `${game.genre} · v${game.version}`));
  body.append(textElement("h3", "", game.title));
  body.append(textElement("p", "", game.description || "Public Nexus Arcade prototype."));
  body.append(textElement("div", "controls", game.controls?.length ? game.controls.join(" · ") : "See game for controls"));

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const primary = document.createElement("button");
  primary.type = "button";
  primary.className = installedVersion(game) ? "play-button" : "install-button";
  primary.textContent = installedVersion(game) ? "Play" : "Install";
  primary.setAttribute("aria-label", `${primary.textContent} ${game.title}`);
  const hosted = document.createElement("a");
  hosted.className = "hosted-link";
  hosted.href = REQUESTED_GAME ? "/arcade/" : publicGameUrl(game.slug);
  if (REQUESTED_GAME) {
    hosted.textContent = "All games →";
    hosted.setAttribute("aria-label", "Browse all Nexus Arcade games");
  } else {
    hosted.textContent = "Game page →";
    hosted.setAttribute("aria-label", `Open ${game.title} game page`);
  }
  actions.append(primary, hosted);

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";
  progressWrap.hidden = true;
  const progress = document.createElement("progress");
  progress.max = 100;
  progress.value = 0;
  const progressText = textElement("span", "", "0%");
  progressWrap.append(progress, progressText);
  actions.append(progressWrap);
  body.append(actions);
  article.append(cover, body);
  gameViews.set(game.id, { primary, progressWrap, progress, progressText });

  primary.addEventListener("click", async () => {
    const active = installs.get(game.id);
    if (active) {
      active.abort(new DOMException("Install cancelled", "AbortError"));
      return;
    }
    if (installs.size) { setStatus("Another game is installing. Wait for it to finish or cancel it first."); return; }
    primary.disabled = true;
    const pending = new AbortController();
    installs.set(game.id, pending);
    try {
      const manifest = await manifestFor(game);
      if (installedVersion(game)) {
        openPlayer(game, manifest);
        return;
      }
      const controller = pending;
      installs.set(game.id, controller);
      primary.disabled = false;
      primary.textContent = "Cancel";
      progressWrap.hidden = false;
      setStatus(`Installing ${game.title}… files are verified before activation.`);
      await installer.install(manifest, (update) => {
        progress.value = update.percent;
        progressText.textContent = `${update.percent.toFixed(0)}%`;
        setStatus(`Installing ${game.title}: ${update.completedFiles}/${update.totalFiles} files · ${update.percent.toFixed(0)}%`);
      }, { signal: controller.signal });
      syncPrimaryAction(game);
      setStatus(`${game.title} ${game.version} is verified and ready. Press Play to launch.`);
    } catch (error) {
      console.error("[nexus-arcade] install failed", error);
      status.title = error.stack || error.message;
      progressWrap.hidden = true;
      syncPrimaryAction(game);
      setStatus(error.name === "AbortError" ? `${game.title} installation cancelled. No partial version was activated.` : `${game.title} was not installed: ${error.message}`, error.name === "AbortError" ? "ready" : "error");
    } finally {
      installs.delete(game.id);
      primary.disabled = false;
    }
  });
  return article;
}

async function initialize() {
  try {
    serviceWorkerReady = await registerServiceWorker();
    const arcade = await import(PACKAGE_URL);
    document.documentElement.dataset.packageRef = PACKAGE_REF;
    const browserFetch = (input, init) => globalThis.fetch(input, init);
    library = new arcade.ArcadeLibrary({
      latestUrl: LATEST_URL,
      registryRef: REGISTRY_PIN,
      registryVersion: REGISTRY_VERSION,
      fetchImpl: browserFetch,
    });
    installer = new arcade.BrowserInstaller({
      fetchImpl: browserFetch,
      sessionId: SESSION_ID,
      storage: new SessionStorageAdapter({ sessionId: SESSION_ID, scopePath: RUNTIME_SCOPE_PATH }),
    });
    await installer.storage.reconcile();
    player = new arcade.ArcadePlayer(frame, { scopePath: sessionScope(RUNTIME_SCOPE_PATH, SESSION_ID) });
    let games;
    let catalogFromCache = false;
    let catalogVersion = REGISTRY_VERSION || "cached";
    try {
      games = await library.load();
      catalogVersion = library.catalogClient.latest.registryVersion;
      writeStored(CATALOG_STORAGE_KEY, { registryVersion: catalogVersion, games });
    } catch (error) {
      const cached = readStored(CATALOG_STORAGE_KEY, null);
      if (!cached?.games?.length) throw error;
      games = cached.games;
      library.games = games;
      catalogFromCache = true;
      catalogVersion = cached.registryVersion || "cached";
      setStatus(`${games.length} cached games available. Registry is offline; previously verified files may be available. Some games need a connection.`);
    }
    const visibleGames = REQUESTED_GAME
      ? games.filter((game) => REQUESTED_GAME.gameId ? game.id === REQUESTED_GAME.gameId : game.slug === REQUESTED_GAME.slug)
      : games;
    if (REQUESTED_GAME && !visibleGames.length) {
      const requested = REQUESTED_GAME.gameId || REQUESTED_GAME.slug;
      count.textContent = "0";
      setStatus(`Game "${requested}" is not in the public NexusArcade registry.`, "error");
      grid.replaceChildren(textElement("p", "", "This game is not currently available."));
      return;
    }
    count.textContent = String(visibleGames.length);
    grid.replaceChildren(...visibleGames.map(renderGame));
    if (REQUESTED_GAME) {
      const game = visibleGames[0];
      document.title = `${game.title} — Nexus Arcade — Luminary Labs`;
      document.querySelector("#page-title")?.replaceChildren(document.createTextNode(game.title));
      document.querySelector("#library-title")?.replaceChildren(document.createTextNode("Install and play"));
      if (!catalogFromCache) setStatus(`${game.title} v${game.version} loaded from registry ${catalogVersion}. Nothing downloads until you choose Install.`);
    } else if (!catalogFromCache) {
      setStatus(`${games.length} games loaded from registry ${library.catalogClient.latest.registryVersion}. Nothing downloads until you choose Install.`);
    }
  } catch (error) {
    console.error("[nexus-arcade] initialization failed", error);
    setStatus(`The public registry could not load: ${error.message}`, "error");
    grid.replaceChildren(textElement("p", "", "Refresh when the registry connection is restored to install and play."));
  }
}

fullscreenButton.addEventListener("click", () => frame.requestFullscreen?.());
async function unloadPlayerFrame() {
  if (!frame.getAttribute("src") || frame.getAttribute("src") === "about:blank") return;
  const unloaded = new Promise((resolve) => {
    const timer = setTimeout(resolve, 1500);
    frame.addEventListener("load", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
  frame.src = "about:blank";
  await unloaded;
}

async function closePlayer() {
  const closing = activeGame;
  playerShell.hidden = true;
  document.body.style.overflow = "";
  await unloadPlayerFrame();
  activeGame = null;
  if (!closing) return;
  // Keep this session alive for a game opened in another tab. Reclaimed on exit
  // only when the service worker can establish there are no remaining clients.
  syncPrimaryAction(closing.game);
  setStatus(`${closing.game.title} closed. Verified files remain for this tab; saved game data was kept.`);
}

closePlayerButton.addEventListener("click", () => {
  closePlayer().catch((error) => {
    console.error("[nexus-arcade] cleanup failed", error);
    setStatus(`The player closed, but temporary files could not be removed: ${error.message}`, "error");
  });
});

function releaseCurrentSession() {
  if (sessionReleased || !installer) return;
  sessionReleased = true;
  for (const controller of installs.values()) controller.abort(new DOMException("Arcade session ended", "AbortError"));
  frame.src = "about:blank";
  const games = installer.storage.releaseSessionMetadata(SESSION_ID);
  navigator.serviceWorker.controller?.postMessage({
    type: "NEXUS_ARCADE_COLLECT_UNUSED_SESSIONS",
    departing: true,
    sessionId: SESSION_ID,
    games,
  });
}

window.addEventListener("pagehide", releaseCurrentSession);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});

initialize();

