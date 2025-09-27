// Featured projects slideshow for team page
(function () {
  const grid = document.getElementById("featured-slideshow");
  if (!grid || !window.PROJECTS && typeof PROJECTS === 'undefined') return;

  let idx = 0;
  const projects = PROJECTS.slice(0, 5); // Show up to 5 featured

  function renderSlide(i) {
    const p = projects[i];
    grid.innerHTML = `
      <article class="card reveal slideshow-card">
        <div class="card-media">
          <span class="badge">${p.type}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.title}</h3>
          <p class="card-sub">${p.tagline}</p>
        </div>
        <div class="card-actions">
          <a href="projects.html">Details</a>
        </div>
      </article>
    `;
    // reveal effect
    setTimeout(() => {
      const el = grid.querySelector(".reveal");
      if (el) el.classList.add("visible");
    }, 10);
  }

  function nextSlide() {
    idx = (idx + 1) % projects.length;
    renderSlide(idx);
  }

  renderSlide(idx);
  setInterval(nextSlide, 5000);
})();