/* Progressive entrance: complete semantic content exists before this enhancement. */
(() => {
  const hero = document.querySelector('[data-page-entry]');
  if (!hero) return;
  const heading = hero.querySelector('h1');
  const original = heading.textContent;
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let started = false;
  let finished = false;
  let safetyTimer;
  let observer;
  function finish() {
    if (finished) return;
    finished = true;
    animations.forEach(animation => animation.cancel());
    animations.clear();
    heading.textContent = original;
    heading.removeAttribute('aria-label');
    hero.dataset.entryState = 'complete';
    document.documentElement.classList.remove('entry-armed');
    clearTimeout(window.pageEntrySafety);
    clearTimeout(safetyTimer);
    observer?.disconnect();
    window.dispatchEvent(new Event('presentation-entry-finished'));
  }
  window.PageEntry = { finish };
  function animate(element, frames, options) {
    const animation = element.animate(frames, {fill:'both', ...options});
    animations.add(animation);
    return animation;
  }
  async function start() {
    if (started || finished || document.documentElement.classList.contains('ll-intro-pending')) return;
    started = true;
    if (query.matches || document.hidden || scrollY > 80 || !hero.animate) { finish(); return; }
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 800))]);
    if (finished) return;
    if (!document.fonts.check('600 32px "Luminary Display"')) { finish(); return; }
    try {
      const characters = Array.from(original);
      const interval = Math.min(18, 1100 / Math.max(1, characters.length));
      heading.setAttribute('aria-label', original);
      const fragment = document.createDocumentFragment();
      let offset = 0;
      // Words retain normal wrapping while each character occupies its final width.
      for (const word of original.split(/(\s+)/)) {
        if (/^\s+$/.test(word)) { fragment.append(document.createTextNode(word)); offset += word.length; continue; }
        const wrapper = document.createElement('span');
        wrapper.className = 'entry-word';
        wrapper.setAttribute('aria-hidden', 'true');
        for (const char of Array.from(word)) {
          const glyph = document.createElement('span');
          glyph.textContent = char;
          wrapper.append(glyph);
          animate(glyph, [{opacity:0},{opacity:1}], {delay:800 + offset * interval, duration:1});
          offset++;
        }
        fragment.append(wrapper);
      }
      heading.replaceChildren(fragment);
      animate(hero.querySelector('.presentation-panel'), [{transform:'scaleY(0)'},{transform:'scaleY(1)'}], {duration:650,easing:'cubic-bezier(.22,.7,.2,1)'});
      animate(hero.querySelector('.eyebrow'), [{opacity:0},{opacity:1}], {delay:650,duration:150});
      const end = 800 + characters.length * interval;
      animate(hero.querySelector('.presentation-subtitle'), [{opacity:0},{opacity:1}], {delay:end,duration:200});
      document.documentElement.classList.remove('entry-armed');
      clearTimeout(window.pageEntrySafety);
      hero.dataset.entryState = 'playing';
      safetyTimer = setTimeout(finish, end + 230);
    } catch { finish(); }
  }
  hero.addEventListener('focusin', finish);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || (event.key === 'Escape' && !document.documentElement.classList.contains('ll-intro-pending'))) finish();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  query.addEventListener('change', () => { if (query.matches) finish(); });
  window.addEventListener('resize', () => { if (started) finish(); });
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  document.querySelector('luminary-intro')?.addEventListener('luminary-intro-finished', start);
  observer = new MutationObserver(start);
  observer.observe(document.documentElement, {attributes:true,attributeFilter:['class']});
  start();
})();
