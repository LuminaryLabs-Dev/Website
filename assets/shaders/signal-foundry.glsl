// Animated SDF scene; analytic reflection and thickness-weighted transmission.
uniform float uDetail;
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float tube(vec3 p,float radius,float width){return length(vec2(length(p.xz)-radius,p.y))-width;}
float link(vec3 p,vec3 a,vec3 b,float r){vec3 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.))-r;}
vec2 nearHit(vec2 a,vec2 b){return a.x<b.x?a:b;}
// Three assemblies rotate around an energized central system core.
vec2 scene(vec3 p){vec2 h=vec2(p.y+.75,1.);h=nearHit(h,vec2(length(p-vec3(0.,1.25,0.))-.48,4.));
for(int j=0;j<3;j++){float a=float(j)*2.094+iTime*.10;vec3 c=vec3(cos(a)*2.4,.65+.18*sin(iTime*.5+a),sin(a)*2.4);vec3 q=p-c;q.xz=turn(a)*q.xz;
h=nearHit(h,vec2(box3(q,vec3(.65,.65,.65))-.09,3.));
vec3 r=q;r.y=mod(r.y+.32,.64)-.32;h=nearHit(h,vec2(max(box3(r,vec3(.76,.038,.76)),abs(q.y)-.72),5.));
h=nearHit(h,vec2(link(p,c,vec3(0.,1.25,0.),.032),4.));}
vec3 q=p-vec3(0.,-.43,0.);h=nearHit(h,vec2(tube(q,3.2,.045),4.));return h;}

vec3 normalAt(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*scene(p+e.xyy).x+e.yyx*scene(p+e.yyx).x+e.yxy*scene(p+e.yxy).x+e.xxx*scene(p+e.xxx).x);}
vec3 environment(vec3 r){return mix(vec3(.025,.045,.065),vec3(.24,.34,.40),.5+.5*r.y)+vec3(1.,.80,.58)*pow(max(dot(r,normalize(vec3(-.4,.8,.5))),0.),24.)*2.+vec3(.22,.65,1.)*pow(max(dot(r,normalize(vec3(.8,.3,-.5))),0.),55.);}
void mainImage(out vec4 O,in vec2 F){vec2 uv=(2.*F-iResolution.xy)/iResolution.y;float mobile=1.-smoothstep(1.25,1.75,iResolution.x/iResolution.y);
vec3 ro=vec3(3.2+.6*sin(iTime*.12),3.2,8.8),target=vec3(0.,.45,0.);
vec3 fw=normalize(target-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);vec3 rd=normalize(fw*mix(4.0,min(2.0,1.72*iResolution.x/iResolution.y),mobile)+rt*uv.x+up*uv.y);
float t=.02;vec2 h;vec3 p;for(int i=0;i<88;i++){p=ro+rd*t;h=scene(p);if(h.x<max(.002,t*.00045)||t>35.)break;t+=clamp(h.x*.72,.001,1.);}
vec3 hot=vec3(.95,.60,.20),cool=vec3(.12,.70,.48),background=mix(vec3(.026,.045,.065),cool*.18,.5+.5*rd.y),col=background;
if(t<35.){vec3 n=normalAt(p),l=normalize(vec3(-.5,.8,.6));float dif=max(dot(n,l),0.),fres=.045+.955*pow(1.-max(dot(n,-rd),0.),5.);vec3 pigment=mix(cool,hot,.5+.5*sin(p.x*.8+p.z*.5));vec3 reflected=environment(reflect(rd,n));
col=pigment*(.18+.8*dif);
if(h.y<1.5){float grid=smoothstep(.47,.49,max(abs(fract(p.x*.5)-.5),abs(fract(p.z*.5)-.5)));col=vec3(.07,.10,.12)*(.7+.3*dif)*(1.-grid*.15)+reflected*(.07+.2*fres);float contact=exp(-p.z*p.z*.22-p.x*p.x*.03);col*=1.-contact*.3;}
else if(h.y<2.5)col=vec3(.035,.055,.08)*(.35+dif)+reflected*(.05+.25*fres);
else if(h.y<3.5){float thickness=max(0.,-scene(p-l*.18).x);vec3 transmit=exp(-thickness*(vec3(9.)-pigment*6.));float back=pow(clamp((dot(-n,l)+.6)/1.6,0.,1.),2.);col=pigment*(.2+.42*dif)+reflected*(.24+fres*.85)+transmit*pigment*back*1.4;vec3 inner=p+refract(rd,n,1./1.46)*.2;float core=pow(.5+.5*sin(inner.y*3.+inner.z*1.5-iTime),10.);col+=transmit*hot*core*.28;}
else if(h.y<4.5)col=mix(hot,cool,.5+.5*sin(p.x*2.-iTime))*1.8+reflected*.18;
else col=reflected*(.35+.65*fres)+vec3(.14,.13,.11)*dif;
float ao=clamp(scene(p+n*.16).x/.16,.25,1.);col*=.8+.2*ao;col=mix(col,background,1.-exp(-t*t*.0009));}
col=vec3(1.)-exp(-col*1.2);O=vec4(pow(max(col,0.),vec3(.68)),1.);}
