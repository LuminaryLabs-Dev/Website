/* Static markup comes from scripts/build-site-shell.mjs. */
(() => {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.nav-toggle');
  const nav = header?.querySelector('#site-nav');
  if (!toggle || !nav) return;

  // Move only secondary links into a compact, independent right-side rail.
  // Keep the source anchors (including active-page state) and hrefs intact.
  const extras = [
    ['/nexus-engine-studio/', 'Nexus Engine Studio', '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7m-3.5-3.5v7"/>'],
    ['/opensource.html', 'Open Source', '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 18"/>'],
    ['/assets/', 'Assets', '<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10"/>'],
    ['/articles/', 'Articles', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M9 7h7m-7 4h7"/>'],
    ['/nexus-arcade/', 'Nexus Arcade', '<rect x="3" y="8" width="18" height="11" rx="5"/><path d="M8 11v5m-2.5-2.5h5M15.5 12.5h.01M18 15h.01"/>']
  ];
  const arcadeLink = Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') === '/nexus-arcade/');
  const teamLink = Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') === '/team.html');
  if (arcadeLink && teamLink) nav.insertBefore(teamLink, arcadeLink);
  extras.push(['/apex', 'APEX Benchworks', '<path d="m3 18 9-13 9 13M8 15h8"/>']);
  const links = extras.map(([href]) => {
    if (href !== '/apex') return Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') === href);
    const link = document.createElement('a');
    link.setAttribute('href', href);
    if (/^\/(?:apex|services\/apex-benchworks)(?:\/index\.html|\/)?$/.test(location.pathname)) {
      link.setAttribute('aria-current', 'page');
    }
    return link;
  });
  if (links.every(Boolean) && !document.querySelector('.extras-rail')) {
    const rail = document.createElement('aside');
    rail.className = 'extras-rail';
    rail.setAttribute('aria-label', 'Additional navigation');
    const railToggle = document.createElement('button');
    railToggle.type = 'button';
    railToggle.className = 'extras-rail-toggle';
    railToggle.textContent = 'Extras';
    railToggle.setAttribute('aria-expanded', 'false');
    railToggle.setAttribute('aria-controls', 'extras-nav');
    const extraNav = document.createElement('nav');
    extraNav.id = 'extras-nav';
    extraNav.className = 'extras-rail-links';
    extraNav.setAttribute('aria-label', 'Extra pages');
    links.forEach((link, i) => {
      const [, label, paths] = extras[i];
      link.textContent = '';
      link.classList.add('extras-rail-link');
      link.dataset.label = label;
      link.setAttribute('aria-label', label);
      link.setAttribute('title', label);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '1.7');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = paths;
      link.append(icon);
      extraNav.append(link);
    });
    rail.append(railToggle, extraNav);
    document.body.append(rail);
    const closeExtras = () => {
      rail.classList.remove('is-open');
      railToggle.setAttribute('aria-expanded', 'false');
    };
    railToggle.addEventListener('click', () => {
      const open = rail.classList.toggle('is-open');
      railToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('pointerdown', event => {
      if (!rail.contains(event.target)) closeExtras();
    });
    rail.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeExtras(); railToggle.focus(); }
    });
    matchMedia('(min-width: 761px)').addEventListener('change', closeExtras);
  }

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
  matchMedia('(max-width: 960px)').addEventListener('change', () => close());
})();
