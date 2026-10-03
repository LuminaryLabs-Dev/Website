import { defineArtifact } from './Artifact.js';
export const badge = defineArtifact({
  id: 'badge', name: 'Employee Badge', subtitle: 'Final shift · 11/03/94',
  description: 'The laminate is clouded with grime. A handwritten correction covers the printed schedule on the reverse.',
  interaction: 'reveal', actionLabel: 'Clear the badge',
  clue: 'FINAL SHIFT: 11/03/94 — Employee 06 never clocked out.',
  storyBeat: 'Someone was working after closure.', visual: 'badge'
});
