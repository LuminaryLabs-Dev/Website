#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
#define ROT(a) mat2(cos(a + vec4(0.,11.,33.,0.)))
float hash(vec3 p){p=fract(p*vec3(443.897,441.423,437.195));p+=dot(p,p.yxz+19.19);return fract((p.x+p.y)*p.z);}
float noise(vec3 x){vec3 p=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(p),hash(p+vec3(1,0,0)),f.x),mix(hash(p+vec3(0,1,0)),hash(p+vec3(1,1,0)),f.x),f.y),mix(mix(hash(p+vec3(0,0,1)),hash(p+vec3(1,0,1)),f.x),mix(hash(p+vec3(0,1,1)),hash(p+vec3(1,1,1)),f.x),f.y),f.z);}
float map(vec3 p){vec3 q=p;p.xy*=ROT(p.z*.02+iTime*.1);float s=1.;float w=sin(q.z*.15)*cos(q.x*.15+iTime*.05);for(int i=0;i<4;i++){p.xy*=ROT(.8+w*.6+float(i)*.2);p.xy=abs(p.xy)-(1.2+.3*sin(q.y*.3+float(i)));p.z=abs(fract(p.z*.15)*6.66-3.33);p.xz*=ROT(.2+w*.4);p*=1.3;s*=1.3;}float tri=max(abs(p.x)*.866+p.y*.5,-p.y)-1.5;float d=max(tri,abs(p.z)-1.2)/s;float h=clamp(.5+.5*(d-(1.2-length(q.xy)))/.5,0.,1.);return mix(1.2-length(q.xy),d,h)+.5*h*(1.-h);}
vec3 normal(vec3 p){vec2 e=vec2(.005,0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void mainImage(out vec4 O,vec2 fragCoord){vec2 uv=(2.*fragCoord-iResolution.xy)/iResolution.y;vec3 ro=vec3(0,0,iTime*4.),rd=normalize(vec3(uv,1.2));rd.xy*=ROT(sin(iTime*.2)*.4);float t=0.,d;vec3 p;for(int i=0;i<110;i++){p=ro+rd*t;d=map(p);if(d<.001||t>40.)break;t+=d*.5;}vec3 col=vec3(.01,.01,.015);if(t<40.){vec3 n=normal(p);float z=max(0.,dot(n,-rd));float nz=noise(p*.8-vec3(0,0,iTime*.4));float bands=abs(fract(nz*8.)-.5);float crease=smoothstep(.05,0.,bands);float bleed=smoothstep(.3,0.,bands);vec3 neon=.5+.5*cos(6.28318*(nz*1.5+iTime*.2+vec3(0.,.333,.667)));col=vec3(.04,.05,.07)*z+vec3(.1,.15,.2)*pow(1.-z,4.)+pow(z,40.)*.5;col+=neon*crease*3.+neon*bleed*.5;col=mix(col,vec3(.01),smoothstep(15.,40.,t));}O=vec4(pow(col,vec3(.7)),1.);}
