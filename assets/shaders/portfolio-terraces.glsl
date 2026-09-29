// Bounded WebGL1 sculpture scene. Shared host owns motion, pause and fallbacks.
uniform float uDetail;
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float capsule(vec3 p,vec3 a,vec3 b,float r){vec3 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.))-r;}

// Three exhibits, three distinct silhouettes: a crystal, an orbital instrument,
// and a stack of architectural plates. The camera drifts, never resets.
vec2 scene(vec3 p){
 vec2 h=vec2(p.y+.18,1.);
 for(int i=0;i<3;i++){
  float k=float(i);vec3 q=p-vec3((k-1.)*3.35,0,0);
  h=closer(h,vec2(box3(q-vec3(0,.29,0),vec3(1.18,.46,1.08))-.025,2.));
  h=closer(h,vec2(box3(q-vec3(0,.755,0),vec3(1.08,.025,.99)),5.));
  q.y-=1.83;
  if(i==0){q.xz=turn(.32+iTime*.08)*q.xz;float crystal=(abs(q.x)+abs(q.y)*.62+abs(q.z)-.88)*.55;h=closer(h,vec2(crystal,3.));}
  if(i==1){q.xy=turn(.32)*q.xy;q.xz=turn(iTime*.10)*q.xz;
   float orbit=length(vec2(length(q.xy)-.91,q.z))-.095;
   float crossOrbit=length(vec2(length(q.yz)-.68,q.x))-.07;
   h=closer(h,vec2(min(orbit,crossOrbit),4.));h=closer(h,vec2(length(q)-.26,6.));}
  if(i==2){for(int j=0;j<3;j++){vec3 r=q-vec3(0,(float(j)-1.)*.52,0);r.xz=turn(float(j)*.17+.10*sin(iTime*.22))*r.xz;h=closer(h,vec2(box3(r,vec3(.86,.13,.74))-.018,3.+mod(float(j),2.)));}}
 }
 // Fine backdrop fins frame the exhibits rather than enclosing a tunnel.
 vec3 frame=p-vec3(0,1.6,-2.1);
 h=closer(h,vec2(box3(vec3(abs(frame.x)-5.3,frame.y,frame.z),vec3(.075,2.,.12)),2.));
 h=closer(h,vec2(box3(frame-vec3(0,2.,0),vec3(5.3,.075,.12)),2.));
 return h;
}

// Analytic environment lighting: broad softboxes and a narrow reflected ribbon.
// This is a real-time material approximation, not path-traced reflection.
vec3 reflectedLight(vec3 r){
 float broad=pow(max(dot(r,normalize(vec3(-.5,.8,.4))),0.),12.);
 float strip=pow(max(dot(r,normalize(vec3(.8,.25,-.4))),0.),48.);
 return vec3(.08,.14,.21)*( .5+.5*r.y)+vec3(1.,.78,.52)*broad+vec3(.35,.70,1.)*strip;
}
vec3 colorAt(vec3 p,vec3 n,vec3 rd,float id){
 vec3 base=vec3(.49,.43,.39);
 if(id>1.5)base=vec3(.20,.21,.24);
 if(id>2.5)base=mix(vec3(.35,.19,.46),vec3(.12,.40,.46),smoothstep(-3.,3.,p.x));
 if(id>3.5)base=vec3(.82,.48,.22);
 if(id>4.5)base=vec3(.67,.59,.45);
 if(id>5.5)return vec3(1.,.63,.26)*1.5;
 float dif=max(dot(n,normalize(vec3(-.5,1.,.6))),0.);
 float rim=pow(1.-max(dot(n,-rd),0.),3.);
 vec3 c=base*(.42+.9*dif)+vec3(.39,.32,.50)*rim*.42;
 c+=vec3(1.,.82,.60)*pow(max(dot(reflect(rd,n),normalize(vec3(-.3,.8,.7))),0.),id>2.5?45.:18.)*.6;
 if(id<1.5){for(int k=0;k<3;k++){vec2 shadow=p.xz-vec2((float(k)-1.)*3.25+.3,-.25);c*=1.-.32*exp(-dot(shadow*vec2(.65,.85),shadow*vec2(.65,.85)));}float pool=exp(-p.z*p.z*.45)*exp(-p.x*p.x*.015);c*=1.-pool*.35;c+=vec3(.18,.10,.06)*pool;}
 vec3 reflection=reflectedLight(reflect(rd,n));
 c+=reflection*(id>2.5?.24:.07)*(.22+.78*rim);
 if(id>2.5&&id<4.5){
  float thickness=max(0.,-scene(p-normalize(vec3(-.5,1.,.6))*.18).x);
  vec3 transmit=exp(-thickness*(vec3(7.)-base*5.));
  c+=base*transmit*pow(clamp((dot(-n,normalize(vec3(-.5,1.,.6)))+.6)/1.6,0.,1.),2.)*.65;
 }
 return c;
}

vec3 normalAt(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*scene(p+e.xyy).x+e.yyx*scene(p+e.yyx).x+e.yxy*scene(p+e.yxy).x+e.xxx*scene(p+e.xxx).x);}
void mainImage(out vec4 O,in vec2 f){
 vec2 uv=(2.*f-iResolution.xy)/iResolution.y;
 float mobile=1.-smoothstep(.85,1.4,iResolution.x/iResolution.y);
 vec3 ro=vec3(5.8+.45*sin(iTime*.09),5.2,10.5)*mix(1.,1.25,mobile);
 vec3 fw=normalize(vec3(0,.7,0)-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
 vec3 rd=normalize(fw*mix(3.65,1.40,mobile)+rt*uv.x+up*uv.y);
 float t=0.;vec2 h=vec2(1,0);vec3 p=ro;
 for(int i=0;i<76;i++){p=ro+rd*t;h=scene(p);if(h.x<max(.002,t*.0004)||t>38.)break;t+=max(h.x*.78,.001);}
 vec3 sky=vec3(.28,.24,.30);
 vec3 col=sky*(.85+.22*max(0.,rd.y+.35));
 if(t<38.&&h.x<max(.006,t*.001)){
  vec3 n=normalAt(p);col=colorAt(p,n,rd,h.y);
  float ao=clamp(scene(p+n*.20).x/.20,.25,1.);col*=.75+.25*ao;
  col=mix(col,sky,smoothstep(20.,37.,t));
 }
 col=col/(1.+col);O=vec4(pow(max(col,0.),vec3(.65)),1.);
}
