import { artifacts } from '../artifacts/index.js';
import { clueConnections } from '../story/clues.js';
export function renderCaseFile(list, connections, progression){
  list.innerHTML = Object.values(artifacts).map(a => {
    const s = progression.state[a.id];
    return `<article class="evidence-row ${s.collected?'found':''}"><span class="evidence-mark">${s.collected?'✓':'?'}</span><div><strong>${a.name}</strong><small>${s.collected?a.clue:'Evidence not recovered'}</small></div></article>`;
  }).join('');
  const found = new Set(progression.collectedIds());
  const visible = clueConnections.filter(c => c.requires.every(id => found.has(id)));
  connections.innerHTML = visible.length ? `<h3>Connections</h3>${visible.map(c=>`<p>${c.text}</p>`).join('')}` : '<p class="muted">Recover evidence to expose connections.</p>';
}
