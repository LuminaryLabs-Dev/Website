/* WOVEN V12 — dependency-free GLB / WebGL2 workshop renderer.
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
uniform float uFellY;uniform float uWeftProgress;uniform float uWeftY;uniform float uWeftStartY;uniform float uWeftDirection;uniform int uShaft;
out vec3 vN;out vec3 vP;out vec3 vLocal;out vec2 vUV;
int shaftOf(float x){float slot=clamp(floor((x+1.63)/(3.26/90.0)+.5),0.0,90.0);return uPattern==2?int(mod(floor(slot/2.0),2.0)):int(mod(slot,4.0));}
float warpShift(float y,int shaft){
 // Never translate the whole warp. Preserve its anchor at the fell and top beam.
 float envelope=smoothstep(0.0,.18,y-uFellY)*smoothstep(0.0,.65,2.84-y);
 bool raised=(uLiftMask & (1<<shaft))!=0;
 return uShedAmount*envelope*(raised?.145:-.145);
}
void main(){vec3 p=aPosition;vec3 normal=aNormal;
 if(uWarpMode==1){
   int shaft=shaftOf(p.x);float dy=.002;
   float slope=(warpShift(p.y+dy,shaft)-warpShift(p.y-dy,shaft))/(2.0*dy);
   normal=normalize(vec3(normal.x,normal.y-slope*normal.z,normal.z));p.z+=warpShift(p.y,shaft);
 }else if(uWarpMode==2){ // unbroken weft across the actual open shed
   float t=clamp(p.x,0.0,1.0),along=t*uWeftProgress;
   p.x=uWeftDirection*(-1.63+3.26*along);
   p.y+=uWeftY-.014*sin(3.14159265*t)*uWeftProgress*clamp((uWeftY-uWeftStartY)/.45,0.0,1.0);p.z+=.18;
   normal.x*=uWeftDirection;
 }else if(uWarpMode==3){ // selvedge connection to the previous packed pick
   p.x+=-uWeftDirection*1.63;p.y=mix(uWeftStartY,uWeftY,p.y);p.z+=.18;
 }else if(uWarpMode==4){ // shaft eyelets follow the identical warp separation function
   int shaft=shaftOf(p.x);p.y+=float(shaft)*.10;p.z+=warpShift(2.22+float(shaft)*.10,shaft);
 }else if(uWarpMode==5){
   int shaft=uShaft;if(uPattern!=2||shaft<2)p.z+=warpShift(2.22+float(shaft)*.10,shaft);
 }
 vec4 world=uModel*vec4(p,1.0);vP=world.xyz;vLocal=aPosition;vN=normalize(transpose(inverse(mat3(uModel)))*normal);vUV=aUV;gl_Position=uPV*world;}
`;
const FRAG=`#version 300 es
precision highp float;
in vec3 vN;in vec3 vP;in vec3 vLocal;in vec2 vUV;
uniform vec4 uBase;uniform vec3 uCamera;uniform float uRoughness;uniform float uMetallic;
uniform float uHighlight;uniform float uDim;uniform float uTime;uniform int uTextureMode;uniform sampler2D uCloth;
uniform int uMaterialKind;uniform int uGrainAxis;uniform float uPickFraction;
out vec4 fragColor;
const float PI=3.14159265;
// Analytic materials: object-local grain for moving parts, world coordinates for architectural surfaces.
float hash31(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float band(float x){return sin(x)*clamp(1.0-fwidth(x)/3.14159,0.0,1.0);}
float softBox(vec2 p,vec2 c,vec2 halfSize,float softness){vec2 q=abs(p-c)-halfSize;float sd=length(max(q,0.0))+min(max(q.x,q.y),0.0);return 1.0-smoothstep(-softness,softness,sd);}
float boxOcclusion(vec3 p,vec3 light,vec3 c,vec3 h){
 vec3 ray=light-p;vec3 dir=normalize(ray);vec3 inv=mix(vec3(-1.0),vec3(1.0),step(vec3(0.0),dir))/max(abs(dir),vec3(.00001));
 vec3 a=(c-h-p)*inv,b=(c+h-p)*inv;vec3 near=min(a,b),far=max(a,b);
 float tn=max(max(near.x,near.y),near.z),tf=min(min(far.x,far.y),far.z);
 float edge=min(tf-tn,min(tf-.008,length(ray)-tn));return smoothstep(-.16,.09,edge);
}
float staticOccluders(vec3 p,vec3 light){float occ=0.0;
 occ=max(occ,boxOcclusion(p,light,vec3(-1.98,1.48,.12),vec3(.135,1.415,.17)));
 occ=max(occ,boxOcclusion(p,light,vec3(1.98,1.48,.12),vec3(.135,1.415,.17)));
 occ=max(occ,boxOcclusion(p,light,vec3(0,.44,.04),vec3(1.93,.105,.105)));
 occ=max(occ,boxOcclusion(p,light,vec3(0,2.69,.04),vec3(1.93,.105,.105)));
 occ=max(occ,boxOcclusion(p,light,vec3(0,2.99,.03),vec3(1.83,.09,.09)));
 occ=max(occ,boxOcclusion(p,light,vec3(-3.24,.31,.10),vec3(.69,.24,.59))*.78);
 return occ;
}
float roomKeyVisibility(vec3 p){
 // Three fixed samples of a broad light; only the room's static receiving surfaces use this approximation.
 return 1.0-.60*(staticOccluders(p,vec3(-4.6,5.0,4.6))*.30+staticOccluders(p,vec3(-3.9,4.6,3.9))*.40+staticOccluders(p,vec3(-3.0,4.2,4.2))*.30);
}
float aoFloor(vec3 p){vec2 q=p.xz;float a=0.0;
 a=max(a,softBox(q,vec2(-1.98,.22),vec2(.25,.45),.22));a=max(a,softBox(q,vec2(1.98,.22),vec2(.25,.45),.22));
 a=max(a,softBox(q,vec2(-3.24,.10),vec2(.68,.57),.35));
 for(int i=0;i<4;i++)a=max(a,.65*softBox(q,vec2(-.80+float(i)*.53,.72),vec2(.16,.53),.12));
 a=max(a,.40*softBox(q,vec2(.2,-.06),vec2(2.2,.45),.48));
 return (1.0-.47*a)*(1.0-.35*exp(-max(0.0,p.z+.62)*6.0));
}
float aoWall(vec3 p){vec2 q=p.xy;float a=0.0;
 a=max(a,softBox(q,vec2(-1.70,1.43),vec2(.15,1.43),.26));a=max(a,softBox(q,vec2(2.25,1.43),vec2(.15,1.43),.26));
 for(int i=0;i<3;i++)a=max(a,.73*softBox(q,vec2(3.24,.76+float(i)*1.04),vec2(.57,.47),.14));
 a=max(a,.7*softBox(q,vec2(-3.16,2.68),vec2(.73,1.02),.20));
 a=max(a,.64*softBox(q,vec2(.28,2.61),vec2(1.9,.105),.19));
 a=max(a,.48*softBox(q,vec2(.3,1.42),vec2(1.9,.11),.24));
 a=max(a,.34*softBox(q,vec2(.25,.82),vec2(1.67,.33),.24));
 a=max(a,.55*softBox(q,vec2(-3.16,.88),vec2(.76,.24),.18));
 return (1.0-.43*a)*(1.0-.25*exp(-max(0.0,p.y)*4.8));
}
// Physically inspired, bounded roughness/metallic BRDF with energy-conserving Fresnel.
vec3 brdf(vec3 N,vec3 V,vec3 L,vec3 base,float rough,float metal){vec3 H=normalize(L+V);float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.001),nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);float a=rough*rough,a2=a*a;float d=a2/(PI*pow(max(.0001,nh*nh*(a2-1.0)+1.0),2.0));float k=pow(rough+1.0,2.0)*.125;float vis=nl/(nl*(1.0-k)+k)*nv/(nv*(1.0-k)+k);vec3 f0=mix(vec3(.04),base,metal),f=f0+(1.0-f0)*pow(1.0-vh,5.0);return ((1.0-f)*(1.0-metal)*base/PI + d*vis*f/max(.004,4.0*nl*nv))*nl;}
void main(){
 vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
 vec3 V=normalize(uCamera-vP);vec3 base=uBase.rgb;float rough=clamp(uRoughness,.22,.98),metal=uMetallic,height=0.0,ao=1.0;
 int kind=uMaterialKind;
 if(uTextureMode==1){if(vUV.y>uPickFraction+.0001)discard;base=pow(texture(uCloth,vUV).rgb,vec3(2.2));}
 if(kind==1||kind==2){
   vec3 p=vLocal;vec3 grain=uGrainAxis==0?p.yzx:(uGrainAxis==2?p.xyz:p.xzy);
   if(kind==2){grain=vec3(vP.x,vP.y,vP.z);float lane=(vP.x+4.0)/.48,board=floor(lane);float seam=min(fract(lane),1.0-fract(lane));float joint=abs(fract((vP.z+hash31(vec3(board,4.0,1.0))*2.3)/2.3)-.5);base*=mix(.73,1.20,hash31(vec3(board,7.0,3.0)));base*=mix(.45,1.0,smoothstep(.006,.026+fwidth(lane),seam));base*=mix(.65,1.0,smoothstep(.002,.009+fwidth(joint),joint));grain.x+=board*.47;}
   float sway=noise3(grain*vec3(3.2,3.2,.65));float pores=noise3(grain*vec3(113.0,113.0,8.0));
   float warp=noise3(grain*vec3(11.0,11.0,1.15));
   float ring=(grain.x+grain.y*.48+sway*.12+warp*.037)*118.0;
   float growth=.5+.5*band(ring);float fine=.5+.5*band((grain.x-grain.y*.33+sway*.045)*350.0);
   float streak=noise3(grain*vec3(39.0,39.0,1.45));float broad=noise3(grain*vec3(7.0,7.0,.55));
   float tint=.68+.17*growth+.21*streak+.10*broad+.055*fine-.06*pores;
   base*=tint;rough=clamp(rough+.07*(1.0-growth),.35,.91);height=(growth*.45+pores*.55)*.00085;
   if(kind==2){ao=aoFloor(vP);}
 }else if(kind==3){ // sage plaster, subtle mineral roughness
   float broad=noise3(vP*2.8), grit=noise3(vP*65.0);base*=.81+.28*broad+.065*grit;height=grit*.0006;ao=aoWall(vP);
 }else if(kind==4){ // burnished brass / iron, worn recess variation
   float mott=noise3(vLocal*47.0),patina=noise3(vLocal*12.0);base*=.76+.25*mott+.12*patina;rough=clamp(rough+.17*(1.0-patina),.28,.74);height=mott*.0007;
 }else if(kind==5){ // dyed yarn, warp and woven samples
   float twist=.5+.5*band(dot(vLocal,vec3(88.0,151.0,107.0)));
   float fuzz=noise3(vLocal*147.0);base*=.86+.17*twist+.12*fuzz;height=(twist*.65+fuzz*.35)*.00075;rough=max(.83,rough);
   if(uTextureMode==1){vec2 cell=vUV*vec2(91.0,16.0);vec2 sub=fract(cell);float crossing=.5+.5*band((sub.x+sub.y)*19.0);base*=.91+.12*crossing;height+=crossing*.0005;}
 }else if(kind==10){
   float wind=.5+.5*band(vLocal.y*520.0+atan(vLocal.z,vLocal.x+1e-6)*2.0);
   float wool=noise3(vLocal*vec3(180.0,200.0,180.0));
   base*=.83+.21*wind+.10*wool;rough=.91;height=(wind*.7+wool*.3)*.00065;
 }else if(kind==6){float theta=atan(vLocal.z,vLocal.x);float course=floor((vLocal.y+.24)*12.5);float woven=.5+.5*band(theta*24.0+course*PI);float fibers=noise3(vLocal*vec3(95.0,160.0,30.0));base*=.71+.23*woven+.12*fibers;rough=.78;height=(woven*.5+fibers*.5)*.0007;}
 else if(kind==7){float paper=noise3(vLocal*70.0);base*=.93+.10*paper;height=paper*.0007;rough=.88;}
 // Screen-derivative height field; uses actual surface positions and no external normal textures.
 vec3 dpdx=dFdx(vP),dpdy=dFdy(vP);vec3 r1=cross(dpdy,N),r2=cross(N,dpdx);float det=dot(dpdx,r1);
 if(abs(det)>1e-10){vec3 grad=sign(det)*(dFdx(height)*r1+dFdy(height)*r2);N=normalize(abs(det)*N-grad);}
 // The visible window supplies a broad warm key, with cool skylight and floor bounce.
 vec3 key=normalize(vec3(-3.9,4.6,3.9)-vP);vec3 fill=normalize(vec3(4.2,2.9,4.5)-vP);vec3 rim=normalize(vec3(-1.6,4.8,-2.5)-vP);
 float falloff=.77+.23*exp(-length(vP-vec3(-3.2,2.7,0.0))*.28);
 float hemi=.38+.62*max(N.y,0.0);vec3 ambient=mix(vec3(.115,.10,.075),vec3(.25,.29,.32),hemi);
 vec3 lit=base*ambient*(1.0-metal*.65)*ao;
 float keyVisibility=(kind==2||kind==3)?roomKeyVisibility(vP):1.0;
 lit+=brdf(N,V,key,base,rough,metal)*vec3(3.85,3.12,2.24)*falloff*ao*keyVisibility;
 lit+=brdf(N,V,fill,base,rough,metal)*vec3(.81,1.02,1.22)*ao;
 lit+=brdf(N,V,rim,base,rough,metal)*vec3(.69,.64,.49)*ao;
 if(kind==5||kind==10){lit+=base*pow(1.0-clamp(dot(N,V),0.0,1.0),3.0)*.105;}
 if(kind==8){float sky=smoothstep(1.6,3.7,vP.y);lit=mix(vec3(.75,.66,.47),vec3(.35,.48,.59),sky);float glassLine=(vP.x+3.24)+(vP.y-2.73)*.25;float refl=exp(-glassLine*glassLine*18.0);lit+=vec3(.065,.075,.075)*refl;}
 if(kind==9){lit=base*vec3(.62,.75,.76)+vec3(.07,.09,.085);}
 // Warm window illumination across the left side of the room; softer towards the samples.
 if(kind==3){float pool=exp(-dot((vP.xy-vec2(-2.8,2.75))*vec2(.40,.56),(vP.xy-vec2(-2.8,2.75))*vec2(.40,.56)));lit*=.73+.46*pool;}
 if(kind==2){vec2 glow=(vP.xz-vec2(-2.5,.9))*vec2(.40,.55);lit*=.82+.34*exp(-dot(glow,glow));}
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
 vec3 linear=(lit)*(mix(0.55,1.0,uDim))
             +vec3(0.94,0.66,0.31)*glow*0.27
             +glimmerTint*glimmer*0.92;

 float distance=length(vP-uCamera);
 float fog=clamp((distance-12.5)/17.0,0.0,0.12);
 linear=mix(linear,vec3(.065,.082,.08),fog);
 // Preserve highlight detail and retain contrast (film-like exposure, no full-screen overlay).
 linear=max(linear,vec3(0.0));linear=linear/(linear+vec3(.72));
 fragColor=vec4(pow(clamp(linear,0.0,1.0),vec3(1.0/2.2)),1.0);
}`;
function materialKind(name){
 if(name==='Walnut plank flooring')return 2;
 if(name==='Muted sage plaster')return 3;
 if(/brass|iron/i.test(name))return 4;
 if(/willow/i.test(name))return 6;
 if(/parchment/i.test(name))return 7;
 if(/Hazy window sky/.test(name))return 8;
 if(/haze|distant|drifting smoke|factory dusty|mill facade/i.test(name))return 9;
 if(/oak|walnut|endgrain/i.test(name))return 1;
 if(/reference yarn|madder yarn/i.test(name))return 10;
 if(/yarn|linen|cloth|weave|fiber|thread/i.test(name))return 5;
 return 0;
}
function makeShader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function createProgram(gl){const p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,VERT));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
class Renderer{
 constructor(canvas){
   this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
   if(!this.gl)throw Error('This browser does not support WebGL 2.');
   const gl=this.gl; this.program=createProgram(gl);this.locations={};
   for(const n of ['uModel','uPV','uBase','uCamera','uRoughness','uMetallic','uHighlight','uDim','uTime','uTextureMode','uCloth','uWarpMode','uLiftMask','uPattern','uShedAmount','uMaterialKind','uGrainAxis','uFellY','uWeftProgress','uWeftY','uWeftStartY','uWeftDirection','uShaft','uPickFraction'])this.locations[n]=gl.getUniformLocation(this.program,n);
   this.camera=[0,2.04,12.1];this.look=[0,1.87,-0.42];this.pv=M.identity();this.focusTarget=[0,1.85];this.focusSmooth=[0,1.85];this.manualPan=[0,0];this.zoomLevel=1;this.reducedMotion=!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
   this.nodes=[];this.byName=new Map();this.planes=[];this.size=[0,0];this.elapsed=0;
   this.materials=[];this.texture=null;this.clothCanvas=null;this.game=null;this.modelLoaded=false;
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 }
 load(b64){
   const {json,binary}=parseGLB(b64),gl=this.gl;
   this.materials=(json.materials||[]).map(m=>({name:m.name||'',kind:materialKind(m.name||''),base:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1],metallic:m.pbrMetallicRoughness?.metallicFactor||0,rough:m.pbrMetallicRoughness?.roughnessFactor??1}));
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
     const bounds=json.accessors[prim.attributes.POSITION],size=(bounds.max||[1,1,1]).map((v,i)=>v-(bounds.min||[0,0,0])[i]);
     const grainAxis=size.indexOf(Math.max(...size));
     return {vao,buffers,ibo,count:ind.count,type:ind.type,mat:prim.material||0,hasUV:!!uv,grainAxis};
   };
   const meshes=json.meshes.map(m=>m.primitives.map(makeGeometry));
   const transformNode=(i,parent)=>{
     const n=json.nodes[i];let base=n.matrix?new Float32Array(n.matrix):M.compose(n.translation,n.rotation,n.scale);
     // Expand only the noninteractive architectural planes, eliminating the floating-stage edges.
     // Keep the floor top and wall front surfaces in their original positions.
     if(n.name==='Back wall'){base=M.mul(base,M.compose([0,1.4,0],[0,0,0,1],[1.75,1.70,1]));}
     if(n.name==='Floor'){base=M.mul(base,M.compose([0,0,1.4],[0,0,0,1],[1.85,1,1.7]));}
     if(n.name==='Wall baseboard'||n.name==='Baseboard trim'){base=M.mul(base,M.compose([0,0,0],[0,0,0,1],[1.8,1,1]));}
     const world=M.mul(parent,base),obj={name:n.name||`node-${i}`,base,world,parent,parts:meshes[n.mesh]||[],transform:{dx:0,dy:0,dz:0,rx:0},hover:0,highlight:0,dim:1,visible:!n.name?.startsWith('Floorboard seam')};
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
   this.camera=[fx+(useFocus?.20:.83),fy+.52,dist];this.look=[fx,fy,-.42];
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
   const k=this.reducedMotion?1:Math.min(1,Math.max(0,dt)*4.2);
   this.focusSmooth[0]+=(this.focusTarget[0]-this.focusSmooth[0])*k;
   this.focusSmooth[1]+=(this.focusTarget[1]-this.focusSmooth[1])*k;
   this.resize();this.elapsed+=dt;this.updateScene();
   const gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);
   gl.clearColor(.075,.096,.088,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(this.program);gl.uniformMatrix4fv(this.locations.uPV,false,this.pv);gl.uniform3fv(this.locations.uCamera,new Float32Array(this.camera));
   gl.uniform1f(this.locations.uTime,this.reducedMotion?0:this.elapsed);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.locations.uCloth,0);
   const game=this.game,weft=game?.weft;
   gl.uniform1f(this.locations.uFellY,.57+.58*(game?.pick||0)/16);gl.uniform1f(this.locations.uPickFraction,(game?.pick||0)/16);
   gl.uniform1f(this.locations.uWeftProgress,weft?.progress||0);gl.uniform1f(this.locations.uWeftY,weft?.y??1.34);gl.uniform1f(this.locations.uWeftStartY,weft?.startY??.57);gl.uniform1f(this.locations.uWeftDirection,weft?.direction??1);
   for(const n of this.nodes){if(!n.visible||!n.parts.length)continue;
     const live=n.name==='V12 pending weft'||n.name==='V12 selvedge lead';
     if(live&&(!weft||weft.progress<.002))continue;
     if(n.name==='Partly woven cloth'&&!(game?.pick>0))continue;
     gl.uniformMatrix4fv(this.locations.uModel,false,n.world);
     gl.uniform1f(this.locations.uHighlight,n.highlight);gl.uniform1f(this.locations.uDim,n.dim);
     const warp=n.name==='91 individually spaced warp threads';
     const mode=warp?1:n.name==='V12 pending weft'?2:n.name==='V12 selvedge lead'?3:n.name==='V12 shaft guide eyes'?4:n.name.startsWith('V12 shaft rail ')?5:0;
     gl.uniform1i(this.locations.uWarpMode,mode);gl.uniform1i(this.locations.uShaft,mode===5?Number(n.name.slice(-1)):0);gl.uniform1i(this.locations.uLiftMask,this.game?.liftMask||0);
     gl.uniform1i(this.locations.uPattern,this.game?.patternIndex||0);
     gl.uniform1f(this.locations.uShedAmount,this.game?.shedAmount||0);
     for(const part of n.parts){
       const material=this.materials[part.mat]||{base:[1,1,1,1],rough:1,metallic:0};
       gl.uniform4fv(this.locations.uBase,new Float32Array(live?[...weft.color,1]:material.base));gl.uniform1f(this.locations.uRoughness,material.rough);
       gl.uniform1f(this.locations.uMetallic,material.metallic);
       gl.uniform1i(this.locations.uMaterialKind,material.kind||0);gl.uniform1i(this.locations.uGrainAxis,part.grainAxis??1);
       gl.uniform1i(this.locations.uTextureMode,n.name==='Partly woven cloth' && this.texture && part.hasUV?1:0);
       gl.bindVertexArray(part.vao);gl.drawElements(gl.TRIANGLES,part.count,part.type,0);
     }
   }
   gl.bindVertexArray(null);
 }
}
window.WovenEngine={Renderer,M,parseGLB};
})();
