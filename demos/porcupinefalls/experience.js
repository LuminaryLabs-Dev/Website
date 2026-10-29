import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {Placement,GazeReveal} from './placement.mjs?v=xr-clean-6';
import {Features,titleSprite} from './features.js';
import {SpatialRenderer} from './spatial-renderer.js?v=xr-direct-5';
import {Diagnostics} from './diagnostics.js?v=xr-clean-6';
const $=s=>document.querySelector(s),video=$('#camera'),view=$('#view'),overlay=$('#overlay');
const preview=new URLSearchParams(location.search).get('mode')==='preview';
const placement=new Placement(),gaze=new GazeReveal(),abort=new AbortController(),ray=new T.Raycaster();
const camPos=new T.Vector3(),camQuat=new T.Quaternion(),viewerMatrix=new T.Matrix4();
let state='loading',mode=preview?'preview':'camera',stream,controller,recognizing=false,renderer,scene,camera,group,model,features,terrain,title,controls;
let spatial=null;
let xrSession=null,anchor=null,anchorPending=false,anchorRevision=-1,pendingPin=null,worldSupported=false;
let lastTime=0,gazeCheck=0,looking=false,tracked=true,gyroBase=null,elapsed=0,selectedId=null;
const diagnostics=new Diagnostics(()=>({state,mode,tracked,terrainVisible:group?.visible,xrVisibility:xrSession?.visibilityState??null,placement:placement.mode,position:placement.position.toArray()}));
function status(s){state=s;document.body.dataset.state=s;}
function hint(s){$('#hint').textContent=s;$('#hint').style.opacity=s?1:0;}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;}
function disposeAnchor(){anchor?.delete();anchor=null;anchorRevision=-1;}
function close(){if(state==='closed')return;status('closed');if(group)group.visible=false;abort.abort();stopCamera();disposeAnchor();spatial?.stop();xrSession?.end().catch(()=>{});renderer?.setAnimationLoop(null);if(!recognizing)controller?.dispose();controls?.dispose();renderer?.dispose();removeEventListener('deviceorientation',orientation);}
addEventListener('pagehide',close);addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='close-experience')close();});
$('#exit').onclick=()=>{close();parent.postMessage({type:'experience-closed'},location.origin);};
function canPin(){return mode==='world'||mode==='preview';}
function currentCamera(){return camera;}
function cameraPose(){const c=currentCamera();c.getWorldPosition(camPos);c.getWorldQuaternion(camQuat);return c;}
function updatePinLabel(){$('#pin').textContent=!canPin()?'Pin unavailable':placement.mode==='following'?'Pin here':'Follow';}
function show(){status('viewing');group.visible=true;$('#reticle').hidden=true;$('#pin').hidden=false;
 if(mode==='preview'){placement.mode='pinned';placement.initialized=true;placement.position.set(0,0,0);placement.rotation.identity();hint('Preview · drag to orbit, scroll to move closer.');}
 else if(worldSupported){$('#enter').hidden=false;hint('Image recognised. Enter spatial AR to pin and walk around.');}
 else hint('Tap paths or markers. This device cannot pin terrain in physical space.');updatePinLabel();}
function pinAt(focus){if(!canPin()){hint('Physical pinning requires a world-tracking browser. Path and landmark details still work.');return;}
 if(placement.mode==='pinned'&&!focus)return;disposeAnchor();placement.pin(camPos,camQuat,focus??new T.Vector3(),focus?.55:.85);if(controls)controls.enabled=false;updatePinLabel();}
$('#pin').onclick=()=>{if(!canPin()){pinAt(null);return;}if(placement.mode==='following')pendingPin={focus:null};else{disposeAnchor();pendingPin=null;placement.follow();if(controls)controls.enabled=false;hint('Following gently. Tap terrain to pin.');updatePinLabel();}};
$('#dismiss').onclick=()=>{$('#details').hidden=true;features.select(null);selectedId=null;};
function select(item){if(!features.select(item))return;selectedId=item.id;$('#details').hidden=false;$('#name').textContent=item.name;
 $('#description').textContent=item.kind==='trail'?`${item.lengthM>=1000?(item.lengthM/1000).toFixed(2)+' km':item.lengthM+' m'} · ${item.start} → ${item.end}.`:item.description;
 $('#placement-note').textContent=canPin()?'Move closer to inspect. The terrain keeps its physical size.':'Physical pinning is unavailable on this device.';
 const focus=model.localToWorld(item.center.clone());group.worldToLocal(focus);if(canPin())pendingPin={focus};else{placement.follow(focus);hint('Feature in focus. Physical pinning unavailable on this device.');}}
function selectRay(){if(state!=='viewing'||!tracked)return;const item=features.pick(ray);if(item){select(item);return;}if(ray.intersectObject(terrain,false).length&&placement.mode==='following')pendingPin={focus:null};}
function pickScreen(x,y){ray.setFromCamera(new T.Vector2(x/innerWidth*2-1,-y/innerHeight*2+1),cameraPose());selectRay();}
let pointer=null;
function down(e){if(e.target.closest('button,#details'))return;pointer={x:e.clientX,y:e.clientY};}
function up(e){if(!pointer||e.target.closest('button,#details'))return;const p=pointer;pointer=null;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<8)pickScreen(e.clientX,e.clientY);}
for(const el of [view,overlay]){el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);}
overlay.addEventListener('beforexrselect',e=>{if(e.target.closest('button,#details'))e.preventDefault();});
function orientation(e){if(mode!=='camera'||e.alpha===null||state!=='viewing')return;
 const q=new T.Quaternion().setFromEuler(new T.Euler(T.MathUtils.degToRad(e.beta),T.MathUtils.degToRad(e.alpha),-T.MathUtils.degToRad(e.gamma),'YXZ'));
 q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-T.MathUtils.degToRad(screen.orientation?.angle??0)));
 if(!gyroBase)gyroBase=q.clone().invert();camera.quaternion.copy(gyroBase).multiply(q);camera.updateMatrixWorld(true);}
addEventListener('deviceorientation',orientation);
async function enterWorld(){if(state!=='viewing'||xrSession||$('#enter').disabled)return;$('#enter').disabled=true;
 // Request synchronously inside the tap gesture; release the scan camera before XR owns it.
 try{stopCamera();const request=navigator.xr.requestSession('immersive-ar',{requiredFeatures:['local'],optionalFeatures:['local-floor','anchors','dom-overlay'],domOverlay:{root:overlay}});
 const session=await request;if(state==='closed'){await session.end();return;}xrSession=session;session.addEventListener('end',()=>{spatial.stop();xrSession=null;if(state!=='closed'){close();parent.postMessage({type:'experience-closed'},location.origin);}});renderer.setAnimationLoop(null);if(!await spatial.prepare(session))return;if(state==='closed'){await session.end().catch(()=>{});return;}
 mode='world';tracked=false;lastTime=0;$('#exit').hidden=false;placement.initialized=false;placement.follow();$('#enter').hidden=true;overlay.style.pointerEvents='auto';video.hidden=true;hint('Tap terrain to pin. Walk closer to inspect.');updatePinLabel();
 spatial.referenceSpace.addEventListener('reset',()=>{disposeAnchor();placement.follow();placement.initialized=false;hint('Tracking origin changed. Tap to pin again.');updatePinLabel();});
 session.addEventListener('select',e=>{if(session.domOverlayState)return;const pose=e.frame.getPose(e.inputSource.targetRaySpace,spatial.referenceSpace);if(!pose)return;const m=new T.Matrix4().fromArray(pose.transform.matrix);ray.ray.origin.setFromMatrixPosition(m);ray.ray.direction.set(0,0,-1).transformDirection(m);selectRay();});
 spatial.start(renderFrame);
 }catch(e){if(state==='closed')return;$('#enter').disabled=false;hint('Spatial AR could not start. Close and retry with Google Play Services for AR enabled.');$('#error').hidden=false;$('#error').textContent=e.message||'Spatial AR is unavailable.';}}
$('#enter').onclick=enterWorld;
function updateAnchor(frame){if(!frame||placement.mode!=='pinned')return;const ref=spatial.referenceSpace;
 if(anchor){const pose=frame.getPose(anchor.anchorSpace,ref);if(!pose)return;placement.position.set(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);return;}
 if(!frame.createAnchor||anchorPending||anchorRevision===placement.revision)return;
 const revision=placement.revision;anchorRevision=revision;anchorPending=true;const p=placement.position,q=placement.rotation;
 frame.createAnchor(new XRRigidTransform({x:p.x,y:p.y,z:p.z},{x:q.x,y:q.y,z:q.z,w:q.w}),ref).then(a=>{if(state==='closed'||revision!==placement.revision||placement.mode!=='pinned'){a.delete();return;}anchor=a;}).catch(()=>{/* local space remains world-fixed without an optional anchor */}).finally(()=>anchorPending=false);}
function draw(time,frame,viewerPose){
 if(state==='closed')return;
 const dt=Math.min(.1,lastTime?(time-lastTime)/1000:0);lastTime=time;elapsed+=dt;
 const active=mode==='world'?xrSession?.visibilityState!=='hidden':!document.hidden;
 if(state==='viewing'&&active){
  const wasTracked=tracked;tracked=mode!=='world'||Boolean(viewerPose);
  if(tracked){
   if(mode==='world'){
    // Placement consumes the actual viewer pose, independently of diagnostics
    // and the renderer's derived eye cameras.
    viewerMatrix.fromArray(viewerPose.transform.matrix);
    camPos.setFromMatrixPosition(viewerMatrix);camQuat.setFromRotationMatrix(viewerMatrix);
    if(viewerPose.views[0])spatial.updateCamera(viewerPose.views[0]);
    if(!wasTracked)hint(placement.mode==='following'?'Tap terrain to pin. Walk closer to inspect.':'');
   }else{if(controls?.enabled)controls.update();cameraPose();}
   if(pendingPin){const p=pendingPin;pendingPin=null;pinAt(p.focus);}
   placement.update(dt,camPos,camQuat);updateAnchor(frame);
   group.position.copy(placement.position);group.quaternion.copy(placement.rotation);group.updateMatrixWorld(true);
   if(mode==='preview'&&placement.mode==='pinned'&&controls&&!controls.enabled){controls.target.copy(placement.focus).applyQuaternion(group.quaternion).add(group.position);controls.enabled=true;}
   if(mode==='world'&&placement.mode==='pinned')hint('');
   if(time-gazeCheck>150){gazeCheck=time;ray.setFromCamera(new T.Vector2(),currentCamera());looking=ray.intersectObject(terrain,false).length>0;}
   gaze.update(dt,looking,mode!=='world'||xrSession.visibilityState==='visible');
  }else{
   // Tracking owns transform updates, never the lifetime of the scene content.
   hint('Tracking paused. Terrain stays at its last position.');
  }
  title.material.opacity=gaze.fade;title.position.y=.14+(1-gaze.fade)*.045;features.update(elapsed);
 }
 if(mode==='world')spatial.render(scene,viewerPose);else renderer.render(scene,camera);
}
function renderFrame(time,frame){
 if(state==='closed')return;
 if(mode==='world'&&(!frame||frame.session!==xrSession)){diagnostics.ignoredFrames++;return;}
 try{
  const viewerPose=mode==='world'?frame.getViewerPose(spatial.referenceSpace):null;
  draw(time,frame,viewerPose);
  // Diagnostics observes the same pose after rendering; it cannot gate content.
  diagnostics.observeFrame(frame,viewerPose);
 }catch(error){diagnostics.error(error);}
}

async function scan(){if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Use HTTPS and allow camera access.');
 stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});if(state==='closed'){stopCamera();return;}
 video.srcObject=stream;await video.play();if(state==='closed')return;video.width=video.videoWidth;video.height=video.videoHeight;
 const r=await fetch('./assets/target.mind',{signal:abort.signal});if(!r.ok)throw Error('Image target could not load.');const bytes=await r.arrayBuffer();const {Controller}=await import('./vendor/mindar-image.prod.js');if(state==='closed')return;
 controller=new Controller({inputWidth:video.videoWidth,inputHeight:video.videoHeight,maxTrack:1});controller.addImageTargetsFromBuffer(bytes);controller.dummyRun(video);status('scanning');hint('Scan the entire terrain image.');$('#reticle').hidden=false;let matches=0;
 while(state==='scanning'){if(document.hidden){await new Promise(r=>setTimeout(r,200));continue;}recognizing=true;
 try{const {featurePoints}=await controller.detect(video);if(state!=='scanning')break;const result=await controller.match(featurePoints,0);if(state!=='scanning')break;matches=result.modelViewTransform?matches+1:0;if(matches>=2)show();}finally{recognizing=false;}
 if(state==='scanning')await new Promise(r=>setTimeout(r,100));}controller.dispose();controller=null;}
async function main(){
 const canvas=document.createElement('canvas'),context=canvas.getContext('webgl',{alpha:true,antialias:false,depth:true,stencil:false,xrCompatible:true,preserveDrawingBuffer:true});
 if(!context)throw Error('WebGL graphics are unavailable.');
 renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:false,stencil:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.xr.enabled=false;view.append(renderer.domElement);
 scene=new T.Scene();camera=new T.PerspectiveCamera(45,1,.01,30);scene.add(camera);spatial=new SpatialRenderer(renderer,camera);scene.add(new T.HemisphereLight(0xffffff,0x65735c,1));const sun=new T.DirectionalLight(0xffffff,1.5);sun.position.set(-1,2,1);scene.add(sun);
 const [gltf,data,supported]=await Promise.all([new GLTFLoader().loadAsync('./assets/porcupine-mobile.glb'),fetch('./assets/features.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Map details could not load.');return r.json();}),navigator.xr?.isSessionSupported('immersive-ar').catch(()=>false)??false]);if(state==='closed')return;
 worldSupported=supported;model=gltf.scene;features=new Features(model,data);terrain=model.getObjectByName('Terrain_100k');group=new T.Group();group.add(model);scene.add(group);group.visible=false;diagnostics.attach(renderer,spatial);
 const center=new T.Box3().setFromObject(terrain).getCenter(new T.Vector3());model.position.sub(center);title=titleSprite();group.add(title);
 const resize=()=>{if(mode==='world')return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};addEventListener('resize',resize);resize();
 if(preview){document.body.style.background='radial-gradient(circle at 50% 40%,#385245,#10261f)';const distance=Math.max(1.07,.65/(2*Math.tan(T.MathUtils.degToRad(45/2))*camera.aspect*.85));camera.position.set(0,.65,.85).normalize().multiplyScalar(distance);camera.lookAt(0,0,0);controls=new OrbitControls(camera,view);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.12;controls.maxDistance=2;controls.maxPolarAngle=Math.PI/2-.05;show();}else await scan();
 if(state!=='closed')renderer.setAnimationLoop(renderFrame);}
// Read-only inspection supports repeatable interaction checks, without simulating real device poses.
export function inspectDiagnostics(){return diagnostics.snapshot();}
export function inspect(){return {surfaceUp:group?new T.Vector3(0,1,0).applyQuaternion(group.quaternion).toArray():null,highlight:features?.selected?.mesh.material.emissive?.getHex()??null,particleSample:features?.particles?Array.from(features.particles.geometry.attributes.position.array.slice(0,3)):null,terrainId:terrain?.uuid,state,mode,tracked,terrainVisible:group?.visible,xrVisibility:xrSession?.visibilityState??null,placement:placement.mode,position:placement.position.toArray(),scale:group?.scale.toArray(),titleRevealed:gaze.revealed,titleOpacity:gaze.fade,selectedId,particles:features?.particles?.geometry.attributes.position.count??0,canPin:canPin(),pickables:features?.items.map(i=>{const p=model.localToWorld((i.points?.[Math.floor(i.points.length*.5)]??i.center).clone()).project(currentCamera());return{id:i.id,x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};})};}
main().catch(e=>{if(state==='closed')return;status('error');stopCamera();controller?.dispose();$('#reticle').hidden=true;$('#error').hidden=false;$('#error').textContent=e.name==='NotAllowedError'?'Camera permission denied. Close, allow camera access, and retry.':e.message;console.error(e);});
