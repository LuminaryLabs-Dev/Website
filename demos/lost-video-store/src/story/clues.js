export const clueConnections = [
  { requires: ['vhs'], text: 'The tape was checked in after the official closure date.' },
  { requires: ['badge'], text: 'The employee was scheduled on the same night the tape was returned.' },
  { requires: ['key'], text: 'B-17 does not appear on the surviving floor plan.' },
  { requires: ['vhs','badge'], text: 'Timeline match: return record and final shift both point to 11/03/94.' },
  { requires: ['badge','key'], text: 'Access match: the missing employee had custody of a key marked B-17.' },
  { requires: ['vhs','badge','key'], text: 'All evidence converges on Archive B-17.' }
];
