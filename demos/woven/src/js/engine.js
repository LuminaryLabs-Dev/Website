/* WOVEN V6 — dependency-free GLB / WebGL2 renderer.
   The scene is preserved from assets/models/Millyard_Loom_Reference_Yarn.glb.
   Exported from Blender under Luminary Labs' own production workflow.
*/
(function () {
'use strict';
const M = {};
M.identity = () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
M.mul = (a,b) => {const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;};
M.compose = (t=[0,0,0],q=[0,0,0,1],s=[1,1,1])=>{
const [x,y,z,w]=q,[sx,sy,sz]=s,[tx,ty,tz]=t;
const xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
return new Float32Array([(1-2*(yy+zz))*sx,(2*(xy+wz))*sx,(2*(xz-wy))*sx,0,
(2*(xy-wz))*sy,(1-2*(xx+zz))*sy,(2*(yz+wx))*sy,0,
(2*(xz+wy))*sz,(2*(yz-wx))*sz,(1-2*(xx+yy))*sz,0,
tx,ty,tz,1]);};
M.perspective=(fovy,aspect,near,far)=>{const f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);};
M.lookAt=(eye,center,up=[0,1,0])=>{
let z=[eye[0]-center[0],eye[1]-center[1],eye[2]-center[2]];
let len=Math.hypot(...z)||1;z=z.map(v=>v/len);
let x=[up[1]*z[2]-up[2]*z[1],up[2]*z[0]-up[0]*z[2],up[0]*z[1]-up[1]*z[0]];
len=Math.hypot(...x)||1;x=x.map(v=>v/len);
const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);};
M.transform=(m,v)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14],m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]];
const decoder = new TextDecoder('utf-8');
function parseGLB(b64){
  const text=atob(b64);const raw=new Uint8Array(text.length);for(let i=0;i<text.length;i++)raw[i]=text.charCodeAt(i);
  const view=new DataView(raw.buffer);if(view.getUint32(0,true)!==0x46546c67)throw Error('Not a GLB');
  if(view.getUint32(4,true)!==2)throw Error('Unsupported glTF version');
  let pos=12, json=null, binary=null;
  while(pos<raw.byteLength){const n=view.getUint32(pos,true),type=view.getUint32(pos+4,true);pos+=8;
    if(type===0x4e4f534a)json=JSON.parse(decoder.decode(raw.subarray(pos,pos+n)).replace(/\0/g,''));
    if(type===0x004e4942)binary=raw.subarray(pos,pos+n);
    pos+=n;
  }
  if(!json||!binary)throw Error('GLB missing JSON/BIN chunks');
  return {json,binary};
}
const VERT=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform mat4 uModel;uniform mat4 uPV;uniform int uWarpMode;uniform int uLiftMask;uniform int uPattern;uniform float uShedAmount;
out vec3 vN;out vec3 vP;out vec2 vUV;
void main(){vec3 p=aPosition;
 if(uWarpMode==1 && uShedAmount>0.001){
   float slot=clamp(floor((p.x+1.6365)/0.03637+0.5),0.0,90.0);
   int shaft=(uPattern==2)?int(mod(floor(slot/2.0),2.0)):int(mod(slot,4.0));
   bool raised=(uLiftMask & (1<<shaft))!=0;
   p.z+=uShedAmount*(raised?0.075:-0.026);
   p.y+=uShedAmount*(raised?0.042:-0.012);
 }
 vec4 world=uModel*vec4(p,1.0);vP=world.xyz;vN=normalize(mat3(uModel)*aNormal);vUV=aUV;gl_Position=uPV*world;}
`;
const FRAG=`#version 300 es
precision highp float;
in vec3 vN;in vec3 vP;in vec2 vUV;
uniform vec4 uBase;uniform vec3 uCamera;uniform float uRoughness;uniform float uMetallic;
uniform float uHighlight;uniform float uDim;uniform float uTime;uniform int uTextureMode;uniform sampler2D uCloth;
out vec4 fragColor;
void main(){
 vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
 vec3 L=normalize(vec3(-0.35,0.68,0.63));vec3 L2=normalize(vec3(0.62,0.25,0.2));
 vec3 V=normalize(uCamera-vP);vec3 H=normalize(L+V);
 float d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);
 vec3 base=uBase.rgb;
 if(uTextureMode==1){vec3 tex=texture(uCloth,vUV).rgb;base=pow(tex,vec3(2.2));}
 // Tonal studio lighting and warm wood highlights
 vec3 diffuse=base*(vec3(0.54,0.59,0.62)+vec3(1.16,1.09,0.94)*d+vec3(0.23,0.3,0.35)*d2);
 float sp=pow(max(dot(N,H),0.0),mix(12.0,80.0,1.0-uRoughness));
 vec3 highlightColor=mix(vec3(0.07),base,uMetallic)*sp*(0.27+uMetallic*0.7);
 // A traveling, view-dependent glimmer lives on the *actual* active GLB surfaces.
 // Two moving light bands prevent flat pulsation; the narrow bands read as metallic
 // yarn glints rather than a screen-space painted highlight.
 float shimmerWave=sin(dot(vP,vec3(2.9,1.15,1.7))*5.8-uTime*5.8);
 float shimmerBand=pow(max(0.0,shimmerWave),18.0);
 float counterBand=pow(max(0.0,sin(dot(vP,vec3(-1.5,3.1,1.25))*4.3+uTime*3.4)),27.0);
 float fresnel=pow(1.0-clamp(dot(N,V),0.0,1.0),2.1);
 float glimmer=uHighlight*(0.20*fresnel+0.76*shimmerBand+0.41*counterBand);
 vec3 glimmerTint=mix(vec3(1.16,0.77,0.38),vec3(0.51,0.81,1.02),0.5+0.5*sin(uTime*0.7+vP.x*1.3));
 float glow=uHighlight*(0.62+0.38*sin(uTime*3.8));
 vec3 linear=(diffuse+highlightColor)*(mix(0.55,1.0,uDim))
             +vec3(0.94,0.66,0.31)*glow*0.27
             +glimmerTint*glimmer*0.92;
 float distance=length(vP-uCamera);
 float fog=clamp((distance-12.5)/17.0,0.0,0.17);
 linear=mix(linear,vec3(0.14,0.18,0.17),fog);
 linear=linear/(linear+vec3(0.52));
 fragColor=vec4(pow(clamp(linear,0.0,1.0),vec3(1.0/2.2)),1.0);
}`;
function makeShader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function createProgram(gl){const p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,VERT));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
class Renderer{
 constructor(canvas){
   this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
   if(!this.gl)throw Error('This browser does not support WebGL 2.');
   const gl=this.gl; this.program=createProgram(gl);this.locations={};
   for(const n of ['uModel','uPV','uBase','uCamera','uRoughness','uMetallic','uHighlight','uDim','uTime','uTextureMode','uCloth','uWarpMode','uLiftMask','uPattern','uShedAmount'])this.locations[n]=gl.getUniformLocation(this.program,n);
   this.camera=[0,2.04,12.1];this.look=[0,1.87,-0.42];this.pv=M.identity();this.focusTarget=[0,1.85];this.focusSmooth=[0,1.85];this.manualPan=[0,0];this.zoomLevel=1;this.reducedMotion=!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
   this.nodes=[];this.byName=new Map();this.planes=[];this.size=[0,0];this.elapsed=0;
   this.materials=[];this.texture=null;this.clothCanvas=null;this.game=null;this.modelLoaded=false;
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 }
 load(b64){
   const {json,binary}=parseGLB(b64),gl=this.gl;
   this.materials=(json.materials||[]).map(m=>({name:m.name||'',base:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1],metallic:m.pbrMetallicRoughness?.metallicFactor||0,rough:m.pbrMetallicRoughness?.roughnessFactor??1}));
   const access=j=>{
     const a=json.accessors[j],v=json.bufferViews[a.bufferView];
     const num=a.type==='VEC3'?3:a.type==='VEC2'?2:a.type==='VEC4'?4:1;
     const off=(v.byteOffset||0)+(a.byteOffset||0),byteLen=a.count*num*(a.componentType===5126?4:a.componentType===5123?2:1);
     return {data:binary.slice(off,off+byteLen),num,type:a.componentType,count:a.count};
   };
   const makeGeometry=prim=>{
     const pos=access(prim.attributes.POSITION),normal=prim.attributes.NORMAL!=null?access(prim.attributes.NORMAL):null;
     const uv=prim.attributes.TEXCOORD_0!=null?access(prim.attributes.TEXCOORD_0):null,ind=access(prim.indices);
     const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffers=[];
     const att=(location,a)=>{
       if(a){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,a.data,gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,a.num,a.type,false,0,0);buffers.push(buf);}
       else {gl.disableVertexAttribArray(location);gl.vertexAttrib2f(location,0,0);}
     };
     att(0,pos);att(1,normal);att(2,uv);
     const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ind.data,gl.STATIC_DRAW);
     gl.bindVertexArray(null);
     return {vao,buffers,ibo,count:ind.count,type:ind.type,mat:prim.material||0,hasUV:!!uv};
   };
   const meshes=json.meshes.map(m=>m.primitives.map(makeGeometry));
   const transformNode=(i,parent)=>{
     const n=json.nodes[i],base=n.matrix?new Float32Array(n.matrix):M.compose(n.translation,n.rotation,n.scale);
     const world=M.mul(parent,base),obj={name:n.name||`node-${i}`,base,world,parent,parts:meshes[n.mesh]||[],transform:{dx:0,dy:0,dz:0,rx:0},hover:0,highlight:0,dim:1,visible:true};
     this.nodes.push(obj);this.byName.set(obj.name,obj);
     for(const child of n.children||[])transformNode(child,world);
   };
   for(const i of json.scenes[json.scene||0].nodes)transformNode(i,M.identity());
   this.modelLoaded=true;this.setupCamera();
   return {nodes:this.nodes.length,meshes:this.nodes.reduce((sum,n)=>sum+n.parts.length,0),materials:this.materials.length};
 }
 node(name){return this.byName.get(name)}
 setupCamera(){
   this.focusTarget=[0,1.85];this.focusSmooth=[0,1.85];this.resize();
 }
 focusOn(name){
   const v=this.center(name);
   if(v)this.focusTarget=[Math.max(-3.5,Math.min(3.5,v[0])),Math.max(.6,Math.min(3.25,v[1]))];
 }
 panPixels(dx,dy){
   const scale=0.0082*(this.zoomLevel||1);
   this.manualPan[0]=Math.max(-2.7,Math.min(2.7,this.manualPan[0]-dx*scale));
   this.manualPan[1]=Math.max(-1.15,Math.min(1.3,this.manualPan[1]+dy*scale));
 }
 zoomBy(delta){this.zoomLevel=Math.max(.76,Math.min(1.5,this.zoomLevel*Math.exp(delta*.0012)));}
 resetView(){this.manualPan=[0,0];this.zoomLevel=1;this.focusTarget=[0,1.85];this.focusSmooth=[0,1.85];}
 resize(){
   const dpr=Math.min(window.devicePixelRatio||1,1.6),w=Math.max(10,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(10,Math.floor(this.canvas.clientHeight*dpr));
   if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}
   const ratio=w/h;
   // Full-bleed composition: fill landscape displays with the loom.
   // Portrait layouts move the camera to the highlighted part instead of
   // zooming the whole workshop into a tiny strip with empty margins.
   const dist=(ratio>=1.12?Math.max(9.55,15.7/ratio):10.0)*(this.zoomLevel||1);
   const useFocus=ratio<1.12;
   const fx=(useFocus?this.focusSmooth[0]:0)+(this.manualPan?.[0]||0);
   const fy=(useFocus?this.focusSmooth[1]:1.88)+(this.manualPan?.[1]||0);
   this.camera=[fx,fy+.25,dist];this.look=[fx,fy,-.42];
   const projection=M.perspective(35*Math.PI/180,ratio,.1,70),view=M.lookAt(this.camera,this.look);
   this.pv=M.mul(projection,view);
 }
 updateScene(){
   for(const n of this.nodes){
     const t=n.transform;
     if(!t.dx&&!t.dy&&!t.dz&&!t.rx){n.world=M.mul(n.parent,n.base);continue;}
     // Preserve the original glTF orientation (especially the treadle/yarn spindle rotations).
     const baseNoT=new Float32Array(n.base);baseNoT[12]=baseNoT[13]=baseNoT[14]=0;
     n.world=M.mul(n.parent,M.mul(M.compose([n.base[12]+t.dx,n.base[13]+t.dy,n.base[14]+t.dz],[Math.sin(t.rx/2),0,0,Math.cos(t.rx/2)]),baseNoT));
   }
 }
 center(name){const n=this.node(name);if(!n)return null;return [n.world[12],n.world[13],n.world[14]];}
 project(p){
   if(!p)return null;const v=M.transform(this.pv,p);if(v[3]<=0.05)return null;
   return {x:(v[0]/v[3]*.5+.5)*this.canvas.clientWidth,y:(-.5*v[1]/v[3]+.5)*this.canvas.clientHeight,z:v[2]/v[3]};
 }
 setClothCanvas(can){
   const gl=this.gl;this.clothCanvas=can;
   if(!this.texture)this.texture=gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,can);
   gl.generateMipmap(gl.TEXTURE_2D);
 }
 updateCloth(){if(!this.texture||!this.clothCanvas)return;const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.clothCanvas);gl.generateMipmap(gl.TEXTURE_2D);}
 render(dt){
   const k=Math.min(1,Math.max(0,dt)*4.2);
   this.focusSmooth[0]+=(this.focusTarget[0]-this.focusSmooth[0])*k;
   this.focusSmooth[1]+=(this.focusTarget[1]-this.focusSmooth[1])*k;
   this.resize();this.elapsed+=dt;this.updateScene();
   const gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);
   gl.clearColor(.094,.128,.122,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(this.program);gl.uniformMatrix4fv(this.locations.uPV,false,this.pv);gl.uniform3fv(this.locations.uCamera,new Float32Array(this.camera));
   gl.uniform1f(this.locations.uTime,this.reducedMotion?0:this.elapsed);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.locations.uCloth,0);
   for(const n of this.nodes){if(!n.visible||!n.parts.length)continue;
     gl.uniformMatrix4fv(this.locations.uModel,false,n.world);
     gl.uniform1f(this.locations.uHighlight,n.highlight);gl.uniform1f(this.locations.uDim,n.dim);
     const warp=n.name==='91 individually spaced warp threads';
     gl.uniform1i(this.locations.uWarpMode,warp?1:0);gl.uniform1i(this.locations.uLiftMask,this.game?.liftMask||0);
     gl.uniform1i(this.locations.uPattern,this.game?.patternIndex||0);
     gl.uniform1f(this.locations.uShedAmount,this.game?.shedAmount||0);
     for(const part of n.parts){
       const material=this.materials[part.mat]||{base:[1,1,1,1],rough:1,metallic:0};
       gl.uniform4fv(this.locations.uBase,new Float32Array(material.base));gl.uniform1f(this.locations.uRoughness,material.rough);
       gl.uniform1f(this.locations.uMetallic,material.metallic);
       gl.uniform1i(this.locations.uTextureMode,n.name==='Partly woven cloth' && this.texture && part.hasUV?1:0);
       gl.bindVertexArray(part.vao);gl.drawElements(gl.TRIANGLES,part.count,part.type,0);
     }
   }
   gl.bindVertexArray(null);
 }
}
window.WovenEngine={Renderer,M,parseGLB};
})();
