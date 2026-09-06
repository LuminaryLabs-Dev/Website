// Preserve the existing robot geometry; load Three.js only on request.
export async function createPortrait(m, color, i = 0) {
  const THREE = await import('/assets/vendor/three/three.module.min.js');
const s=new THREE.Scene(),c=new THREE.PerspectiveCamera(28,1,.1,100),r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,1));r.shadowMap.enabled=false;r.shadowMap.type=THREE.PCFSoftShadowMap;r.setClearColor(0,0);m.append(r.domElement);c.position.set(0,1.1,8);s.add(new THREE.HemisphereLight(0xffffff,0x9eaaa2,2.2));const l=new THREE.DirectionalLight(0xffffff,3.8);l.position.set(-3,5,4);l.castShadow=true;l.shadow.mapSize.set(1024,1024);s.add(l);const g=new THREE.Group();s.add(g);const shell=new THREE.MeshStandardMaterial({color:0x303633,metalness:.78,roughness:.2}),dark=new THREE.MeshStandardMaterial({color:0x111513,metalness:.72,roughness:.24}),glow=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.85,metalness:.3,roughness:.18});const add=(geo,mat,pos,scale=[1,1,1])=>{const q=new THREE.Mesh(geo,mat);q.position.set(...pos);q.scale.set(...scale);q.castShadow=true;q.receiveShadow=true;g.add(q);return q};add(new THREE.CapsuleGeometry(.52,.55,12,24),shell,[0,.82,0],[1,1.05,.72]);add(new THREE.SphereGeometry(.43,32,20),shell,[0,1.72,0],[1,.92,.8]);add(new THREE.SphereGeometry(.3,32,16),dark,[0,1.73,.31],[1.25,.57,.2]);add(new THREE.SphereGeometry(.075,16,10),glow,[-.13,1.75,.365]);add(new THREE.SphereGeometry(.075,16,10),glow,[.13,1.75,.365]);add(new THREE.BoxGeometry(.36,.22,.06),dark,[0,.92,.39]);add(new THREE.BoxGeometry(.2,.06,.07),glow,[0,.92,.43]);const a=add(new THREE.CapsuleGeometry(.13,.5,10,18),shell,[-.72,.82,0],[1,1,.9]),b=add(new THREE.CapsuleGeometry(.13,.5,10,18),shell,[.72,.82,0],[1,1,.9]);add(new THREE.SphereGeometry(.17,20,14),glow,[-.72,.52,0]);add(new THREE.SphereGeometry(.17,20,14),glow,[.72,.52,0]);add(new THREE.CapsuleGeometry(.14,.48,10,18),dark,[-.3,.08,0],[1,1,.85]);add(new THREE.CapsuleGeometry(.14,.48,10,18),dark,[.3,.08,0],[1,1,.85]);add(new THREE.SphereGeometry(.17,20,14),glow,[-.3,-.25,0]);add(new THREE.SphereGeometry(.17,20,14),glow,[.3,-.25,0]);add(new THREE.CylinderGeometry(.035,.035,.25,12),dark,[0,2.2,0]);add(new THREE.SphereGeometry(.08,16,10),glow,[0,2.34,0]);const floor=new THREE.Mesh(new THREE.CircleGeometry(1.45,48),new THREE.ShadowMaterial({opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-.43;floor.receiveShadow=true;floor.visible=false;s.add(floor);
  const resize = () => {
    const box=m.getBoundingClientRect();
    r.setSize(Math.max(1,box.width),Math.max(1,box.height),false);
    c.aspect=box.width/Math.max(1,box.height);c.updateProjectionMatrix();
  };
  function render(t=0){
    g.rotation.y=Math.sin(t*.5+i)*.2;g.position.y=Math.sin(t*1.25+i)*.045;
    a.rotation.z=Math.sin(t*1.35+i)*.08;b.rotation.z=-Math.sin(t*1.35+i)*.08;
    r.render(s,c);
  }
  resize();render(0);
  const observer=new ResizeObserver(()=>{resize();render(controller.elapsed);});
  const controller=window.SiteMotion.register({element:m,render,fps:24});
  observer.observe(m);
  return {render,controller,canvas:r.domElement,dispose(){
    controller.dispose();observer.disconnect();
    s.traverse(object=>{object.geometry?.dispose();if(object.material)object.material.dispose();});
    r.dispose();r.forceContextLoss();r.domElement.remove();
  }};
}
let active=null,request=0;
const portraits=[...document.querySelectorAll('.robot-portrait')];
portraits.forEach((figure,i)=>{
  const button=figure.querySelector('[data-robot-toggle]');
  const status=figure.querySelector('.robot-status');
  button.hidden=false;
  button.addEventListener('click',async()=>{
    if(active?.figure===figure){
      if(active.view.controller.playing){active.view.controller.pause();button.textContent='Resume portrait';}
      else{active.view.controller.play();button.textContent='Pause portrait';}
      return;
    }
    const current=++request;
    if(active){active.view.dispose();active.figure.querySelector('.robot-poster').hidden=false;active.figure.querySelector('button').textContent='Animate portrait';active=null;}
    button.disabled=true;status.textContent='Loading portrait…';
    try{
      const view=await createPortrait(figure.querySelector('.robot-stage'),parseInt(figure.dataset.color,16),i);
      if(current!==request){view.dispose();return;}
      active={figure,view};figure.querySelector('.robot-poster').hidden=true;
      status.textContent='';button.textContent='Pause portrait';view.controller.play();
      view.canvas.addEventListener('webglcontextlost',()=>{
        if(active?.view!==view)return;
        active=null;figure.querySelector('.robot-poster').hidden=false;
        status.textContent='Animation unavailable. The still illustration is shown.';button.textContent='Retry animation';view.dispose();
      },{once:true});
    }catch{
      status.textContent='Animation unavailable. The still illustration is shown.';button.textContent='Retry animation';
    }finally{button.disabled=false;}
  });
});
const motion=()=>portraits.forEach(figure=>{
  const button=figure.querySelector('button');
  button.disabled=window.SiteMotion.reduced;
  if(window.SiteMotion.reduced)figure.querySelector('.robot-status').textContent='Still portrait · reduced motion';
  else if(figure.querySelector('.robot-status').textContent==='Still portrait · reduced motion')figure.querySelector('.robot-status').textContent='';
});
window.addEventListener('site-motion-change',motion);motion();
