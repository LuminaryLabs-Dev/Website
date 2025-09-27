// Dual project slideshows for homepage: Duke's Adventure and Wind Rider
(function () {
  const projects = window.PROJECTS || [];
  const container = document.getElementById("featured-slideshow");
  if (!container || projects.length < 2) return;

  let projectIdx = 0;
  let slideIdx = 0;

  function renderSlideshow() {
    const project = projects[projectIdx];
    const slides = project.slides;
    const imgSrc = slides[slideIdx];
    container.innerHTML = `
      <div class="slideshow-wrapper">
        <div class="slideshow-header">
          <h3>${project.title}</h3>
          <p>${project.tagline}</p>
        </div>
        <div class="slideshow-image-area">
          <button class="slide-arrow prev" aria-label="Previous slide">&#8592;</button>
          <img src="${imgSrc}" alt="${project.title} photo ${slideIdx + 1}" class="slideshow-img" />
          <button class="slide-arrow next" aria-label="Next slide">&#8594;</button>
        </div>
        <div class="slideshow-controls">
          <button class="project-arrow prev" aria-label="Previous project">Prev Project</button>
          <span class="slide-indicator">Slide ${slideIdx + 1} of ${slides.length}</span>
          <button class="project-arrow next" aria-label="Next project">Next Project</button>
        </div>
      </div>
    `;
    // Add event listeners
    container.querySelector(".slide-arrow.prev").onclick = () => {
      slideIdx = (slideIdx - 1 + slides.length) % slides.length;
      renderSlideshow();
    };
    container.querySelector(".slide-arrow.next").onclick = () => {
      slideIdx = (slideIdx + 1) % slides.length;
      renderSlideshow();
    };
    container.querySelector(".project-arrow.prev").onclick = () => {
      projectIdx = (projectIdx - 1 + projects.length) % projects.length;
      slideIdx = 0;
      renderSlideshow();
    };
    container.querySelector(".project-arrow.next").onclick = () => {
      projectIdx = (projectIdx + 1) % projects.length;
      slideIdx = 0;
      renderSlideshow();
    };
  }

  renderSlideshow();
})();
