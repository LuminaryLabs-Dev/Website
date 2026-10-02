export const PACKAGE_REF = "c7d1ac67063c9950d59a09c51d1cb068c1028652";
export const PACKAGE_URL = `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/nexus-arcade.mjs`;
export const SERVICE_WORKER_PACKAGE_URL = `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/service-worker.mjs`;
export const LATEST_URL = "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Games@main/registry/latest.json";

// Set both values to roll the site back to a previously validated registry release.
export const REGISTRY_PIN = null;
export const REGISTRY_VERSION = null;

export const PAGES_ORIGIN = "https://luminarylabs-dev.github.io";
export const PAGES_GAME_PREFIX = "/NexusArcade-Games/games/";
export const PUBLIC_ARCADE_ORIGIN = "https://luminarylabs.dev";

function assertSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new TypeError("Invalid game slug");
  return slug;
}

export function publicGameUrl(slug) {
  const safe = assertSlug(slug);
  return new URL(`/arcade/${safe}/`, PUBLIC_ARCADE_ORIGIN).href;
}

export function hostedGameUrl(slug) {
  const safe = assertSlug(slug);
  const url = new URL(`${PAGES_GAME_PREFIX}${safe}/`, PAGES_ORIGIN);
  if (url.origin !== PAGES_ORIGIN || !url.pathname.startsWith(PAGES_GAME_PREFIX)) throw new TypeError("Invalid hosted game URL");
  return url.href;
}

export function trustedThumbnailUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  const allowedPath = /^\/gh\/LuminaryLabs-Dev\/NexusArcade-Games@[a-f0-9]{40}\/games\/[a-z0-9-]+\/build\/(?:cover\.(?:png|webp|jpe?g|svg))$/i;
  if (url.origin !== "https://cdn.jsdelivr.net" || !allowedPath.test(url.pathname)) throw new TypeError("Untrusted thumbnail URL");
  return url.href;
}
