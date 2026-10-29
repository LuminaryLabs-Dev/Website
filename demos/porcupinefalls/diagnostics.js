import * as T from './vendor/three.module.js';

// Opt-in, local-only diagnostics. No camera frames or reports are uploaded.
export class Diagnostics {
 constructor(enabled, readState, recenter) {
  this.enabled=enabled;this.readState=readState;this.frames=0;this.ignoredFrames=0;this.xrFrames=0;this.poseFrames=0;this.lastError='';this.contextEvents=[];this.lastPaint=0;
  this.panel=document.querySelector('#diagnostics');this.panel.hidden=!enabled;
  document.querySelector('#recenter').onclick=recenter;
  document.querySelector('#basic').onclick=()=>{
   if(!this.terrain)return;this.basic=!this.basic;this.terrain.material=this.basic?this.basicMaterial:this.originalMaterial;
   document.querySelector('#basic').textContent=this.basic?'Restore texture':'Basic terrain';
  };
  document.querySelector('#copy-diagnostics').onclick=async()=>{
   const text=this.report();
   try{await navigator.clipboard.writeText(text);document.querySelector('#copy-diagnostics').textContent='Copied';}
   catch{document.querySelector('#diagnostic-text').textContent=text;}
  };
  addEventListener('error',e=>this.error(e.error??e.message));
  addEventListener('unhandledrejection',e=>this.error(e.reason));
 }
 attach(renderer,scene,terrain,spatial){
  this.spatial=spatial;
  this.renderer=renderer;this.terrain=terrain;
  renderer.domElement.addEventListener('webglcontextlost',()=>{this.contextEvents.push('lost');this.error('Graphics context lost');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextEvents.push('restored');if(this.lastError==='Graphics context lost'){this.lastError='';document.querySelector('#error').hidden=true;}});
  renderer.debug.onShaderError=(gl,p,v,f)=>this.error('Shader: '+[gl.getProgramInfoLog(p),gl.getShaderInfoLog(v),gl.getShaderInfoLog(f)].filter(Boolean).join(' '));
  if(!this.enabled)return;
  this.originalMaterial=terrain.material;this.basicMaterial=new T.MeshBasicMaterial({color:0x8bd453,side:T.DoubleSide,toneMapped:false});
  this.marker=new T.Mesh(new T.BoxGeometry(.045,.045,.045),new T.MeshBasicMaterial({color:0xff37b7,depthTest:false,toneMapped:false}));
  this.marker.frustumCulled=false;this.marker.renderOrder=10;this.marker.visible=false;scene.add(this.marker);
 }
 error(error){const message=String(error?.message??error);if(message===this.lastError)return;this.lastError=message;const el=document.querySelector('#error');el.hidden=false;el.textContent='Rendering error: '+this.lastError;this.paint(true);}
 observeFrame(frame,pose){
  this.frames++;if(!frame)return;this.xrFrames++;
  if(pose)this.poseFrames++;
  if(this.marker){this.marker.visible=Boolean(pose);if(pose)this.marker.position.set(0,0,-.45).applyMatrix4(new T.Matrix4().fromArray(pose.transform.matrix));}
 }
 snapshot(){
  const s=this.readState(),gl=this.renderer?.getContext();
  const framebuffer=gl&&!gl.isContextLost()?gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16):'unavailable';
  return {framebuffer,build:'xr-direct-5',mode:s.mode,state:s.state,xrVisibility:s.xrVisibility,frames:this.frames,ignoredFrames:this.ignoredFrames,xrFrames:this.xrFrames,poseFrames:this.poseFrames,tracked:s.tracked,terrainVisible:s.terrainVisible,placement:s.placement,position:s.position,documentHidden:document.hidden,contextLost:gl?.isContextLost()??null,contextEvents:this.contextEvents,drawCalls:this.renderer?.info.render.calls??0,triangles:this.renderer?.info.render.triangles??0,layer:this.spatial?.layer?.constructor.name??'none',graphicsError:this.spatial?.errorCode??0,basicTerrain:Boolean(this.basic),error:this.lastError};
 }
 report(){const s=this.snapshot();return `Build ${s.build} | ${s.mode} | ${s.state}\nXR ${s.xrVisibility??'none'} | frames ${s.xrFrames} | poses ${s.poseFrames}\nIgnored webpage frames ${s.ignoredFrames}\nTerrain ${s.terrainVisible?'shown':'hidden'} | ${s.placement}\nDraws ${s.drawCalls} | triangles ${s.triangles}\nContext ${s.contextLost?'LOST':'OK'} | ${s.layer} | FBO ${s.framebuffer} | GL ${s.graphicsError.toString(16)}\nPosition ${s.position.map(n=>n.toFixed(2)).join(', ')}\nPage hidden ${s.documentHidden} | ${s.contextEvents.join(', ')||'no context resets'}${s.error?'\nERROR '+s.error:''}`;}
 paint(force=false){if(!this.enabled)return;const now=performance.now();if(!force&&now-this.lastPaint<500)return;this.lastPaint=now;document.querySelector('#diagnostic-text').textContent=this.report();}
}
