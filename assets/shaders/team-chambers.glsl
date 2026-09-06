// Ideas meet and grow: analytic globe, bounded bulbs, depth-tested dotted arcs.
// World coordinates are fixed; only the camera and deterministic light phases move.
uniform float uDetail;
const float PI=3.14159265;
vec2 sphere(vec3 o,vec3 d,vec3 c,float r){vec3 q=o-c;float b=dot(q,d),h=b*b-dot(q,q)+r*r;if(h<0.)return vec2(1e4,-1.);h=sqrt(h);return vec2(-b-h,-b+h);}
vec3 hub(float g){if(g<0.5)return vec3(0.750311459,0.580000000,0.317226597);if(g<1.5)return vec3(-0.923173439,0.200000000,0.328254173);if(g<2.5)return vec3(0.460799897,-0.180000000,-0.869058948);return vec3(0.208255933,-0.560000000,0.801891181);}
mat3 frame(vec3 n){vec3 x=normalize(cross(abs(n.y)<.9?vec3(0,1,0):vec3(1,0,0),n));return mat3(x,n,cross(x,n));}
vec3 source(float g,float j){float k=g*3.+j;if(k<0.5)return vec3(0.925391700,0.356395060,-0.128968071);if(k<1.5)return vec3(0.668042262,0.232083256,0.707005586);if(k<2.5)return vec3(0.342660044,0.908146147,0.240529977);if(k<3.5)return vec3(-0.666480620,0.000655467,0.745522068);if(k<4.5)return vec3(-0.986773973,-0.148862986,-0.064163374);if(k<5.5)return vec3(-0.728890262,0.664284879,0.165664074);if(k<6.5)return vec3(-0.041726406,-0.326870567,-0.944147520);if(k<7.5)return vec3(0.714217845,-0.476979698,-0.512233578);if(k<8.5)return vec3(0.516550721,0.339380532,-0.786127348);if(k<9.5)return vec3(0.618273720,-0.626579026,0.474485333);if(k<10.5)return vec3(-0.245466117,-0.753008350,0.610511925);return vec3(0.164573242,-0.065429441,0.984192378);}
// Analytic ellipsoid intersections: envelope, tapered neck and metallic socket.
float ellipsoid(vec3 o,vec3 d,vec3 c,vec3 r){vec3 q=(o-c)/r,v=d/r;float a=dot(v,v),b=dot(q,v),h=b*b-a*(dot(q,q)-1.);if(h<0.)return 1e4;float t=(-b-sqrt(h))/a;return t>0.?t:1e4;}
float glow(vec3 ro,vec3 rd,vec3 c,float r,float stop){float t=dot(c-ro,rd);if(t<0.||t>stop+.005)return 0.;vec3 q=ro+rd*t-c;return exp(-dot(q,q)/(r*r));}
void mainImage(out vec4 O,in vec2 F){
vec2 uv=(2.*F-iResolution.xy)/iResolution.y;float aspect=iResolution.x/iResolution.y;
float a=.9+iTime*.052+.09*sin(iTime*.023),el=.22+.15*sin(iTime*.031),dist=3.5+.18*sin(iTime*.043);
vec3 ro=vec3(cos(a)*cos(el),sin(el),sin(a)*cos(el))*dist,fw=normalize(-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
float mobile=1.-smoothstep(.85,1.25,aspect);uv.x-=mix(.78,0.,mobile);uv.y+=mix(0.,.42,mobile);
vec3 rd=normalize(fw*mix(2.10,1.28,mobile)+rt*uv.x+up*uv.y);
vec3 col=vec3(.009,.018,.035)+vec3(.006,.01,.018)*max(0.,rd.y+.4),light=normalize(vec3(-.5,.8,1.));
vec2 worldBound=sphere(ro,rd,vec3(0),1.5);if(worldBound.y<0.){O=vec4(pow(col/(1.+col),vec3(.454545)),1.);return;}
vec2 hit=sphere(ro,rd,vec3(0),1.);float stop=hit.x>0.&&hit.y>0.?hit.x:1e4;vec3 surface=ro+rd*min(stop,10.);
if(stop<100.){vec3 n=surface;float dif=max(dot(n,light),0.),rim=pow(1.-max(dot(n,-rd),0.),3.);float panel=pow(abs(sin(n.x*16.+n.z*8.)*sin(n.y*17.-n.z*7.)),.35);float detail=uDetail>.5?panel*.035:0.;col=vec3(.026,.095,.19)*(.4+dif*.9+detail)+vec3(.045,.18,.32)*rim*.45;col+=vec3(.1,.22,.34)*pow(max(dot(reflect(rd,n),light),0.),40.)*.4;}
float tangent=length(cross(ro,rd));if(dot(ro,rd)<0.)col+=vec3(.045,.23,.45)*exp(-abs(tangent-1.)*48.)*.22;
vec3 emission=vec3(0);float globeStop=stop;
// Four groups, three sources and one meeting point each. No global marching loop.
for(int G=0;G<4;G++){float g=float(G),age=iTime+g*8.-5.;vec3 h=hub(g);vec2 groupBound=sphere(ro,rd,h*.96,.87);if(groupBound.y<0.)continue;float grown=smoothstep(14.,20.,age);float cycle=age*.20;
for(int B=0;B<4;B++){float b=float(B);bool big=B==3;vec3 n=big?h:source(g,b),base=n*(big?1.16:1.);float scale=big?mix(.65,1.85,grown):mix(.68,1.,smoothstep(0.,4.,age));float power=big?mix(.12,1.,grown):mix(.2,.7,smoothstep(0.,4.,age));power*=.94+.06*sin(cycle);
mat3 basis=frame(n);vec3 center=base+n*.09*scale;vec2 bound=sphere(ro,rd,center,.10*scale);if(bound.y>0.&&bound.x<stop){vec3 w=ro-base,q=vec3(dot(w,basis[0]),dot(w,basis[1]),dot(w,basis[2]))/scale,v=vec3(dot(rd,basis[0]),dot(rd,basis[1]),dot(rd,basis[2]))/scale;
float t=1e4;vec3 normal=vec3(0);float part=0.;
for(int K=0;K<3;K++){float k=float(K);vec3 c=K==0?vec3(0,.103,0):(K==1?vec3(0,.06,0):vec3(0,.023,0));vec3 r=K==0?vec3(.046):(K==1?vec3(.024,.035,.024):vec3(.023,.027,.023));float t0=ellipsoid(q,v,c,r);if(t0<t){t=t0;normal=basis*normalize((q+v*t-c)/(r*r));part=k;}}
if(t<stop){vec3 p=q+v*t;float rim=pow(1.-max(dot(normal,-rd),0.),2.),dif=max(dot(normal,light),0.);vec3 material;if(part>1.5){float thread=.75+.25*sin(p.y*850.);material=vec3(.26,.19,.08)*(.35+dif)*thread;}else{float filament=exp(-pow(length(p.xz)/.019,2.));material=vec3(.07,.12,.16)*(.4+dif)+vec3(1.,.57,.17)*(rim*.5+filament*.9+.30)*power;material+=vec3(1.,.85,.55)*pow(max(dot(reflect(rd,normal),light),0.),32.);}col=material;stop=t;}}
// Occlusion by the globe is tested independently from the bulb envelope.
emission+=vec3(1.,.52,.14)*glow(ro,rd,center+n*.02*scale,.047*scale,globeStop)*power*.23;
if(globeStop<100.)col+=vec3(.18,.075,.014)*exp(-dot(surface-base,surface-base)*130.)*power;
}
// Arc dots are analytic emissive spheres; no route evaluation inside a raymarch.
for(int J=0;J<3;J++){vec3 s=source(g,float(J));float theta=acos(clamp(dot(s,h),-.99,.99));float reveal=smoothstep(4.,10.,age);vec3 plane=normalize(cross(s,h)),along=normalize(h-s*cos(theta));float den=dot(rd,plane),nearest=0.;bool exhaustive=abs(den)<.12;if(!exhaustive){float pt=-dot(ro,plane)/den;if(pt<0.)continue;vec3 at=ro+rd*pt;nearest=floor(clamp(atan(dot(at,along),dot(at,s))/theta,0.,1.)*11.+.5);}
for(int D=0;D<12;D++){if(!exhaustive&&abs(float(D)-nearest)>1.)continue;float u=float(D)/11.;if(u>reveal)continue;vec3 n=(sin((1.-u)*theta)*s+sin(u*theta)*h)/sin(theta);vec3 c=n*(1.+.16*u+.18*sin(PI*u));float first=exp(-pow((u-clamp((age-8.)/6.,0.,1.))/.12,2.))*smoothstep(7.,8.,age)*(1.-smoothstep(14.,16.,age));float pulse=first+pow(.5+.5*cos(6.283185*(u-(age-14.)/8.)),18.)*smoothstep(20.,23.,age);float r=.0065;vec2 dh=sphere(ro,rd,c,r);if(dh.x>0.&&dh.y>0.&&dh.x<stop){col=vec3(.18,.63,.85)*(1.+pulse);stop=dh.x;}emission+=vec3(.05,.36,.55)*glow(ro,rd,c,.009,globeStop)*(.12+pulse*.3);}
}}
col+=min(emission,vec3(.8));O=vec4(pow(max(col,0.)/(1.+max(col,0.)),vec3(.454545)),1.);
}
