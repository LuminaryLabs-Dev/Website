/* Atmospheric shaders share the homepage renderer and visibility policy. */
(() => {
  document.querySelectorAll('[data-scene-src]').forEach(scene => {
    let renderer;
    let tier = matchMedia('(max-width: 700px)').matches ? 1 : 0;
    let count=0, sampledAt=performance.now(), slow=0;
    const complex=scene.dataset.sceneSrc.includes('contact-scene');
    const budgets=complex?[260000,190000,130000]:[640000,400000,260000];
    function quality(){
      renderer?.setAttribute('max-pixels',String(budgets[tier]));
      renderer?.setUniform('uDetail',tier===2?0:1);
      if(renderer)renderer.dataset.quality=['full','balanced','light'][tier];
    }
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
        renderer.setAttribute('max-fps','30');
        renderer.setAttribute('max-pixels',String(budgets[tier]));
        renderer.setAttribute('pixel-ratio-cap','1');
        renderer.addEventListener('shader-ready',quality);
        scene.append(renderer);
      }
      renderer.toggleAttribute('paused',!window.SiteMotion.allowed||!scene.classList.contains('is-visible'));
    }
    const sampler=setInterval(()=>{
      const now=performance.now(), frames=renderer?.frameCount||0;
      const fps=(frames-count)*1000/(now-sampledAt);
      if(renderer?.shouldAnimate()){
        renderer.dataset.measuredFps=fps.toFixed(1);
        slow=fps>0&&fps<22?slow+1:0;
        if(slow>=2&&tier<2){tier++;quality();slow=0;}
      }else slow=0;
      count=frames;sampledAt=now;
    },4000);
    window.addEventListener('pagehide',e=>{if(!e.persisted)clearInterval(sampler);});
    window.addEventListener('site-motion-change',sync);
    sync();
  });
})();
