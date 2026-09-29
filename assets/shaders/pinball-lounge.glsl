// Animated SDF scene; analytic reflection and thickness-weighted transmission.
uniform float uDetail;
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float tube(vec3 p,float radius,float width){return length(vec2(length(p.xz)-radius,p.y))-width;}
float link(vec3 p,vec3 a,vec3 b,float r){vec3 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.))-r;}
vec2 nearHit(vec2 a,vec2 b){return a.x<b.x?a:b;}
// Sloped pinball playfields, chrome rails, glass bumpers and a rolling ball.
vec2 scene(vec3 p){vec2 h=vec2(p.y+.75,1.);for(int j=0;j<3;j++){float k=float(j);vec3 q=p-vec3((k-1.)*2.7,0.,0.);q.xz=turn((k-1.)*-.15)*q.xz;
h=nearHit(h,vec2(box3(q-vec3(0.,.25,0.),vec3(1.,.3,1.7))-.06,2.));
vec3 deck=q-vec3(0.,.63,0.);deck.yz=turn(.13)*deck.yz;
h=nearHit(h,vec2(box3(deck,vec3(.91,.04,1.6)),3.));
h=nearHit(h,vec2(box3(vec3(abs(deck.x)-.97,deck.y-.12,deck.z),vec3(.025,.03,1.65)),5.));
for(int b=0;b<3;b++){vec3 r=deck-vec3((float(b)-1.)*.48,.18,-.4- mod(float(b),2.)*.55);h=nearHit(h,vec2(length(r*vec3(1.,1.3,1.))-.19,4.));}
vec3 ball=deck-vec3(.66*sin(iTime*.8+k),.16,.9*cos(iTime*.63+k));h=nearHit(h,vec2(length(ball)-.105,5.));
h=nearHit(h,vec2(box3(q-vec3(0.,1.36,-1.48),vec3(1.,.5,.12))-.045,2.));
h=nearHit(h,vec2(box3(q-vec3(0.,1.38,-1.28),vec3(.84,.33,.018)),4.));
vec3 legs=vec3(abs(q.x)-.78,q.y+.4,abs(q.z)-1.35);h=nearHit(h,vec2(box3(legs,vec3(.04,.38,.04)),5.));}return h;}

float scoreDigit(vec2 p,float code){float light=0.;for(int i=0;i<7;i++){float k=float(i);vec2 c=i<3?vec2(0.,.32-k*.32):vec2(i<5?-.20:.20,mod(k,2.)<.5?-.16:.16);vec2 b=i<3?vec2(.17,.025):vec2(.025,.13);vec2 d=abs(p-c)-b;float bar=1.-smoothstep(0.,.025,max(d.x,d.y));light+=bar*mod(floor(code/pow(2.,k)),2.);}return light;}
vec3 normalAt(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*scene(p+e.xyy).x+e.yyx*scene(p+e.yyx).x+e.yxy*scene(p+e.yxy).x+e.xxx*scene(p+e.xxx).x);}
vec3 environment(vec3 r){return mix(vec3(.025,.045,.065),vec3(.24,.34,.40),.5+.5*r.y)+vec3(1.,.80,.58)*pow(max(dot(r,normalize(vec3(-.4,.8,.5))),0.),24.)*2.+vec3(.22,.65,1.)*pow(max(dot(r,normalize(vec3(.8,.3,-.5))),0.),55.);}
void mainImage(out vec4 O,in vec2 F){vec2 uv=(2.*F-iResolution.xy)/iResolution.y;float mobile=1.-smoothstep(1.25,1.75,iResolution.x/iResolution.y);
vec3 ro=vec3(3.2+.6*sin(iTime*.12),3.2,8.8),target=vec3(0.,.45,0.);
vec3 fw=normalize(target-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);vec3 rd=normalize(fw*mix(4.0,min(2.0,1.72*iResolution.x/iResolution.y),mobile)+rt*uv.x+up*uv.y);
float t=.02;vec2 h;vec3 p;for(int i=0;i<88;i++){p=ro+rd*t;h=scene(p);if(h.x<max(.002,t*.00045)||t>35.)break;t+=clamp(h.x*.72,.001,1.);}
vec3 hot=vec3(1.,.22,.45),cool=vec3(.12,.62,1.),background=mix(vec3(.026,.045,.065),cool*.18,.5+.5*rd.y),col=background;
if(t<35.){vec3 n=normalAt(p),l=normalize(vec3(-.5,.8,.6));float dif=max(dot(n,l),0.),fres=.045+.955*pow(1.-max(dot(n,-rd),0.),5.);vec3 pigment=mix(cool,hot,.5+.5*sin(p.x*.8+p.z*.5));vec3 reflected=environment(reflect(rd,n));
col=pigment*(.18+.8*dif);
if(h.y<1.5){float grid=smoothstep(.47,.49,max(abs(fract(p.x*.5)-.5),abs(fract(p.z*.5)-.5)));col=vec3(.07,.10,.12)*(.7+.3*dif)*(1.-grid*.15)+reflected*(.07+.2*fres);float contact=exp(-p.z*p.z*.22-p.x*p.x*.03);col*=1.-contact*.3;}
else if(h.y<2.5)col=vec3(.035,.055,.08)*(.35+dif)+reflected*(.05+.25*fres);
else if(h.y<3.5){float thickness=max(0.,-scene(p-l*.18).x);vec3 transmit=exp(-thickness*(vec3(9.)-pigment*6.));float back=pow(clamp((dot(-n,l)+.6)/1.6,0.,1.),2.);col=pigment*(.2+.42*dif)+reflected*(.24+fres*.85)+transmit*pigment*back*1.4;vec3 inner=p+refract(rd,n,1./1.46)*.2;float core=pow(.5+.5*sin(inner.y*3.+inner.z*1.5-iTime),10.);col+=transmit*hot*core*.28;}
else if(h.y<4.5)col=mix(hot,cool,.5+.5*sin(p.x*2.-iTime))*1.8+reflected*.18;
else col=reflected*(.35+.65*fres)+vec3(.14,.13,.11)*dif;
if(h.y>3.5&&h.y<4.5&&p.y>1.05&&p.z<-.95){float k=clamp(floor((p.x+4.05)/2.7),0.,2.);vec3 q=p-vec3((k-1.)*2.7,0.,0.);q.xz=turn((k-1.)*-.15)*q.xz;vec2 uv=vec2(q.x*2.,(q.y-1.38)*1.9);float d=floor(uv.x+.5);uv.x=fract(uv.x+.5)-.5;float mask=abs(d)<1.5?1.:0.;float score=scoreDigit(uv,d<-.5?55.:(d>.5?125.:106.))*mask;col=vec3(.012,.024,.04)+vec3(1.,.47,.14)*score*1.5;}
if(h.y>2.5&&h.y<3.5){float lane=exp(-abs(sin(p.x*4.+sin(p.z)))*28.);col+=cool*lane*.22;}
float ao=clamp(scene(p+n*.16).x/.16,.25,1.);col*=.8+.2*ao;col=mix(col,background,1.-exp(-t*t*.0009));}
col=vec3(1.)-exp(-col*1.2);O=vec4(pow(max(col,0.),vec3(.68)),1.);}
