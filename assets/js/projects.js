// Render all projects with filters
(function () {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  const render = (filter = "all") => {
    grid.innerHTML = "";
    const list = PROJECTS.filter((p) =>
      filter === "all" ? true : p.type === filter
    );
    for (const p of list) {
      const card = document.createElement("article");
      card.className = "card reveal";
      let imgHtml = "";
      if (p.slides && p.slides.length > 0) {
        // Remove 'public/' prefix for web path
        const imgSrc = p.slides[0].replace(/^public\//, "");
        imgHtml = `<img src="${imgSrc}" alt="${p.title} preview" class="card-thumb" style="width:100%;max-height:140px;object-fit:cover;border-radius:10px 10px 0 0;" />`;
      }
      card.innerHTML = `
        <div class="card-media">
          ${imgHtml}
          <span class="badge">${p.type}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.title}</h3>
          <p class="card-sub">${p.tagline}</p>
        </div>
        <div class="card-actions">
          <a href="${p.url}">View</a>
        </div>`;
      grid.appendChild(card);
    }
    // re-apply reveal
    setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (!el.classList.contains("visible")) el.classList.add("visible");
      });
    }, 0);
  };

  // filter chips
  const chips = document.querySelectorAll(".filters .chip");
  chips.forEach((ch) =>
    ch.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      });
      ch.classList.add("active");
      ch.setAttribute("aria-selected", "true");
      render(ch.dataset.filter);
    })
  );

  render("all");
})();
