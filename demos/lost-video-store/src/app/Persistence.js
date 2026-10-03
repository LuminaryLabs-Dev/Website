const KEY = 'lost-video-store-v1';
export function loadProgress(storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem(KEY) || '{}'); } catch { return {}; }
}
export function saveProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(progress)); } catch {}
}
export function clearProgress(storage = globalThis.localStorage) {
  try { storage.removeItem(KEY); } catch {}
}
export { KEY as STORAGE_KEY };
