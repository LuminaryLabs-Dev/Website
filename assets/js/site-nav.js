(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const links = [["Home","/index.html"],["Nexus Arcade","/nexus-arcade/"],["Open Source","/opensource.html"],["Services","/services.html"],["Portfolio","/portfolio.html"],["Team","/team.html"],["Contact","/contact.html"]];
  const current = location.pathname === "/" ? "/index.html" : location.pathname;
  const isActive = href => href === "/nexus-arcade/" ? current.startsWith(href) : href === current;
  const isHome = document.body.classList.contains("home-page");
  const signature = isHome
    ? '<img src="/public/brand/luminary-bulb-transparent.png" width="36" height="36" alt="" />'
    : '<span>LL</span><i aria-hidden="true"></i>';
  header.innerHTML = `<div class="container nav universal-nav"><button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" class="site-nav">${links.map(([label, href]) => `<a href="${href}"${isActive(href) ? ' class="active" aria-current="page"' : ""}>${label}</a>`).join("")}</nav><a class="universal-signature" href="/index.html" aria-label="Luminary Labs home">${signature}</a></div>`;
  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector("#site-nav");
  toggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
  document.addEventListener("click", event => { if (nav.classList.contains("open") && !nav.contains(event.target) && !toggle.contains(event.target)) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } });
  if (!isHome) return;

  // Keep a stable hover region while the row recedes inside it.
  const hero = document.getElementById("hero");
  let idleTimer;
  let hovering = false;
  const engaged = () => hovering || header.contains(document.activeElement) || nav.classList.contains("open") || document.documentElement.classList.contains("ll-intro-pending");
  const wake = () => {
    clearTimeout(idleTimer);
    header.classList.remove("header-idle");
    header.classList.toggle("header-menu-open", nav.classList.contains("open"));
    if (!engaged()) idleTimer = setTimeout(() => {
      if (!engaged()) header.classList.add("header-idle");
    }, 4000);
  };
  header.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") { hovering = true; wake(); } });
  header.addEventListener("pointerleave", () => { hovering = false; wake(); });
  header.addEventListener("focusin", wake);
  header.addEventListener("focusout", () => queueMicrotask(wake));
  new MutationObserver(wake).observe(nav, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(wake).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  header.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
  let scrollFrame = 0;
  const updateSurface = () => {
    scrollFrame = 0;
    header.classList.toggle("header-over-light", !!hero && hero.getBoundingClientRect().bottom < 64);
  };
  const scheduleSurface = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateSurface); };
  window.addEventListener("scroll", scheduleSurface, { passive: true });
  window.addEventListener("resize", scheduleSurface, { passive: true });
  window.addEventListener("pageshow", () => { updateSurface(); wake(); });
  updateSurface();
  wake();
})();
