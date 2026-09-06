// Standalone WebGL1 hero. Host supplies iTime, iResolution and iMouse.
// Bounded scene work; continuous coordinates, no camera resets.
uniform float uDetail;
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 route(float z){return vec2(.55*sin(z*.085),.28*sin(z*.11));}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 scene(vec3 p){
 p.xy-=route(p.z);
 float radius=3.7+.65*sin(p.z*.32);
 float theta=atan(p.y,p.x);
 float radial=length(p.xy);
 float shell=radius-radial;
 float spiral=theta*8.+p.z*1.1;
 float ribs=abs(sin(spiral))*.20;
 float coarse=shell-ribs;
 float fine=.025*cos(theta*48.+p.z*6.);
 return vec2(coarse+fine,1.);
}

vec3 palette(float id,vec3 p,vec3 n,vec3 rd,float aa){
 vec3 base=vec3(.27,.30,.38),accent=vec3(.50,.66,.94);
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
 col+=vec3(.28)*pow(max(dot(reflect(rd,n),normalize(vec3(.2,.8,-.5))),0.),48.);
 return col;
}

vec3 normalAt(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));}
void mainImage(out vec4 O,in vec2 f){
 vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
 float z=iTime*.38;
 vec3 ro=vec3(route(z)+vec2(0.),z);
 vec3 target=vec3(route(z+5.)+vec2(0.),z+5.);
 vec3 forward=normalize(target-ro),right=normalize(cross(vec3(0,1,0),forward)),up=cross(forward,right);
 // Optical framing keeps the main reveal to the right of desktop text.
 float shift=iResolution.x/iResolution.y>1.1?.30:0.;
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
