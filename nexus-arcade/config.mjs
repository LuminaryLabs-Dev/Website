export const PACKAGE_REF = "3310f5d7c2a65d11e40a0bca3df07a4646e402a6";
export const PACKAGE_URL = `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/nexus-arcade.mjs`;
export const SERVICE_WORKER_PACKAGE_URL = `https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@${PACKAGE_REF}/dist/browser/service-worker.mjs`;
export const LATEST_URL = "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade-Prototypes@main/registry/latest.json";

// Set both values to roll the site back to a previously validated registry release.
export const REGISTRY_PIN = null;
export const REGISTRY_VERSION = null;

export const PAGES_ORIGIN = "https://luminarylabs-dev.github.io";
export const PAGES_GAME_PREFIX = "/NexusArcade-Prototypes/games/";

export function hostedGameUrl(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new TypeError("Invalid game slug");
  const url = new URL(`${PAGES_GAME_PREFIX}${slug}/`, PAGES_ORIGIN);
  if (url.origin !== PAGES_ORIGIN || !url.pathname.startsWith(PAGES_GAME_PREFIX)) throw new TypeError("Invalid hosted game URL");
  return url.href;
}

export function trustedThumbnailUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  const allowedPath = /^\/gh\/LuminaryLabs-Dev\/NexusArcade-Prototypes@[a-f0-9]{40}\/prototypes\/[a-z0-9-]+\/(?:cover\.(?:png|webp|jpe?g))$/i;
  if (url.origin !== "https://cdn.jsdelivr.net" || !allowedPath.test(url.pathname)) throw new TypeError("Untrusted thumbnail URL");
  return url.href;
}
