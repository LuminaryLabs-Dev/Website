import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { transition } from './session-state.mjs';
const $=s=>document.querySelector(s),video=$('#camera'),view=$('#view');
let state='loading',stream,controller,renderer,raf,model,group,recognizing=false;
const abort=new AbortController();
function move(event){state=transition(state,event);document.body.dataset.state=state;}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;}
function close(){if(state==='closed')return;move('close');abort.abort();stopCamera();cancelAnimationFrame(raf);if(!recognizing)controller?.dispose();renderer?.dispose();}
addEventListener('pagehide',close);addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='close-experience')close()});
function show(){if(state!=='viewing')return;group.visible=true;$('#reticle').hidden=true;$('#controls').hidden=false;$('#hint').textContent='Porcupine Falls · yours to explore';}
async function main(){
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;view.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.01,20);scene.add(camera);
 scene.add(new THREE.HemisphereLight(0xffffff,0x65735c,1));const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(-1,2,1);scene.add(sun);
 const gltf=await new GLTFLoader().loadAsync('./assets/porcupine-mobile.glb');if(state==='closed')return;
 model=gltf.scene;group=new THREE.Group();group.add(model);scene.add(group);group.visible=false;group.position.set(0,-.025,-1.1);
 const pivot=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());model.position.sub(pivot);group.rotation.set(.7,.1,0);
 // Camera-relative placement is deliberate. No image anchor owns this group.
 const fit=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const width=2*1.1*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;group.userData.fit=Math.min(1,width/.8);group.scale.setScalar(group.userData.fit*Number($('#size').value));};
 addEventListener('resize',fit);fit();let last=0;
 const draw=t=>{if(state==='closed')return;raf=requestAnimationFrame(draw);if(document.hidden||t-last<1000/30)return;last=t;renderer.render(scene,camera);};raf=requestAnimationFrame(draw);
 $('#size').oninput=()=>group.scale.setScalar(group.userData.fit*Number($('#size').value));$('#reset').onclick=()=>{group.rotation.set(.7,.1,0);$('#size').value=1;fit();};
 let pointer=null;view.onpointerdown=e=>{if(state!=='viewing')return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};view.setPointerCapture(e.pointerId);};view.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;group.rotation.y+=(e.clientX-pointer.x)*.008;group.rotation.x=THREE.MathUtils.clamp(group.rotation.x+(e.clientY-pointer.y)*.006,.25,1.3);pointer.x=e.clientX;pointer.y=e.clientY;};view.onpointerup=view.onpointercancel=()=>pointer=null;
 if(new URLSearchParams(location.search).get('mode')==='preview'){document.body.style.background='radial-gradient(circle at 50% 40%,#456154,#10261f)';move('preview');show();$('#hint').textContent='3D preview · camera off';return;}
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access requires HTTPS or localhost. Use the USB setup in the README, or host this folder on HTTPS.');
 $('#hint').textContent='Allow your rear camera to scan the card.';
 stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
 if(state==='closed'){stopCamera();return;}
 video.srcObject=stream;await video.play();if(state==='closed')return;video.width=video.videoWidth;video.height=video.videoHeight;
 const response=await fetch('./assets/target.mind',{signal:abort.signal});if(!response.ok)throw new Error('The image target could not load. Please close and try again.');const target=await response.arrayBuffer();
 const {Controller}=await import('./vendor/mindar-image.prod.js');if(state==='closed')return;
 controller=new Controller({inputWidth:video.videoWidth,inputHeight:video.videoHeight,maxTrack:1});controller.addImageTargetsFromBuffer(target);controller.dummyRun(video);
 move('ready');$('#hint').textContent='Point at the entire terrain card.';$('#reticle').hidden=false;
 let consecutive=0;
 // Controlled detection loop stops permanently once spawned. No lost-target event can hide the model.
 while(state==='scanning'){
   if(document.hidden){await new Promise(r=>setTimeout(r,250));continue;}
   recognizing=true;
   try{const {featurePoints}=await controller.detect(video);if(state!=='scanning')break;const result=await controller.match(featurePoints,0);if(state!=='scanning')break;consecutive=result.modelViewTransform?consecutive+1:0;if(consecutive>=2){move('found');show();}}
   finally{recognizing=false;}
   if(state==='scanning')await new Promise(r=>setTimeout(r,100));
 }
 controller.dispose();controller=null;
}
main().catch(e=>{if(state==='closed')return;move('error');stopCamera();controller?.dispose();$('#reticle').hidden=true;$('#hint').textContent='Unable to open the experience';$('#error').hidden=false;$('#error').textContent=e.name==='NotAllowedError'?'Camera permission was denied. Close this experience, allow camera access in Chrome, and try again.':(e.message||'Please close and try again.');console.error(e);});
