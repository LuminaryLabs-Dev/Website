/* Static markup comes from scripts/build-site-shell.mjs. */
(() => {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.nav-toggle');
  const nav = header?.querySelector('#site-nav');
  if (!toggle || !nav) return;
  document.body.classList.add('nav-enhanced');
  toggle.hidden = false;
  function close(restoreFocus = false) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) close(); });
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { event.preventDefault(); close(true); }
  });
  header.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!header.contains(document.activeElement)) close();
  }));
  matchMedia('(max-width: 760px)').addEventListener('change', () => close());
})();
