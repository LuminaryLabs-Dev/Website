(() => {
  const stage=document.getElementById('study-stage');
  if(!stage)return;
  const buttons=[...document.querySelectorAll('[data-study]')];
  const pause=document.querySelector('[data-study-pause]');
  const status=document.querySelector('.study-status');
  let selected=null,renderer=null,paused=false;
  const posters=['nexus-engine','nexus-runtime','nexus-interfaces','nexus-ar','bop-it-skills'];
  function sync(){
    renderer?.toggleAttribute('paused',paused||!window.SiteMotion.allowed);
    pause.hidden=!renderer?.ready||window.SiteMotion.reduced;
    pause.textContent=paused?'Resume study':'Pause study';
    pause.setAttribute('aria-pressed',String(paused));
  }
  function select(button){
    selected=button;
    renderer?.remove();renderer=null;
    const i=buttons.indexOf(button);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    stage.querySelector('img').src=`/public/studies/${posters[i]}.webp`;
    stage.querySelector('img').alt=`${button.dataset.studyTitle} visual study`;
    document.getElementById('study-title').textContent=button.dataset.studyTitle;
    document.getElementById('study-caption').textContent=button.dataset.studyCaption;
    if(window.SiteMotion.reduced){status.textContent='Still study · reduced motion';sync();return;}
    status.textContent='Loading study…';
    renderer=document.createElement('shader-renderer');
    renderer.setAttribute('fragment-src',button.dataset.study);
    renderer.setAttribute('paused','');renderer.setAttribute('max-fps','24');
    renderer.setAttribute('max-pixels','260000');renderer.setAttribute('pixel-ratio-cap','1');
    renderer.addEventListener('shader-ready',()=>{status.textContent='';sync();},{once:true});
    renderer.addEventListener('shader-error',()=>{status.textContent='Animation unavailable. Select the study again to retry.';pause.hidden=true;},{once:true});
    stage.append(renderer);sync();
    // Put the selected preview in view on narrow screens without moving focus.
    if(matchMedia('(max-width:760px)').matches)stage.scrollIntoView({behavior:window.SiteMotion.reduced?'instant':'smooth',block:'center'});
  }
  buttons.forEach(button=>{button.hidden=false;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>select(button));});
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  window.addEventListener('site-motion-change',()=>{
    if(window.SiteMotion.reduced){renderer?.remove();renderer=null;if(selected)status.textContent='Still study · reduced motion';}
    sync();
  });
})();
