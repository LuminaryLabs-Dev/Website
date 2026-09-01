(function () {
  const section = document.querySelector(".fractal-home");
  const renderer = section?.querySelector("shader-renderer");
  if (!section || !renderer || !document.body.classList.contains("home-fractal-mode")) return;

  const guide = section.querySelector(".fractal-guide");
  const guideParticles = section.querySelector(".guide-particles");
  const bulbParticles = section.querySelector(".bulb-particles");
  const core = section.querySelector(".fractal-core");
  const mission = section.querySelector(".fractal-mission");
  const charge = [0, 0, 0];
  let activated = false;

  function syncUniforms() {
    renderer.setUniform?.("uPower", activated
      ? 1
      : Math.min(1, charge.reduce((sum, value) => sum + value, 0) / 2.4));
    charge.forEach((value, index) => {
      renderer.setUniform?.(`uStar${String.fromCharCode(65 + index)}`, value);
    });
  }

  function revealMission() {
    mission.classList.add("revealed");
    bulbParticles.classList.remove("active");
    guide.textContent = "Ideas made visible";
  }

  function activateCore() {
    activated = true;
    guideParticles.classList.add("complete");
    bulbParticles.classList.add("active");
    core.classList.add("active");
    guide.textContent = "Activate the light";
    syncUniforms();
  }

  function activateFallback(error) {
    section.classList.add("fractal-fallback");
    activateCore();
    guide.textContent = "Explore Luminary Labs";
    if (error) console.error("Fractal Filament fallback:", error);
  }

  function starPositions() {
    const rect = renderer.getBoundingClientRect();
    const horizontal = Math.min(0.76, Math.max(0.18, (rect.width / Math.max(rect.height, 1)) * 0.34));
    return [[-horizontal, 0.62], [horizontal, 0.52], [horizontal, -0.30]];
  }

  renderer.addEventListener("pointerup", event => {
    if (section.classList.contains("fractal-fallback")) return;
    const rect = renderer.getBoundingClientRect();
    const point = [
      (2 * (event.clientX - rect.left) - rect.width) / Math.max(rect.height, 1),
      (2 * (rect.height - (event.clientY - rect.top)) - rect.height) / Math.max(rect.height, 1),
    ];
    let closest = -1;
    let hitRadius = event.pointerType === "touch" ? 0.18 : 0.14;

    starPositions().forEach(([x, y], index) => {
      const distance = Math.hypot(point[0] - x, point[1] - y);
      if (distance < hitRadius) {
        hitRadius = distance;
        closest = index;
      }
    });

    if (closest < 0 || charge[closest] === 1) return;
    charge[closest] = 1;
    syncUniforms();
    if (charge.every(value => value === 1)) activateCore();
  });

  core.addEventListener("click", () => {
    if (!activated) activateCore();
    revealMission();
  });

  renderer.addEventListener("shader-ready", () => {
    section.classList.add("fractal-ready");
    syncUniforms();
  });
  renderer.addEventListener("shader-error", event => activateFallback(event.detail?.error));

  if (renderer.dataset.state === "error") {
    activateFallback(renderer.error || new Error("The shader renderer could not start"));
  } else if (typeof renderer.setUniform !== "function") {
    activateFallback(new Error("The shader-renderer component is unavailable"));
  } else {
    syncUniforms();
  }
})();
