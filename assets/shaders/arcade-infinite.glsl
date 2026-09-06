// Standalone WebGL1 hero. Host supplies iTime, iResolution and iMouse.
// Bounded scene work; continuous coordinates, no camera resets.
uniform float uDetail;
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 route(float z){return vec2(.55*sin(z*.085),.28*sin(z*.11));}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 scene(vec3 p){
 p.x-=route(p.z).x;
 vec2 hit=vec2(min(p.y,5.4-p.y),1.);
 hit=closer(hit,vec2(5.3-abs(p.x),2.));
 vec3 q=vec3(abs(p.x)-3.55,p.y,p.z);
 q.z=mod(q.z+1.7,3.4)-1.7;
 // Cabinets face the central aisle. Front fascia, angled screen and controls.
 float body=box3(q-vec3(0,1.02,0),vec3(.69,1.02,.66))-.055;
 hit=closer(hit,vec2(body,3.));
 vec3 upper=q-vec3(.10,2.12,0);upper.xy=turn(-.12)*upper.xy;
 hit=closer(hit,vec2(box3(upper,vec3(.64,.64,.70))-.04,3.));
 vec3 screen=upper-vec3(-.65,0,0);
 hit=closer(hit,vec2(box3(screen,vec3(.028,.43,.52))-.015,4.));
 hit=closer(hit,vec2(box3(q-vec3(-.20,2.94,0),vec3(.72,.19,.73))-.05,5.));
 hit=closer(hit,vec2(box3(q-vec3(-.48,1.53,0),vec3(.48,.085,.73))-.025,3.));
 hit=closer(hit,vec2(length(q-vec3(-.68,1.78,-.27))-.08,6.));
 vec3 buttons=q-vec3(-.62,1.67,.22);buttons.z=mod(buttons.z+.12,.24)-.12;
 if(abs(q.z-.22)<.36)hit=closer(hit,vec2(length(buttons)-.062,6.));
 hit=closer(hit,vec2(box3(q-vec3(-.754,.73,0.),vec3(.025,.28,.25))-.008,8.));
 vec3 beam=vec3(p.x,p.y-5.12,mod(p.z+1.7,3.4)-1.7);
 hit=closer(hit,vec2(box3(beam,vec3(4.5,.06,.10)),7.));
 return hit;
}
vec3 palette(float id,vec3 p,vec3 n,vec3 rd,float aa){
 float cell=floor((p.z+1.7)/3.4);
 vec3 accent=.48+.42*cos(vec3(.1,2.1,4.2)+cell*1.73+step(0.,p.x)*1.4);
 vec3 base=vec3(.15,.18,.22);
 if(id<1.5){
  vec2 grid=abs(fract(p.xz*.42)-.5);
  float seam=1.-smoothstep(.47-aa,.49,max(grid.x,grid.y));
  base=vec3(.12,.15,.19)*(.75+.25*seam);
  base+=accent*.24*exp(-abs(abs(p.x-route(p.z).x)-3.0)*1.6)*(0.5+0.5*cos(p.z*1.848));
 }else if(id<2.5){base=vec3(.17,.22,.26);}
 else if(id<3.5){base=mix(vec3(.12,.16,.21),accent*.42,smoothstep(.61,.69,abs(mod(p.z+1.7,3.4)-1.7)));}
 else if(id<4.5){
  vec2 uv=vec2(mod(p.z+1.7,3.4)-1.7,p.y-2.12);
  float ring=1.-smoothstep(.025,.05,abs(length(uv*vec2(1.,1.2))-.24-.04*sin(iTime*.6+cell)));
  float bars=step(.65,sin(uv.x*15.+cell))*step(abs(uv.y+.30),.03);
  return accent*(.3+.8*ring+.35*bars)+vec3(.08,.13,.19);
 }else if(id<5.5){return accent*.72+vec3(.18);}
 else if(id<6.5){return accent*.75+vec3(.08);}
 else if(id<7.5){return vec3(.48,.65,.72);}
 else{float slot=1.-smoothstep(.016,.026,abs(p.y-.81));return vec3(.10,.13,.16)+accent*.16*slot;}
 // Brushed case panels, bevel highlights and a restrained rough reflection.
 if(id>2.5&&id<3.5){
  float brushed=.5+.5*sin(p.y*100.+sin(p.z*25.));
  base*=.94+.06*brushed*(1.-smoothstep(.003,.015,aa));
 }
 float diff=max(dot(n,normalize(vec3(-.5,.85,-.35))),0.);
 float rim=pow(1.-max(dot(n,-rd),0.),3.);
 return base*(.62+.85*diff)+accent*rim*.27+vec3(.20)*pow(max(dot(reflect(rd,n),normalize(vec3(.3,.8,-.5))),0.),36.);
}

vec3 normalAt(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));}
void mainImage(out vec4 O,in vec2 f){
 vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
 float z=iTime*.38;
 vec3 ro=vec3(route(z)+vec2(0.,1.85),z);
 vec3 target=vec3(route(z+5.)+vec2(0.,1.85),z+5.);
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
