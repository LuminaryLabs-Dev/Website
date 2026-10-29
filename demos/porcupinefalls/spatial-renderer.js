// Explicit WebXR base-layer rendering. The XR session owns its frame loop and
// opaque framebuffer; Three.js renders scene content using the supplied view.
export class SpatialRenderer {
 constructor(renderer,camera){this.renderer=renderer;this.camera=camera;this.session=null;this.referenceSpace=null;this.layer=null;this.requestId=null;this.lastViews=[];this.errorCode=0;}
 async prepare(session){
  this.session=session;
  const gl=this.renderer.getContext();
  await gl.makeXRCompatible();
  if(this.session!==session)return false;
  this.layer=new XRWebGLLayer(session,gl,{alpha:true,depth:true,stencil:false,antialias:false,framebufferScaleFactor:1});
  session.updateRenderState({baseLayer:this.layer,depthNear:.01,depthFar:30});
  this.referenceSpace=await session.requestReferenceSpace('local');
  if(this.session!==session)return false;
  this.renderer.setPixelRatio(1);
  this.renderer.setSize(this.layer.framebufferWidth,this.layer.framebufferHeight,false);
  this.renderer.autoClear=false;
  this.renderer.xr.enabled=false;
  this.camera.matrixAutoUpdate=false;
  return true;
 }
 start(callback){
  const session=this.session;
  const onFrame=(time,frame)=>{
   if(this.session!==session)return;
   this.requestId=session.requestAnimationFrame(onFrame);
   callback(time,frame);
  };
  this.requestId=session.requestAnimationFrame(onFrame);
 }
 updateCamera(view){
  const c=this.camera;
  c.matrix.fromArray(view.transform.matrix);
  c.matrix.decompose(c.position,c.quaternion,c.scale);
  c.projectionMatrix.fromArray(view.projectionMatrix);
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  c.updateMatrixWorld(true);
 }
 render(scene,pose){
  if(!this.layer)return;
  if(pose?.views.length)this.lastViews=Array.from(pose.views);
  if(!this.lastViews.length)return;
  const r=this.renderer,gl=r.getContext();
  // Reset Three's cached GL state before binding the runtime-owned framebuffer.
  r.resetState();
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.layer.framebuffer);
  gl.disable(gl.SCISSOR_TEST);gl.colorMask(true,true,true,true);gl.depthMask(true);
  gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  for(const view of this.lastViews){
   const viewport=this.layer.getViewport(view);
   this.updateCamera(view);
   r.setViewport(viewport.x,viewport.y,viewport.width,viewport.height);
   r.render(scene,this.camera);
  }
  // Keep screen picking aligned with the phone's first (normally only) view.
  this.updateCamera(this.lastViews[0]);
  this.errorCode=gl.getError();
 }
 stop(){
  if(this.session&&this.requestId!==null)this.session.cancelAnimationFrame(this.requestId);
  this.session=null;this.requestId=null;this.referenceSpace=null;this.lastViews=[];this.layer=null;
 }
}
