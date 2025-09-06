// Render team cards with simple hover effect
(function () {
  const grid = document.getElementById("team-grid");
  if (!grid) return;

  for (const m of TEAM) {
    const el = document.createElement("article");
    el.className = "team-card reveal";
    el.innerHTML = `
      <div class="team-avatar" aria-hidden="true">${m.emoji}</div>
      <div class="team-body">
        <h3 class="card-title">${m.name}</h3>
        <p class="team-role">${m.role}</p>
      </div>`;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientX - r.left) / r.width - 0.5) * 6;
      const ry = ((e.clientY - r.top) / r.height - 0.5) * -6;
      el.style.transform = `perspective(600px) rotateX(${ry}deg) rotateY(${rx}deg)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
    grid.appendChild(el);
  }
})();
