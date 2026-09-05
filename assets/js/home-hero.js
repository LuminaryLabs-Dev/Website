(function () {
  const hero = document.querySelector('.hallway-hero');
  const renderer = document.getElementById('home-hallway');
  const intro = document.querySelector('luminary-intro');
  const button = hero?.querySelector('.hallway-pause');
  if (!hero || !renderer || !button) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  let userPaused = false;
  let tier = mobile.matches ? 1 : 0;
  let lastCount = 0;
  let lastSample = performance.now();
  let slowSamples = 0;
  const budgets = [921600, 480000, 260000];

  function sync() {
    const introOpen = document.documentElement.classList.contains('ll-intro-pending');
    renderer.toggleAttribute('paused', introOpen || userPaused || motion.matches);
    hero.classList.toggle('hallway-live', renderer.ready && !motion.matches);
    button.hidden = !renderer.ready || motion.matches;
    button.textContent = userPaused ? 'Play animation' : 'Pause animation';
    button.setAttribute('aria-pressed', String(userPaused));
  }
  function setQuality() {
    renderer.setAttribute('max-pixels', String(budgets[tier]));
    renderer.setUniform('uDetail', tier === 2 ? 0 : 1);
    renderer.dataset.quality = ['full', 'balanced', 'light'][tier];
  }
  button.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  renderer.addEventListener('shader-ready', () => { setQuality(); sync(); });
  renderer.addEventListener('shader-error', () => {
    hero.classList.remove('hallway-live');
    button.hidden = true;
  });
  motion.addEventListener('change', sync);
  mobile.addEventListener('change', () => {
    if (mobile.matches) tier = Math.max(1, tier);
    setQuality();
  });
  intro?.addEventListener('luminary-intro-finished', sync);
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Only step down after two sustained slow samples. Never oscillate between tiers.
  const sampler = setInterval(() => {
    const now = performance.now();
    const fps = (renderer.frameCount - lastCount) * 1000 / (now - lastSample);
    if (renderer.shouldAnimate() && document.visibilityState === 'visible') {
      renderer.dataset.measuredFps = fps.toFixed(1);
      slowSamples = fps > 0 && fps < 22 ? slowSamples + 1 : 0;
      if (slowSamples >= 2 && tier < budgets.length - 1) {
        tier += 1;
        setQuality();
        slowSamples = 0;
      }
    } else slowSamples = 0;
    lastCount = renderer.frameCount;
    lastSample = now;
  }, 4000);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { clearInterval(sampler); observer.disconnect(); }
  });
  setQuality();
  sync();
})();
