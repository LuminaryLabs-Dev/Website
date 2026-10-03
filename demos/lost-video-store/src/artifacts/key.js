import { defineArtifact } from './Artifact.js';
export const key = defineArtifact({
  id: 'key', name: 'Storage Key', subtitle: 'Stamped · B-17',
  description: 'A brass key was taped beneath the register drawer. The front tag is blank; the reverse has a stamped room code.',
  interaction: 'flip', actionLabel: 'Flip the key tag',
  clue: 'B-17 — no room with that number appears on the surviving floor plan.',
  storyBeat: 'The evidence points somewhere hidden.', visual: 'key'
});
