import {
  LATEST_URL,
  PACKAGE_REF,
  PACKAGE_URL,
  REGISTRY_PIN,
  REGISTRY_VERSION,
  hostedGameUrl,
  trustedThumbnailUrl,
} from "./config.mjs?v=20260904-3";

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
let serviceWorkerReady = false;
let library;
let installer;
let player;

function setStatus(message, state = "ready") {
  status.textContent = message;
  status.dataset.state = state;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.register(`./sw.js?v=${PACKAGE_REF}`, { type: "module", scope: "/nexus-arcade/" });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await Promise.race([
      new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }
  return Boolean(registration.active || registration.waiting || registration.installing);
}

async function manifestFor(game) {
  if (!manifests.has(game.id)) manifests.set(game.id, library.getManifest(game));
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

function openPlayer(game, manifest) {
  if (!serviceWorkerReady) throw new Error("The local game service is not ready. Refresh and try again.");
  playerTitle.textContent = game.title;
  const launchPath = player.play(manifest);
  newTabButton.href = launchPath;
  playerShell.hidden = false;
  document.body.style.overflow = "hidden";
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
  hosted.href = hostedGameUrl(game.slug);
  hosted.target = "_blank";
  hosted.rel = "noopener noreferrer";
  hosted.textContent = "Open ↗";
  hosted.setAttribute("aria-label", `Open hosted ${game.title} in a new tab`);
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

  primary.addEventListener("click", async () => {
    const active = installs.get(game.id);
    if (active) {
      active.abort(new DOMException("Install cancelled", "AbortError"));
      return;
    }
    primary.disabled = true;
    try {
      const manifest = await manifestFor(game);
      if (installedVersion(game)) {
        openPlayer(game, manifest);
        return;
      }
      const controller = new AbortController();
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
      primary.className = "play-button";
      primary.textContent = "Play";
      primary.setAttribute("aria-label", `Play ${game.title}`);
      progressWrap.hidden = true;
      setStatus(`${game.title} ${game.version} is verified and ready. Press Play to launch.`);
    } catch (error) {
      console.error("[nexus-arcade] install failed", error);
      status.title = error.stack || error.message;
      progressWrap.hidden = true;
      primary.textContent = installedVersion(game) ? "Play" : "Install";
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
    installer = new arcade.BrowserInstaller({ fetchImpl: browserFetch });
    player = new arcade.ArcadePlayer(frame);
    const games = await library.load();
    count.textContent = String(games.length);
    grid.replaceChildren(...games.map(renderGame));
    setStatus(`${games.length} games loaded from registry ${library.catalogClient.latest.registryVersion}. Nothing downloads until you choose Install.`);
  } catch (error) {
    console.error("[nexus-arcade] initialization failed", error);
    setStatus(`The public registry could not load: ${error.message}`, "error");
    grid.replaceChildren(textElement("p", "", "Use a game's hosted link after the registry connection is restored."));
  }
}

fullscreenButton.addEventListener("click", () => frame.requestFullscreen?.());
closePlayerButton.addEventListener("click", () => {
  playerShell.hidden = true;
  frame.src = "about:blank";
  document.body.style.overflow = "";
});

initialize();
