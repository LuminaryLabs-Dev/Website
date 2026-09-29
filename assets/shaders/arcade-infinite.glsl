
// Analytic environment lighting: broad softboxes and a narrow reflected ribbon.
// This is a real-time material approximation, not path-traced reflection.
vec3 reflectedLight(vec3 r){
 float broad=pow(max(dot(r,normalize(vec3(-.5,.8,.4))),0.),12.);
 float strip=pow(max(dot(r,normalize(vec3(.8,.25,-.4))),0.),48.);
 return vec3(.08,.14,.21)*( .5+.5*r.y)+vec3(1.,.78,.52)*broad+vec3(.35,.70,1.)*strip;
}
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
 vec3 q=vec3(abs(p.x)-3.25,p.y,p.z);
 q.z=mod(q.z+2.4,4.8)-2.4;
 q/=1.15;q.xz=turn(.42)*q.xz;
 // Sculpted upright cabinets: tapered base, rear spine, recessed tilted display.
 float body=box3(q-vec3(.10,.67,0),vec3(.54,.67,.64))-.045;
 hit=closer(hit,vec2(body,3.));
 hit=closer(hit,vec2(box3(q-vec3(.42,1.95,0),vec3(.24,.78,.64))-.035,3.));
 vec3 upper=q-vec3(-.03,2.05,0);upper.xy=turn(-.24)*upper.xy;
 hit=closer(hit,vec2(box3(upper,vec3(.40,.57,.63))-.035,3.));
 // The bezel projects beyond the body; the display projects beyond the bezel.
 hit=closer(hit,vec2(box3(upper-vec3(-.435,0,0),vec3(.035,.48,.56))-.015,8.));
 hit=closer(hit,vec2(box3(upper-vec3(-.478,0,0),vec3(.012,.405,.47))-.012,4.));
 hit=closer(hit,vec2(box3(q-vec3(-.06,2.81,0),vec3(.65,.18,.70))-.045,3.));
 hit=closer(hit,vec2(box3(q-vec3(-.778,2.81,0),vec3(.012,.11,.58))-.008,5.));
 vec3 deck=q-vec3(-.43,1.40,0);deck.xy=turn(.10)*deck.xy;
 hit=closer(hit,vec2(box3(deck,vec3(.47,.07,.70))-.035,3.));
 hit=closer(hit,vec2(box3(q-vec3(-.64,1.55,-.27),vec3(.016,.10,.016)),8.));
 hit=closer(hit,vec2(length(q-vec3(-.64,1.67,-.27))-.065,6.));
 vec3 buttons=q-vec3(-.60,1.51,.18);buttons.z=mod(buttons.z+.10,.20)-.10;
 if(abs(q.z-.18)<.30)hit=closer(hit,vec2(length(buttons*vec3(1.,2.,1.))-.063,6.));
 hit=closer(hit,vec2(box3(q-vec3(-.485,.70,0.),vec3(.018,.25,.21))-.012,8.));
 vec3 beam=vec3(p.x,p.y-5.12,mod(p.z+2.4,4.8)-2.4);
 hit=closer(hit,vec2(box3(beam,vec3(4.5,.06,.10)),7.));
 return hit;
}
// Cabinet bounds exclude the central aisle without changing the scene distance.
vec2 marchScene(vec3 p){
 float x=p.x-route(p.z).x;
 vec2 room=vec2(min(p.y,5.4-p.y),1.);
 room=closer(room,vec2(5.3-abs(x),2.));
 vec3 beam=vec3(x,p.y-5.12,mod(p.z+2.4,4.8)-2.4);
 room=closer(room,vec2(box3(beam,vec3(4.5,.06,.10)),7.));
 if(1.75-abs(x)>room.x)return room;
 return scene(p);
}
vec3 palette(float id,vec3 p,vec3 n,vec3 rd,float aa){
 float cell=floor((p.z+2.4)/4.8);
 vec3 accent=.45+.40*cos(vec3(.1,2.1,4.2)+cell*1.73+step(0.,p.x)*1.4);
 vec3 q=vec3(abs(p.x-route(p.z).x)-3.25,p.y,mod(p.z+2.4,4.8)-2.4);
 q/=1.15;q.xz=turn(.42)*q.xz;
 vec3 upper=q-vec3(-.03,2.05,0);upper.xy=turn(-.24)*upper.xy;
 vec3 base=vec3(.08,.10,.13);
 if(id<1.5){
  vec2 grid=abs(fract(p.xz*.42)-.5);
  float seam=1.-smoothstep(.47-aa,.49,max(grid.x,grid.y));
  base=vec3(.095,.115,.14)*(.82+.18*seam);
  base+=accent*.16*exp(-abs(abs(p.x-route(p.z).x)-3.0)*1.6);
 }else if(id<2.5){base=vec3(.105,.145,.18);}
 else if(id<3.5){
  // Matte charcoal shells with painted side art and narrow colored edge trim.
  float side=smoothstep(.58,.65,abs(q.z));
  float stripe=1.-smoothstep(.035,.075+aa,abs(q.y*.26+q.x*.45-.52));
  base=mix(vec3(.07,.085,.11),accent*.25,side*.70);
  base+=accent*stripe*.45*side;
  float trim=1.-smoothstep(.018,.04+aa,abs(abs(q.z)-.65));
  base+=accent*trim*.32;
 }else if(id<4.5){
  // A different tiny game on each CRT: paddle court or neon invader formation.
  vec2 uv=vec2(upper.z/.47,upper.y/.405);
  float aaScreen=max(.025,aa*2.);
  vec2 ball=uv-vec2(.55*sin(iTime*.75+cell),.48*cos(iTime*.94+cell));
  float pong=1.-smoothstep(.055,.055+aaScreen,length(ball));
  float paddle=(1.-smoothstep(.025,.025+aaScreen,abs(abs(uv.x)-.80)))*(1.-smoothstep(.22,.22+aaScreen,abs(uv.y-.40*sin(iTime*.65+cell))));
  vec2 alien=abs(mod(uv*vec2(3.,2.)+vec2(0.,.12*sin(iTime+cell)),1.)-.5);
  float invaders=(1.-smoothstep(.23,.23+aaScreen,alien.x))*(1.-smoothstep(.16,.16+aaScreen,alien.y))*step(-.1,uv.y);
  float game=mix(pong+paddle,invaders,step(.5,fract(cell*.37)));
  float scan=1.-.07*sin(uv.y*36.)*(1.-smoothstep(.004,.025,aa));
  float glass=pow(max(dot(reflect(rd,n),normalize(vec3(.3,.85,-.4))),0.),42.);
  return (vec3(.012,.026,.042)+accent*(.12+1.8*game))*scan+vec3(.25,.40,.50)*glass+reflectedLight(reflect(rd,n))*.16;
 }else if(id<5.5){
  float bars=1.-smoothstep(.025,.05+aa,abs(mod(q.z+.04,.16)-.08));
  return accent*(.40+.75*bars)+vec3(.12);
 }else if(id<6.5){return accent*.9+vec3(.09);}
 else if(id<7.5){return vec3(.72,.86,1.);}
 else{float slot=1.-smoothstep(.008,.018+aa,abs(q.y-.81));return vec3(.035,.055,.075)+vec3(.30,.38,.42)*slot;}
 // Brushed case panels, bevel highlights and a restrained rough reflection.
 if(id>2.5&&id<3.5){
  float brushed=.5+.5*sin(p.y*35.+sin(p.z*10.));
  base*=.94+.06*brushed*(1.-smoothstep(.003,.015,aa));
 }
 float spill=exp(-abs(p.y-2.8)*1.6)*exp(-abs(abs(p.x-route(p.z).x)-2.85)*2.);
 base+=accent*.10*spill;
 float diff=max(dot(n,normalize(vec3(-.5,.85,-.35))),0.);
 float rim=pow(1.-max(dot(n,-rd),0.),3.);
 return reflectedLight(reflect(rd,n))*(id<1.5?.20:.07)+base*(.50+.95*diff)+accent*rim*.22+vec3(.20)*pow(max(dot(reflect(rd,n),normalize(vec3(.3,.8,-.5))),0.),36.);
}

// Tetrahedral normal uses four evaluations instead of six.
vec3 normalAt(vec3 p){vec2 e=vec2(.001732,-.001732);return normalize(e.xyy*scene(p+e.xyy).x+e.yyx*scene(p+e.yyx).x+e.yxy*scene(p+e.yxy).x+e.xxx*scene(p+e.xxx).x);}
void mainImage(out vec4 O,in vec2 f){
 vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
 float z=iTime*.38;
 vec3 ro=vec3(route(z)+vec2(0.,1.85),z);
 vec3 target=vec3(route(z+5.)+vec2(0.,1.85),z+5.);
 vec3 forward=normalize(target-ro),right=normalize(cross(vec3(0,1,0),forward)),up=cross(forward,right);
 // Center the aisle within the separate visual viewport.
 float shift=0.; // Text now lives above the visual, so use the full scene frame.
 vec3 rd=normalize(right*(uv.x-shift)+up*(uv.y+.04)+forward*1.95);
 float t=0.;vec2 hit=vec2(1.,0.);vec3 p=ro;
 for(int i=0;i<88;i++){
  p=ro+rd*t;hit=marchScene(p);
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
 col=mix(col,vec3(.105,.14,.18),1.-exp(-t*t*.00055));
 col=col/(1.+col);
 O=vec4(pow(max(col,0.),vec3(.72)),1.);
}
