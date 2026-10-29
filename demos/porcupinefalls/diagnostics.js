// Internal read-only counters and visible error reporting. No debug UI or scene objects.
export class Diagnostics {
 constructor(readState){
  this.readState=readState;this.frames=0;this.ignoredFrames=0;this.xrFrames=0;this.poseFrames=0;this.lastError='';this.contextEvents=[];
  addEventListener('error',e=>this.error(e.error??e.message));
  addEventListener('unhandledrejection',e=>this.error(e.reason));
 }
 attach(renderer,spatial){
  this.renderer=renderer;this.spatial=spatial;
  renderer.domElement.addEventListener('webglcontextlost',()=>{this.contextEvents.push('lost');this.error('Graphics context lost');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextEvents.push('restored');if(this.lastError==='Graphics context lost'){this.lastError='';document.querySelector('#error').hidden=true;}});
  renderer.debug.onShaderError=(gl,p,v,f)=>this.error('Shader: '+[gl.getProgramInfoLog(p),gl.getShaderInfoLog(v),gl.getShaderInfoLog(f)].filter(Boolean).join(' '));
 }
 error(error){const message=String(error?.message??error);if(message===this.lastError)return;this.lastError=message;const el=document.querySelector('#error');el.hidden=false;el.textContent='Rendering error: '+this.lastError;}
 observeFrame(frame,pose){this.frames++;if(!frame)return;this.xrFrames++;if(pose)this.poseFrames++;}
 snapshot(){
  const s=this.readState(),gl=this.renderer?.getContext();
  const framebuffer=gl&&!gl.isContextLost()?gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16):'unavailable';
  return {framebuffer,build:'xr-empty-return-8',mode:s.mode,state:s.state,xrVisibility:s.xrVisibility,frames:this.frames,ignoredFrames:this.ignoredFrames,xrFrames:this.xrFrames,poseFrames:this.poseFrames,tracked:s.tracked,terrainVisible:s.terrainVisible,placement:s.placement,position:s.position,documentHidden:document.hidden,contextLost:gl?.isContextLost()??null,contextEvents:this.contextEvents,drawCalls:this.renderer?.info.render.calls??0,triangles:this.renderer?.info.render.triangles??0,layer:this.spatial?.layer?.constructor.name??'none',graphicsError:this.spatial?.errorCode??0,error:this.lastError};
 }
}
