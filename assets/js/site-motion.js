/* One visibility and motion policy for decorative scenes and optional portraits. */
(() => {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  const scenes = new Map();
  const jobs = new Set();
  let frame = 0;
  const allowed = () => !paused && !query.matches && !document.hidden;
  const buttons = document.querySelectorAll('[data-motion-toggle]');
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      scenes.set(entry.target, entry.isIntersecting);
      jobs.forEach(job => { if (job.element === entry.target) job.visible = entry.isIntersecting; });
    });
    sync();
  }, {threshold: .01}) : null;
  function watch(element) {
    scenes.set(element, !observer);
    observer?.observe(element);
  }
  function tick(now) {
    frame = 0;
    jobs.forEach(job => {
      if (!job.playing || !job.visible || !allowed()) { job.last = null; return; }
      if (job.last === null) job.last = now;
      const delta = now - job.last;
      if (delta >= 1000 / job.fps) {
        job.elapsed += delta / 1000;
        job.last = now;
        job.render(job.elapsed);
      }
    });
    if (allowed() && [...jobs].some(j => j.playing && j.visible)) frame = requestAnimationFrame(tick);
  }
  function sync() {
    document.body.classList.toggle('motion-paused', !allowed());
    scenes.forEach((visible, element) => {
      element.classList.toggle('is-visible', visible);
      element.querySelectorAll('shader-renderer[data-decorative]').forEach(renderer => {
        renderer.toggleAttribute('paused', !allowed() || !visible);
      });
    });
    buttons.forEach(button => {
      button.hidden = query.matches;
      button.textContent = paused ? 'Resume motion' : 'Pause motion';
      button.setAttribute('aria-pressed', String(paused));
    });
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    jobs.forEach(job => { job.last = null; });
    if (allowed() && [...jobs].some(j => j.playing && j.visible)) frame = requestAnimationFrame(tick);
    window.dispatchEvent(new CustomEvent('site-motion-change', {detail:{paused,reduced:query.matches,allowed:allowed()}}));
  }
  buttons.forEach(button => button.addEventListener('click', () => { paused = !paused; sync(); }));
  document.querySelectorAll('[data-ambient]').forEach(watch);
  document.addEventListener('visibilitychange', sync);
  query.addEventListener('change', sync);
  window.SiteMotion = {
    get allowed() { return allowed(); },
    get reduced() { return query.matches; },
    register({element,render,fps=24}) {
      const job={element,render,fps,visible:false,playing:false,elapsed:0,last:null};
      jobs.add(job); watch(element);
      return {
        play(){job.playing=true;sync();},
        pause(){job.playing=false;sync();},
        get playing(){return job.playing;},
        get elapsed(){return job.elapsed;},
        dispose(){jobs.delete(job);observer?.unobserve(element);scenes.delete(element);sync();}
      };
    }
  };
  // Content is visible by default. Enhancement only marks entrances once in view.
  const reveal = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!query.matches) entry.target.classList.add('entered');
      reveal.unobserve(entry.target);
    });
  },{threshold:.08}) : null;
  document.querySelectorAll('[data-reveal]').forEach(element => reveal?.observe(element));
  sync();
})();
