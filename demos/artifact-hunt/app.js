(() => {
  const artifacts = {
    watch: {
      eyebrow: 'ARTIFACT 01',
      title: 'Broken Pocket Watch',
      body: 'The hands stopped at 11:47 PM. Turning the crown reveals a second set of scratched marks beneath the minute hand.',
      action: 'Turn the crown',
      reveal: 'The crown turns. A faint engraving appears: 317.'
    },
    photo: {
      eyebrow: 'ARTIFACT 02',
      title: 'Unmarked Photograph',
      body: 'The photograph has no date, no names, and no location. Tilting it toward the light reveals writing pressed into the paper.',
      action: 'Tilt toward the light',
      reveal: 'Under raking light: CHECK THE ROOM THAT ISN’T THERE.'
    },
    key: {
      eyebrow: 'ARTIFACT 03',
      title: 'Hotel Room Key',
      body: 'The brass tag reads 317, but the surviving floor plan jumps directly from room 316 to 318.',
      action: 'Inspect the reverse',
      reveal: 'The back of the tag is stamped: ARCHIVE B.'
    }
  };

  let stored = [];
  try { stored = JSON.parse(localStorage.getItem('artifact-hunt-found') || '[]'); } catch (_) { stored = []; }
  const state = new Set(Array.isArray(stored) ? stored.filter(id => artifacts[id]) : []);

  const dialog = document.getElementById('artifactDialog');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const finale = document.getElementById('finale');
  const finaleTitle = document.getElementById('finaleTitle');
  const finaleText = document.getElementById('finaleText');
  const discoverButton = document.getElementById('discoverButton');
  const interaction = document.getElementById('dialogInteraction');
  let activeId = null;
  let interactionComplete = false;

  function persist() {
    try { localStorage.setItem('artifact-hunt-found', JSON.stringify([...state])); } catch (_) {}
  }

  function tone(kind = 'discover') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.015);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === 'unlock' ? 0.72 : 0.34));
      master.connect(ctx.destination);
      const notes = kind === 'unlock' ? [220, 330, 495] : [330, 440];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.65 / notes.length;
        osc.connect(gain).connect(master);
        const start = ctx.currentTime + index * .09;
        osc.start(start);
        osc.stop(start + .28);
      });
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch (_) {}
  }

  function render() {
    document.querySelectorAll('[data-artifact]').forEach(node => {
      const found = state.has(node.dataset.artifact);
      node.classList.toggle('discovered', found);
      const status = node.querySelector('.status');
      if (status) status.textContent = found ? 'DISCOVERED' : 'UNDISCOVERED';
      if (node.classList.contains('display-case')) {
        node.setAttribute('aria-label', `${found ? 'Discovered. ' : ''}Inspect ${artifacts[node.dataset.artifact].title} display`);
      }
    });

    const count = state.size;
    progressText.textContent = `${count} / 3`;
    progressBar.style.width = `${(count / 3) * 100}%`;
    const unlocked = count === 3;
    finale.classList.toggle('unlocked', unlocked);
    finaleTitle.textContent = unlocked ? 'ARCHIVE UNLOCKED' : 'LOCKED';
    finaleText.textContent = unlocked
      ? 'Archive B is open. The three clues point to a room erased from the surviving floor plan.'
      : 'Discover all three artifacts to open the sealed record.';
    persist();
  }

  function openArtifact(id) {
    activeId = id;
    interactionComplete = false;
    const item = artifacts[id];
    const alreadyFound = state.has(id);

    document.getElementById('dialogEyebrow').textContent = item.eyebrow;
    document.getElementById('dialogTitle').textContent = item.title;
    document.getElementById('dialogBody').textContent = item.body;
    interaction.innerHTML = '';

    if (alreadyFound) {
      interaction.textContent = item.reveal;
      discoverButton.textContent = 'Already discovered';
      discoverButton.disabled = true;
    } else {
      const revealButton = document.createElement('button');
      revealButton.type = 'button';
      revealButton.textContent = item.action;
      revealButton.addEventListener('click', () => {
        interactionComplete = true;
        interaction.textContent = item.reveal;
        discoverButton.textContent = 'Add to collection';
        discoverButton.disabled = false;
        tone('discover');
      }, { once: true });
      interaction.appendChild(revealButton);
      discoverButton.textContent = 'Complete interaction first';
      discoverButton.disabled = true;
    }

    dialog.showModal();
  }

  document.querySelectorAll('.artifact-trigger').forEach(node => {
    node.addEventListener('click', () => openArtifact(node.dataset.artifact));
  });

  discoverButton.addEventListener('click', event => {
    if (!activeId || state.has(activeId) || !interactionComplete) return;
    event.preventDefault();
    const willUnlock = state.size === 2;
    state.add(activeId);
    render();
    dialog.close();
    tone(willUnlock ? 'unlock' : 'discover');
    if (willUnlock) finale.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('resetButton').addEventListener('click', () => {
    state.clear();
    try { localStorage.removeItem('artifact-hunt-found'); } catch (_) {}
    render();
    document.querySelector('.exhibit-room')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  render();
})();
