// Site-wide JS: nav toggle, scroll reveals, dynamic year, utility animations
(function () {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle for legacy headers only.
  if (!document.querySelector(".universal-nav")) {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
      // Guard clause: If the mobile nav isn't open, exit immediately to keep execution light
      if (!nav.classList.contains("open")) return;

      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    }
  }

  // Intersection observer for scroll reveal animations
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // Header shrink on scroll
  const header = document.querySelector(".site-header");
  if (header) {
    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const current = window.scrollY;
      if (current > 80) {
        header.style.borderBottomColor = "rgba(255, 255, 255, 0.08)";
      } else {
        header.style.borderBottomColor = "rgba(255, 255, 255, 0.06)";
      }
      lastScroll = current;
    }, { passive: true });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Horizontal scroll hook for the arcade card row
  const gameTrack = document.querySelector(".hide-scrollbar");
  if (gameTrack) {
    gameTrack.addEventListener("wheel", (e) => {
      // If the trackpad or mouse is already sending a native horizontal scrolling vector, respect it
      if (e.deltaX !== 0) return;
      
      // Otherwise, catch the vertical scroll input and translate it sideways
      e.preventDefault();
      gameTrack.scrollLeft += e.deltaY;
    }, { passive: false });
  }
})();
