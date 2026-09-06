/* Atmospheric shaders share the homepage renderer and visibility policy. */
(() => {
  document.querySelectorAll('[data-scene-src]').forEach(scene => {
    let renderer;
    function sync() {
      if (window.SiteMotion.reduced) {
        renderer?.remove(); renderer=null;
        return;
      }
      if (!renderer) {
        renderer=document.createElement('shader-renderer');
        renderer.className='scene-renderer';
        renderer.setAttribute('fragment-src',scene.dataset.sceneSrc);
        renderer.setAttribute('data-decorative','');
        renderer.setAttribute('paused','');
        renderer.setAttribute('max-fps','24');
        renderer.setAttribute('max-pixels','260000');
        renderer.setAttribute('pixel-ratio-cap','1');
        scene.append(renderer);
      }
      renderer.toggleAttribute('paused',!window.SiteMotion.allowed||!scene.classList.contains('is-visible'));
    }
    window.addEventListener('site-motion-change',sync);
    sync();
  });
})();
