export function createProgression(ids, initial = {}) {
  const state = Object.fromEntries(ids.map(id => [id, { inspected: false, collected: false, ...(initial[id] || {}) }]));
  return {
    state,
    inspect(id) { state[id].inspected = true; },
    collect(id) { if (!state[id].inspected) throw new Error('Artifact must be inspected first'); state[id].collected = true; },
    reset() { for (const id of ids) state[id] = { inspected: false, collected: false }; },
    collectedIds() { return ids.filter(id => state[id].collected); },
    isFinaleUnlocked() { return ids.every(id => state[id].collected); }
  };
}
