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

  header.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();
