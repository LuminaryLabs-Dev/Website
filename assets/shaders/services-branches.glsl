// Bounded WebGL1 sculpture scene. Shared host owns motion, pause and fallbacks.
uniform float uDetail;
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float capsule(vec3 p,vec3 a,vec3 b,float r){vec3 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.))-r;}

// A studio assembly bench: three independently built modules share a signal bus.
vec2 scene(vec3 p){
 vec2 h=vec2(p.y+.16,1.);
 h=closer(h,vec2(box3(p-vec3(0,0,0),vec3(5.25,.12,2.15))-.06,2.));
 h=closer(h,vec2(box3(p-vec3(0,.21,1.55),vec3(4.45,.022,.026)),5.));
 for(int i=0;i<3;i++){
  float k=float(i),x=(k-1.)*3.2;vec3 q=p-vec3(x,0,0);
  float lift=.11*sin(iTime*.45+k*1.3);
  h=closer(h,vec2(box3(q-vec3(0,.29,0),vec3(1.19,.12,1.13))-.045,3.));
  h=closer(h,vec2(box3(q-vec3(0,.21,.82),vec3(.027,.025,.72)),5.));
  h=closer(h,vec2(box3(q-vec3(0,.68,0),vec3(.95,.19,.85))-.07,2.));
  h=closer(h,vec2(box3(q-vec3(0,1.21+lift,0),vec3(.95,.075,.85))-.045,3.));
  h=closer(h,vec2(box3(q-vec3(0,1.62+lift,0),vec3(.90,.07,.80))-.045,4.));
  // Vertical pins make the assembly readable, even while layers gently breathe.
  vec3 pins=vec3(abs(q.x)-.70,q.y-.94,abs(q.z)-.60);
  h=closer(h,vec2(box3(pins,vec3(.027,.64+lift,.027)),5.));
  vec3 chip=q-vec3(0,1.78+lift,0);
  h=closer(h,vec2(box3(chip,vec3(.42,.10,.36))-.035,2.));
  h=closer(h,vec2(box3(chip-vec3(0,.155,0),vec3(.30,.018,.24)),6.));
 }
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
 vec3 base=vec3(.45,.53,.49);
 if(id>1.5)base=vec3(.065,.115,.12);
 if(id>2.5)base=vec3(.30,.53,.43);
 if(id>3.5)base=vec3(.69,.73,.64);
 if(id>4.5)base=vec3(.75,.40,.16);
 if(id>5.5)return vec3(.30,.95,.66)*(1.2+.35*sin(iTime*.9+p.x));
 float dif=max(dot(n,normalize(vec3(-.5,1.,.6))),0.);
 float rim=pow(1.-max(dot(n,-rd),0.),3.);
 vec3 c=base*(.40+.80*dif)+vec3(.30,.45,.40)*rim*.28;
 c+=vec3(1.,.83,.55)*pow(max(dot(reflect(rd,n),normalize(vec3(-.3,.8,.7))),0.),40.)*.3;
 if(id>4.5)c+=vec3(.4,.85,.60)*pow(.5+.5*sin(p.x*1.1+p.z*2.-iTime*1.4),12.)*.55;
 if(id<1.5){for(int k=0;k<3;k++){vec2 shadow=p.xz-vec2((float(k)-1.)*3.25+.3,-.25);c*=1.-.32*exp(-dot(shadow*vec2(.65,.85),shadow*vec2(.65,.85)));}float shade=exp(-abs(p.x)*.15-abs(p.z)*.35);c*=1.-shade*.38;}
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
 vec3 sky=vec3(.23,.34,.32);
 vec3 col=sky*(.85+.22*max(0.,rd.y+.35));
 if(t<38.&&h.x<max(.006,t*.001)){
  vec3 n=normalAt(p);col=colorAt(p,n,rd,h.y);
  float ao=clamp(scene(p+n*.20).x/.20,.25,1.);col*=.75+.25*ao;
  col=mix(col,sky,smoothstep(20.,37.,t));
 }
 col=col/(1.+col);O=vec4(pow(max(col,0.),vec3(.65)),1.);
}
