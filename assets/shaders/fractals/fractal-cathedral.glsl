// Broader forms, fewer repetitions, calmer surface detail.
// Procedural geometry, moving camera and light. No image textures.
uniform float uDetail;
const float PI=3.14159265;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 path(float z){return vec3(.20*sin(z*.23),.16*cos(z*.19),z);}
float crystal(vec3 p){return (abs(p.x)+abs(p.y)*.65+abs(p.z))*.65-.24;}
float gyroid(vec3 p){return dot(sin(p),cos(p.yzx));}
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.57+noise(p*2.1)*.28+noise(p*4.3)*.15;}

float branches(vec3 p,float width){float d=10.,scale=1.;for(int i=0;i<4;i++){p.xy=rot(.65+float(i)*.37)*p.xy;p=abs(p)-vec3(.9,.65,.8);p.xz=rot(.52)*p.xz;d=min(d,(length(p.xy)-width)/scale);p*=1.8;scale*=1.8;}return d;}
vec2 scene(vec3 p){vec3 q=p;q.xy-=path(p.z).xy;float z=mod(q.z+2.4,4.8)-2.4;float a=atan(q.y,q.x),r=length(q.xy);float arch=abs(r-(2.05+.3*cos(a*6.)))-.105;float d=length(vec2(arch,z))-.105;float pillar=abs(sin(a*3.))*(r/3.)-.105;d=min(d,max(pillar,abs(r-2.05)-.30));vec3 b=q;b.z=z;b.xy=rot(.5)*b.xy;float lace=branches(b,.025);d=min(d,length(vec2(abs(r-(2.65+.28*cos(a*6.)))-.055,mod(q.z+.8,1.6)-.8))-.06);vec3 c=q;c.z=z;c.y-=1.5;float gem=crystal(c);return vec2(min(d,gem),gem<d?1.:0.);}
vec3 normalAt(vec3 p,float e){vec2 k=vec2(1.,-1.);return normalize(k.xyy*scene(p+k.xyy*e).x+k.yyx*scene(p+k.yyx*e).x+k.yxy*scene(p+k.yxy*e).x+k.xxx*scene(p+k.xxx*e).x);}

// Analytic environment lighting: broad softboxes and a narrow reflected ribbon.
// This is a real-time material approximation, not path-traced reflection.
vec3 reflectedLight(vec3 r){
 float broad=pow(max(dot(r,normalize(vec3(-.5,.8,.4))),0.),12.);
 float strip=pow(max(dot(r,normalize(vec3(.8,.25,-.4))),0.),48.);
 return vec3(.08,.14,.21)*( .5+.5*r.y)+vec3(1.,.78,.52)*broad+vec3(.35,.70,1.)*strip;
}
void mainImage(out vec4 O,in vec2 F){
vec2 uv=(2.*F-iResolution.xy)/iResolution.y;
float travel=iTime*0.54;vec3 ro=path(travel),target=path(travel+3.);vec3 fw=normalize(target-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
uv=rot(.045*sin(iTime*.12))*uv;vec3 rd=normalize(fw*1.82+rt*uv.x+up*uv.y);
float t=.05,glow=0.,hit=0.;vec2 data;vec3 p;float closest=1.;
for(int i=0;i<96;i++){p=ro+rd*t;data=scene(p);float d=data.x;float eps=max(.0015,t/iResolution.y*.35);closest=min(closest,d);glow+=exp(-abs(d)*32.)*.015*exp(-t*.065);if(d<eps){hit=1.;break;}t+=clamp(d*.65,.001,.7);if(t>22.)break;}
vec3 hot=vec3(1.0,0.42,0.39),cool=vec3(0.53,0.07,1.0);vec3 fog=vec3(.003,.001,.009);vec3 col=fog;
if(hit>.5){vec3 n=normalAt(p,max(.002,t/iResolution.y*.35));vec3 light=normalize(ro+vec3(1.5,2.,1.)-p);float diffuse=max(dot(n,light),0.),fres=pow(1.-abs(dot(n,-rd)),2.);float detail=.5+.5*sin(p.z*2.5+sin(p.x*3.)+sin(p.y*3.)-iTime*.5);vec3 pigment=mix(cool,hot,.5+.5*sin(p.z*.6+p.y*1.2));float vein=pow(.5+.5*sin(p.z*2.2+p.x*1.3+sin(p.y*1.7)+iTime*.8),12.);float spec=pow(max(dot(reflect(-light,n),-rd),0.),42.);float grain=fbm(p*2.4);float seam=pow(1.-smoothstep(.0,.07,abs(gyroid(p*2.+grain*.35))),2.);col=pigment*(.085+.38*diffuse)*(grain*.7+.4)+pigment*pow(fres,1.4)*1.3+mix(hot,vec3(1.,.83,.72),.45)*(vein*.28+seam*.32)*(.4+.6*grain)+spec*vec3(1.,.75,.64)*1.8;
if(data.y>.5){float facet=pow(max(dot(n,normalize(vec3(.5,.8,.4))),0.),5.);col+=hot*(.12+facet*1.2)+vec3(.8,.55,.8)*fres*.6;}

// Two depth probes estimate absorption through thin features; light quality uses one.
float thickness=max(0.,-scene(p-light*.12).x);
if(uDetail>.5)thickness+=max(0.,-scene(p-light*.28).x)*.5;
vec3 transmission=exp(-thickness*mix(vec3(8.,3.,1.5),vec3(1.5,4.,8.),pigment));
float wrap=pow(clamp((dot(-n,light)+.55)/1.55,0.,1.),2.);
vec3 reflection=reflectedLight(reflect(rd,n));
float fresnel=.045+.955*pow(1.-max(dot(n,-rd),0.),5.);
col+=transmission*mix(pigment,hot,.35)*wrap*.85;
col+=reflection*(.22+fresnel*.95);
// Light bends inside the material; flowing veins sit beneath its glossy skin.
vec3 inner=p+refract(rd,n,1./1.46)*(.12+thickness);
float core=pow(.5+.5*sin(inner.z*4.+sin(inner.x*3.)+inner.y*2.-iTime*.65),8.);
col+=transmission*pigment*core*.25*(1.-fresnel);
float ao=clamp(scene(p+n*.28).x/.28,.35,1.);col*=.72+.28*ao;
col=mix(col,fog,1.-exp(-t*.072));}
col+=mix(cool,hot,.55)*min(glow,2.)*.95;
col=vec3(1.)-exp(-col*1.22);O=vec4(pow(max(col,0.),vec3(.70)),1.);
}
