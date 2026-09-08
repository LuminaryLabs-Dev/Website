/* Decorative hero cover. Owns no animation loop: the renderer supplies each draw. */
(() => {
  const active = new WeakMap();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const SOURCE = '/assets/shaders/fractal-filament.glsl?v=20260908-loading-1';
  const LOAD_BUDGET = 30000; // Active visible/unpaused time; suspension is not failure.

  function attach(hero) {
    if (active.has(hero)) return active.get(hero);
    const visual = hero.closest('.presentation-visual');
    const cover = visual?.querySelector('.hero-loading-cover');
    if (!cover) return null;
    if (!root.classList.contains('hero-loading-enabled')) { cover.remove(); return null; }
    clearTimeout(window.heroLoadingSafety);
    const controller = new AbortController();
    const { signal } = controller;
    let bulb, timer, transitionTimer, observer, intersection;
    let disposed = false, revealing = false, visible = true, bulbFailed = false;
    let remaining = LOAD_BUDGET, sampledAt = performance.now(), wasActive = false;
    let target = [0, 0], current = [0, 0], lastTime = null;
    const listen = (element, event, fn, options = {}) => element.addEventListener(event, fn, { ...options, signal });
    const still = cover.querySelector('.hero-loading-still');
    const syncStill = () => {
      if (still?.complete && still.naturalWidth > 0) cover.dataset.stillReady = 'true';
      else delete cover.dataset.stillReady;
    };
    if (still) { listen(still, 'load', syncStill); listen(still, 'error', syncStill); syncStill(); }
    const introOpen = () => root.classList.contains('ll-intro-pending');
    const canAnimate = () => visible && !document.hidden && !motion.matches && !introOpen() && !hero.hasAttribute('paused');

    function cleanup() {
      if (disposed) return;
      disposed = true;
      clearInterval(timer);
      clearTimeout(transitionTimer);
      controller.abort();
      observer?.disconnect();
      intersection?.disconnect();
      bulb?.remove(); // disconnectedCallback disposes exactly once.
      cover.remove();
      active.delete(hero);
    }
    function reveal() {
      if (disposed || revealing || !hero.firstFrameRendered || !hero.ready) return;
      if (motion.matches) { cleanup(); return; }
      revealing = true;
      clearInterval(timer);
      // Do not compile a pending bulb, or spend GPU time animating it, during reveal.
      if (bulb && !bulb.firstFrameRendered) { bulb.remove(); bulb = null; }
      else bulb?.setAttribute('paused', '');
      // Establish both transition styles now; an unpainted style must not consume
      // the fallback interval and then disappear without its fade.
      getComputedStyle(cover).opacity;
      cover.dataset.state = 'revealing';
      getComputedStyle(cover).opacity;
      // A background tab can omit transitionend entirely.
      transitionTimer = setTimeout(cleanup, 320);
    }
    function updateInput(event) {
      if (event.pointerType === 'touch' || !event.isPrimary || !canAnimate()) return;
      const r = visual.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0) || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      target = [Math.max(-1, Math.min(1, 2 * (event.clientX - r.left) / r.width - 1)),
        Math.max(-1, Math.min(1, 1 - 2 * (event.clientY - r.top) / r.height))];
    }
    function moveBulb(time) {
      const dt = lastTime === null ? 0 : Math.max(0, time - lastTime);
      lastTime = time;
      const blend = 1 - Math.exp(-dt / 0.2);
      current = current.map((v, i) => v + (target[i] - v) * blend);
      // Match the cover shader camera. Intersect the view ray with z=0,
      // then normalize by the neutral-depth extents to bound physical travel.
      const fY = -0.105 / Math.hypot(0.105, 3.75), fZ = -3.75 / Math.hypot(0.105, 3.75);
      const ray = [current[0], fY * 1.86 - fZ * current[1], fZ * 1.86 + fY * current[1]];
      const distance = -3.75 / ray[2];
      const hit = [ray[0] * distance, 0.045 + ray[1] * distance + 0.06];
      const x = Math.max(-1, Math.min(1, hit[0] / (3.75 / 1.86)));
      const y = Math.max(-1, Math.min(1, hit[1] / (3.75 / 1.86)));
      bulb.setUniform('uBulbOffset', [x * 0.12, y * 0.16 + Math.sin(time * Math.PI / 3) * 0.054, 0], false);
      const tiltScale = Math.max(1, Math.hypot(x, y));
      bulb.setUniform('uBulbTilt', [-y * 0.0872665 / tiltScale, x * 0.0872665 / tiltScale], false);
    }
    function startBulb() {
      if (bulb || bulbFailed || revealing || !canAnimate()) return;
      bulb = document.createElement('shader-renderer');
      bulb.className = 'hero-loading-bulb';
      bulb.setAttribute('aria-hidden', 'true');
      bulb.setAttribute('fragment-src', SOURCE);
      bulb.setAttribute('startup-independent', '');
      bulb.setAttribute('max-fps', '24');
      bulb.setAttribute('max-pixels', '130000');
      bulb.setAttribute('pixel-ratio-cap', '1');
      bulb.setUniform('uLoadingCover', 1, false);
      bulb.beforeDraw = moveBulb;
      listen(bulb, 'shader-ready', event => {
        if (event.target === bulb && bulb.firstFrameRendered) cover.dataset.bulbReady = 'true';
      });
      listen(bulb, 'shader-error', event => {
        if (event.target !== bulb) return;
        bulbFailed = true;
        delete cover.dataset.bulbReady;
        bulb.remove();
        bulb = null;
      });
      cover.append(bulb);
    }
    function sync() {
      if (disposed) return;
      if (!hero.isConnected || !cover.isConnected || motion.matches || hero.error || hero.disposed) { cleanup(); return; }
      if (hero.firstFrameRendered && hero.ready) reveal();
      const now = performance.now();
      if (wasActive && !revealing) remaining -= now - sampledAt;
      sampledAt = now;
      wasActive = canAnimate();
      bulb?.toggleAttribute('paused', revealing || !wasActive);
      if (!wasActive) { target = [0, 0]; lastTime = null; }
      if (!revealing && remaining <= 0) {
        hero.fail(new Error('Hero initialization exceeded 30 seconds of active loading'));
        hero.dispose(); // Abort fetch/compile continuation; late success cannot reveal.
        cleanup();
        return;
      }
      startBulb();
    }
    listen(hero, 'shader-ready', event => { if (event.target === hero) reveal(); });
    listen(hero, 'shader-error', event => { if (event.target === hero) cleanup(); });
    listen(hero, 'shader-disposed', cleanup);
    listen(cover, 'transitionend', event => { if (event.target === cover && event.propertyName === 'opacity') cleanup(); });
    listen(visual, 'pointermove', updateInput, { passive: true });
    listen(visual, 'pointerleave', () => { target = [0, 0]; }, { passive: true });
    listen(visual, 'pointercancel', () => { target = [0, 0]; }, { passive: true });
    listen(document, 'visibilitychange', sync);
    listen(window, 'site-motion-change', sync);
    listen(motion, 'change', sync);
    listen(window, 'pagehide', event => { if (!event.persisted) cleanup(); });
    observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    observer.observe(hero, { attributes: true, attributeFilter: ['paused'] });
    observer.observe(document.body, { childList: true, subtree: true });
    if ('IntersectionObserver' in window) {
      intersection = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); });
      intersection.observe(visual);
    }
    const handle = { dispose: cleanup };
    active.set(hero, handle);
    timer = setInterval(sync, 250);
    sync();
    return handle;
  }
  window.HeroLoading = { attach };
})();
