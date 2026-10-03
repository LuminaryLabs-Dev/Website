export function syncHotspots(root, progression){ root.querySelectorAll('[data-artifact]').forEach(node => node.classList.toggle('found', progression.state[node.dataset.artifact].collected)); }
