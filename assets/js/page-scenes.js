/* Category playlists: bounded preparation, active-time rotation and ready-only fades. */
(() => {
  const catalog=window.ShaderLibrary;
  customElements.get("shader-renderer")?.registerPass("library-bloom",window.createLibraryBloomPass);
  if(!catalog||!window.SiteMotion)return;
  document.querySelectorAll('[data-shader-category]').forEach(scene=>{
    const entries=catalog.forCategory(scene.dataset.shaderCategory);
    if(!entries.length)return;
    const hero=scene.closest('.presentation-hero'),visual=scene.closest('.presentation-visual')||scene;
    const poster=scene.querySelector('.scene-poster');
    const events=new AbortController(),signal=events.signal;
    let current=null,pending=null,outgoing=null,selected=null,bag=[],failed=new Set();
    let elapsed=0,fade=0,auto=true,visible=false,last=performance.now(),disposed=false;
    let target=[0,0],pointer=[0,0];
    const listen=(el,name,fn,opts={})=>el?.addEventListener(name,fn,{...opts,signal});
    const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    const nextEntry=()=>{if(!bag.length){bag=shuffle(entries.filter(e=>!failed.has(e.id)));if(bag.length>1&&bag[0].id===selected?.id)[bag[0],bag[1]]=[bag[1],bag[0]];}return bag.shift()||null;};
    const controls=document.createElement('div');controls.className='scene-controls';
    const next=document.createElement('button');next.type='button';next.textContent='Next scene';next.disabled=entries.length<2;
    const menu=document.createElement('details');menu.className='scene-menu';const summary=document.createElement('summary');summary.textContent='Scenes';menu.append(summary);
    const panel=document.createElement('div');panel.className='scene-menu-panel';
    const label=document.createElement('label');label.textContent='Scene';const select=document.createElement('select');select.setAttribute('aria-label','Choose scene');
    for(const entry of entries){const o=document.createElement('option');o.value=entry.id;o.textContent=entry.name;select.append(o);}label.append(select);
    const autoLabel=document.createElement('label');const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=true;autoLabel.append(toggle,document.createTextNode(' Auto-switch every 45 seconds'));
    const status=document.createElement('span');status.className='scene-status';status.setAttribute('role','status');
    const browse=document.createElement("a");browse.href="/shaders/?category="+scene.dataset.shaderCategory;browse.textContent="Browse shader library";panel.append(label,autoLabel,browse);menu.append(panel);controls.append(next,menu,status);(hero?.querySelector('.presentation-actions')||scene.parentElement).append(controls);
    const active=()=>visible&&window.SiteMotion.allowed&&!document.documentElement.classList.contains('ll-intro-pending');
    function quality(record,split=false){if(!record)return;record.el.setAttribute('max-pixels',String(Math.floor(record.entry.budgets[record.tier]*(split ? 0.5 : 1))));record.el.setUniform('uDetail',record.tier===2?0:1);record.el.dataset.quality=['full','balanced','light'][record.tier];if(record.el.ready)record.el.draw(record.el.lastElapsed);}
    function remove(record){if(!record)return;const gl=record.el.gl;record.el.remove();gl?.getExtension("WEBGL_lose_context")?.loseContext();}
    function cancelPending(){remove(pending);pending=null;}
    function settle(){remove(outgoing);outgoing=null;fade=0;if(current){current.el.style.opacity='1';quality(current);}}
    function announce(entry){selected=entry;select.value=entry.id;scene.dataset.sceneId=entry.id;status.textContent=entry.name;if(poster)poster.src=entry.poster;}
    function fail(record){failed.add(record.entry.id);if(record===pending){cancelPending();if(!current)scene.dataset.state='fallback';}else if(record===current){remove(current);current=outgoing;outgoing=null;if(current){announce(current.entry);settle();scene.dataset.state='ready';}else scene.dataset.state='fallback';}status.textContent=`${record.entry.name} unavailable — ${current?'keeping current scene':'showing still image'}`;if(current)select.value=current.entry.id;}
    function promote(){if(!pending?.el.ready||outgoing)return;const show=active()||(pending.requested&&visible&&!document.hidden&&!document.documentElement.classList.contains('ll-intro-pending'));if(!show)return;outgoing=current;current=pending;pending=null;elapsed=0;announce(current.entry);scene.dataset.state='ready';if(outgoing&&active()){fade=.0001;current.el.style.opacity='0';quality(current,true);quality(outgoing,true);}else{remove(outgoing);outgoing=null;current.el.style.opacity='1';quality(current);}sync();}
    function prepare(entry,initial=false){
      if(!entry||disposed)return;
      cancelPending();settle();
      if(window.SiteMotion.reduced){announce(entry);scene.dataset.state='poster';return;}
      if(current?.entry.id===entry.id)return;
      const el=document.createElement('shader-renderer');el.className='scene-renderer';el.dataset.sceneId=entry.id;el.style.opacity='0';
      el.setAttribute('aria-hidden','true');if(entry.category==='opensource')el.setAttribute('passes','library-bloom');el.setAttribute('fragment-src',entry.source);el.setAttribute('startup-independent','');el.setAttribute('paused','');el.setAttribute('max-fps','30');el.setAttribute('pixel-ratio-cap','1');
      const record={el,entry,tier:matchMedia('(max-width:700px)').matches?1:0,wait:0,frames:0,sample:0,slow:0,requested:initial||!current};pending=record;quality(record);
      let pointerTime=null;
      if(entry.input==='orbit')el.beforeDraw=time=>{const dt=pointerTime===null?0:Math.max(0,Math.min(.1,time-pointerTime));pointerTime=time;const blend=1-Math.exp(-dt/.25);pointer=pointer.map((v,i)=>v+(target[i]-v)*blend);el.setUniform('uScenePointer',pointer,false);};
      el.addEventListener('shader-ready',()=>{if(pending!==record)return;quality(record);if(record.requested||elapsed>=45000)promote();},{once:true});
      el.addEventListener('shader-error',()=>fail(record),{once:true});
      scene.append(el);
      if(initial){announce(entry);window.HeroLoading?.attach(el);}
      status.textContent=current?`${current.entry.name} · preparing ${entry.name}`:entry.name;
    }
    function sync(){
      last=performance.now();
      toggle.disabled=window.SiteMotion.reduced||entries.length<2;toggle.checked=auto&&!window.SiteMotion.reduced&&entries.length>1;
      if(window.SiteMotion.reduced){cancelPending();settle();remove(current);current=null;scene.dataset.state='poster';scene.querySelector('.hero-loading-cover')?.remove();visual.querySelector('.hero-loading-cover')?.remove();return;}
      for(const record of [current,outgoing])record?.el.toggleAttribute('paused',!active());
      pending?.el.toggleAttribute('paused',!!current||!active());
      if(!current&&!pending&&selected&&!failed.has(selected.id))prepare(selected,true);
    }
    function tick(){
      const now=performance.now(),dt=Math.min(500,now-last);last=now;if(disposed||!active())return;
      if(current?.el.ready){
        if(auto&&entries.length>1&&!outgoing)elapsed+=dt;
        current.sample+=dt;
        if(current.sample>=4000){const fps=(current.el.frameCount-current.frames)*1000/current.sample;current.slow=fps>0&&fps<22?current.slow+1:0;if(current.slow>=2&&current.tier<2){current.tier++;quality(current,!!outgoing);current.slow=0;}current.frames=current.el.frameCount;current.sample=0;}
      }
      if(pending){pending.wait+=dt;if(pending.el.disposed||pending.wait>30000)fail(pending);else if(pending.el.ready&&(pending.requested||elapsed>=45000))promote();}
      if(outgoing){fade+=dt;current.el.style.opacity=String(.5-.5*Math.cos(Math.PI*Math.min(1,fade/1200)));if(fade>=1200)settle();}
      if(auto&&entries.length>1&&elapsed>=40000&&!pending&&!outgoing){const e=nextEntry();if(e)prepare(e);}
    }
    function advance(){if(pending){pending.requested=true;if(pending.el.ready)promote();return;}const e=nextEntry();if(e){prepare(e);if(pending){pending.requested=true;if(pending.el.ready)promote();}}}
    listen(next,'click',advance);
    let gesture=null;
    const interactive=target=>target.closest('button,a,input,select,summary,details,[contenteditable]');
    visual.style.cursor=entries.length>1?'pointer':'';
    if(entries.length>1)visual.title='Click or tap for the next scene. Dragging does not switch scenes.';
    listen(visual,'pointerdown',e=>{gesture=e.isPrimary&&e.button===0&&!interactive(e.target)?{x:e.clientX,y:e.clientY,id:e.pointerId,moved:false}:null;},{passive:true});
    listen(visual,'pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;},{passive:true});
    listen(visual,'pointerup',e=>{if(gesture&&e.pointerId===gesture.id){if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;gesture.released=true;}},{passive:true});
    listen(visual,'pointerleave',()=>{if(gesture&&!gesture.released)gesture.moved=true;},{passive:true});
    for(const name of ['pointercancel','wheel'])listen(visual,name,()=>{if(gesture)gesture.moved=true;},{passive:true});
    listen(window,'scroll',()=>{if(gesture)gesture.moved=true;},{passive:true,capture:true});
    listen(visual,'click',e=>{const go=gesture?.released&&!gesture.moved&&!interactive(e.target)&&!window.getSelection()?.toString();gesture=null;if(go&&entries.length>1)advance();});
    listen(select,'change',()=>{auto=false;toggle.checked=false;bag=[];elapsed=0;const entry=entries.find(e=>e.id===select.value);failed.delete(entry.id);bag=shuffle(entries.filter(e=>e.id!==entry.id&&!failed.has(e.id)));prepare(entry);if(pending){pending.requested=true;if(pending.el.ready)promote();}menu.open=false;});
    listen(toggle,'change',()=>{auto=toggle.checked;elapsed=0;bag=shuffle(entries.filter(e=>e.id!==selected?.id&&!failed.has(e.id)));if(!auto)cancelPending();});
    listen(menu,'keydown',e=>{if(e.key==='Escape'){menu.open=false;summary.focus();}});
    listen(visual,'pointermove',event=>{if(event.pointerType==='touch'||!active())return;const r=visual.getBoundingClientRect();target=[Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2))];},{passive:true});
    for(const name of ['pointerleave','pointercancel'])listen(visual,name,()=>target=[0,0]);
    const observer=new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);sync();},{threshold:.01});observer.observe(visual);
    const introObserver=new MutationObserver(sync);introObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    listen(window,'pageshow',sync);listen(window,'site-motion-change',sync);listen(document,'visibilitychange',sync);
    const requested=new URLSearchParams(location.search).get('scene');const initial=entries.find(e=>e.id===requested)||shuffle(entries)[0];if(requested&&initial.id===requested)auto=false;
    bag=shuffle(entries.filter(e=>e.id!==initial.id));prepare(initial,true);sync();const timer=setInterval(tick,50);
    // Read-only state used by the local review gallery and browser validation.
    scene.scenePlaylist={get state(){return {selected:selected?.id,current:current?.entry.id,pending:pending?.entry.id,elapsed,auto,visible,transition:!!outgoing,failed:[...failed]};}};
    listen(window,'pagehide',event=>{if(event.persisted)return;disposed=true;clearInterval(timer);observer.disconnect();introObserver.disconnect();events.abort();cancelPending();settle();remove(current);});
  });
})();
