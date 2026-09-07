// Standalone WebGL1 hero. Host supplies iTime, iResolution and iMouse.
// Bounded scene work; continuous coordinates, no camera resets.
uniform float uDetail;
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 route(float z){return vec2(.55*sin(z*.085),.28*sin(z*.11));}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 scene(vec3 p){
 vec2 center=route(p.z);p.xy-=center;
 float radial=length(p.xy),theta=atan(p.y,p.x);
 float d=100.;
 // Three nested branch scales with connected helical trunks around a clear lumen.
 for(int i=0;i<3;i++){
  float f=pow(2.,float(i));
  float angle=theta+p.z*.12+sin(p.z*.19)*.2;
  float a=mod(angle*4.*f+3.141593,6.283185)-3.141593;
  float radius=3.6+float(i)*.32+.20*sin(p.z*.6+theta*3.);
  vec2 q=vec2(radial-radius,a*radius/(4.*f));
  d=min(d,length(q)-(.40/f));
 }
 // Smaller transverse connections reveal the hierarchy between trunks.
 float twigZ=mod(p.z+2.,4.)-2.;
 float twig=length(vec2(radial-4.1,twigZ))-.065;
 d=min(d,twig);
 float chamber=5.2-radial;
 return closer(vec2(d,2.),vec2(chamber,1.));
}

vec3 palette(float id,vec3 p,vec3 n,vec3 rd,float aa){
 vec3 base=vec3(.22,.30,.32),accent=vec3(.32,.80,.55);
 float bands=.5+.5*sin(p.z*2.2+sin(p.x*3.)+p.y*2.);
 float fine=(.5+.5*sin(p.z*34.+p.y*12.))* (1.-smoothstep(.008,.035,aa));
 base*=.86+.14*bands;
 if(uDetail>.5)base*=.96+.04*fine;
 float diff=max(dot(n,normalize(vec3(-.35,.8,-.4))),0.);
 float facing=max(dot(n,-rd),0.);
 float rim=pow(1.-facing,3.);
 float vein=pow(max(0.,sin(p.z*.8+atan(p.y,p.x)*6.)),28.);
 vec3 col=base*(.58+.7*diff)+accent*(.13*rim+.18*vein);
 if(id>1.5)col+=accent*(.12+.14*rim);
 col+=vec3(.55,.48,.34)*pow(max(dot(reflect(rd,n),normalize(vec3(.2,.8,-.5))),0.),48.);
 // Surface seams carry warm light while the original branch hierarchy stays fixed.
 col+=vec3(.66,.37,.12)*vein*.16*max(dot(n,normalize(vec3(.3,.7,-.6))),0.);
 return col;
}

// Tetrahedral normal uses four evaluations instead of six.
vec3 normalAt(vec3 p){vec2 e=vec2(.001732,-.001732);return normalize(e.xyy*scene(p+e.xyy).x+e.yyx*scene(p+e.yyx).x+e.yxy*scene(p+e.yxy).x+e.xxx*scene(p+e.xxx).x);}
void mainImage(out vec4 O,in vec2 f){
 vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
 float z=iTime*.38;
 vec3 ro=vec3(route(z)+vec2(0.),z);
 vec3 target=vec3(route(z+5.)+vec2(0.),z+5.);
 vec3 forward=normalize(target-ro),right=normalize(cross(vec3(0,1,0),forward)),up=cross(forward,right);
 // Optical framing keeps the main reveal to the right of desktop text.
 float shift=0.; // Text now lives above the visual, so use the full scene frame.
 vec3 rd=normalize(right*(uv.x-shift)+up*(uv.y+.04)+forward*1.65);
 float t=0.;vec2 hit=vec2(1.,0.);vec3 p=ro;
 for(int i=0;i<88;i++){
  p=ro+rd*t;hit=scene(p);
  if(hit.x<.0025||t>48.)break;
  t+=max(hit.x*.68,.001);
 }
 vec3 col=vec3(.07,.105,.14);
 if(hit.x<.012&&t<48.){
  vec3 n=normalAt(p);float aa=clamp(t/iResolution.y,.001,.08);
  col=palette(hit.y,p,n,rd,aa);
  float ao=clamp(scene(p+n*.16).x/.16,.35,1.);
  col*=.78+.22*ao;
 }
 // Physical distance haze, no screen-space vignette or dimming mask.
 col=mix(col,vec3(.075,.11,.15),1.-exp(-t*t*.00055));
 col=col/(1.+col);
 O=vec4(pow(max(col,0.),vec3(.72)),1.);
}
