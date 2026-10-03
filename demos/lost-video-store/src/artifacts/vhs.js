import { defineArtifact } from './Artifact.js';
export const vhs = defineArtifact({
  id: 'vhs', name: 'Returned VHS Tape', subtitle: 'Return sticker · 11/03/94',
  description: 'A blank rental cassette sits behind the counter. Its plastic shell is ordinary. The return sticker is not.',
  interaction: 'rotate', actionLabel: 'Rotate the cassette',
  clue: 'RETURNED 11/03/94 — three days after the store officially closed.',
  storyBeat: 'The timeline is wrong.', visual: 'vhs'
});
