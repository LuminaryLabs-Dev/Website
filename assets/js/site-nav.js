(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const links = [["Home","index.html"],["Nexus Arcade","gemini-arcade.html"],["Open Source","opensource.html"],["NexusCentral","nexuscentral.html"],["Services","services.html"],["Portfolio","portfolio.html"],["Team","team.html"],["Contact","contact.html"],["GLSL Lab","glsl.html"]];
  const current = location.pathname.split("/").pop() || "index.html";
  header.innerHTML = `<div class="container nav universal-nav"><button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" class="site-nav">${links.map(([label, href]) => `<a href="${href}"${href === current ? ' class="active"' : ""}>${label}</a>`).join("")}</nav></div>`;
  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector("#site-nav");
  toggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
  document.addEventListener("click", event => { if (nav.classList.contains("open") && !nav.contains(event.target) && !toggle.contains(event.target)) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } });
})();
