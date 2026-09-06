// Blue-gray shell chambers. Fixed world, C2 waypoint route; no screen-space wash.
uniform float uDetail;
float hash(float n){n=fract(n*.1031);n*=n+33.33;n*=n+n;return fract(n);}
float ease(float t){return t*t*t*(t*(t*6.-15.)+10.);}
vec2 waypoint(float n){return (vec2(hash(n),hash(n+73.))-.5)*vec2(5.6,3.8);}
vec2 route(float z){float k=floor(z/18.),f=fract(z/18.);return mix(waypoint(k),waypoint(k+1.),ease(f));}
// One local interval, no global nearest-path search. Distance scaled conservatively.
vec3 shape(vec3 p){
vec2 q=p.xy-route(p.z);float k=floor(p.z/18.),f=fract(p.z/18.);
float swell=sin(3.141593*f);swell*=swell;
float wide=1.25+.65*hash(k+21.);
float a=atan(q.y,q.x),r=length(q/vec2(1.,1.08));
float side=pow(max(0.,cos(a-(hash(k+9.)-.5)*4.)),4.);
float radius=2.85+swell*(wide+.85*side);
float phase=a*5.+.32*sin(p.z*.14)+.22*sin(a*3.+p.z*.08);
float rib=pow(.5+.5*cos(phase),10.);
float lip=pow(.5+.5*cos(p.z*.349066),24.);
return vec3((radius-r-.16*rib-.12*lip)*.46,rib,swell);
}
float field(vec3 p){return shape(p).x;}
vec3 normalAt(vec3 p){vec2 e=vec2(.003,-.003);return normalize(e.xyy*field(p+e.xyy)+e.yyx*field(p+e.yyx)+e.yxy*field(p+e.yxy)+e.xxx*field(p+e.xxx));}
// Monotonic distance clock. Mild pace variation, independent of frame rate.
vec3 cameraAt(float t){float z=t*.54+.18*sin(t*.09);return vec3(route(z)+vec2(.20*sin(z*.13),.13*sin(z*.19)),z);}
void mainImage(out vec4 O,in vec2 f){
vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
vec3 ro=cameraAt(iTime),target=cameraAt(iTime+3.4);
vec3 fw=normalize(target-ro),right=normalize(cross(vec3(0,1,0),fw)),up=cross(fw,right);
float shift=iResolution.x/iResolution.y>1.1?.30:0.;
vec3 rd=normalize(right*(uv.x-shift)+up*(uv.y+.04)+fw*1.65);
float t=0.,d=1.;vec3 p=ro;
for(int i=0;i<80;i++){p=ro+rd*t;d=field(p);if(d<.002+t*.0012||t>52.)break;t+=max(d,.001);}
vec3 col=vec3(.045,.065,.095);
if(t<52.){
vec3 n=normalAt(p),s=shape(p);vec2 q=p.xy-route(p.z);
float facing=max(dot(n,-rd),0.),rib=s.y;
vec3 lamp=normalize(vec3(.55,.8,.25));float dif=max(dot(n,lamp),0.);
float rim=pow(1.-facing,3.),spec=pow(max(dot(reflect(rd,n),lamp),0.),36.);
float grain=.5+.5*sin(p.z*23.+q.y*19.+sin(q.x*11.));
float detail=uDetail>.5?(grain-.5)*.018*(1.-smoothstep(5.,20.,t)):0.;
vec3 base=mix(vec3(.12,.16,.23),vec3(.32,.39,.49),s.z*.5+.25);
col=base*(.32+.85*dif+detail)*(1.-.22*rib)+vec3(.28,.42,.62)*rim*.24+spec*vec3(.55,.66,.8)*.38;
float seam=pow(.5+.5*cos(atan(q.y,q.x)*5.+.32*sin(p.z*.14)+.22*sin(atan(q.y,q.x)*3.+p.z*.08)),60.);
float ck=floor(p.z/18.);float warm=.5+.5*mix(sin(ck*2.3),sin((ck+1.)*2.3),ease(fract(p.z/18.)));
vec3 glow=mix(vec3(.30,.66,.92),vec3(.92,.62,.31),warm*.55);
col+=glow*seam*(.12+.22*s.z);
col+=vec3(.16,.23,.34)*pow(.5+.5*cos(p.z*.349066),32.)*.25;
float ao=clamp(field(p+n*.25)/.115,.35,1.);col*=.75+.25*ao;
}
col=mix(col,vec3(.045,.065,.095),1.-exp(-t*.013));
O=vec4(pow(max(col,vec3(0.)),vec3(.72)),1.);
}
