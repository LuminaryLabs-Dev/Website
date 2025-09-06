// Populate featured projects on the homepage (top 3)
(function () {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  const featured = PROJECTS.slice(0, 3);
  for (const p of featured) {
    const card = document.createElement("article");
    card.className = "card reveal";
    card.innerHTML = `
      <div class="card-media">
        <span class="badge">${p.type}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-sub">${p.tagline}</p>
      </div>
      <div class="card-actions">
        <a href="projects.html">Details</a>
      </div>`;
    grid.appendChild(card);
  }
})();
