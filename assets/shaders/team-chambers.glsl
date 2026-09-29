
// Analytic environment lighting: broad softboxes and a narrow reflected ribbon.
// This is a real-time material approximation, not path-traced reflection.
vec3 reflectedLight(vec3 r){
 float broad=pow(max(dot(r,normalize(vec3(-.5,.8,.4))),0.),12.);
 float strip=pow(max(dot(r,normalize(vec3(.8,.25,-.4))),0.),48.);
 return vec3(.08,.14,.21)*( .5+.5*r.y)+vec3(1.,.78,.52)*broad+vec3(.35,.70,1.)*strip;
}
// Ideas meet and grow: analytic globe, bounded bulbs, depth-tested dotted arcs.
// Each receiving bulb extends radially from the mean of its three source positions.
uniform float uDetail;
uniform vec2 uScenePointer;
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float cloudNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float clouds(vec3 p){return cloudNoise(p)*.58+cloudNoise(p*2.1+7.)*.28+cloudNoise(p*4.3)*.14;}

const float PI=3.14159265;
vec2 sphere(vec3 o,vec3 d,vec3 c,float r){vec3 q=o-c;float b=dot(q,d),h=b*b-dot(q,q)+r*r;if(h<0.)return vec2(1e4,-1.);h=sqrt(h);return vec2(-b-h,-b+h);}
mat3 frame(vec3 n){vec3 x=normalize(cross(abs(n.y)<.9?vec3(0,1,0):vec3(1,0,0),n));return mat3(x,n,cross(x,n));}
vec3 source(float g,float j){float k=g*3.+j;if(k<0.5)return vec3(0.925391700,0.356395060,-0.128968071);if(k<1.5)return vec3(0.668042262,0.232083256,0.707005586);if(k<2.5)return vec3(0.342660044,0.908146147,0.240529977);if(k<3.5)return vec3(-0.666480620,0.000655467,0.745522068);if(k<4.5)return vec3(-0.986773973,-0.148862986,-0.064163374);if(k<5.5)return vec3(-0.728890262,0.664284879,0.165664074);if(k<6.5)return vec3(-0.041726406,-0.326870567,-0.944147520);if(k<7.5)return vec3(0.714217845,-0.476979698,-0.512233578);if(k<8.5)return vec3(0.516550721,0.339380532,-0.786127348);if(k<9.5)return vec3(0.618273720,-0.626579026,0.474485333);if(k<10.5)return vec3(-0.245466117,-0.753008350,0.610511925);return vec3(0.164573242,-0.065429441,0.984192378);}
// Analytic ellipsoid intersections: envelope, tapered neck and metallic socket.
float ellipsoid(vec3 o,vec3 d,vec3 c,vec3 r){vec3 q=(o-c)/r,v=d/r;float a=dot(v,v),b=dot(q,v),h=b*b-a*(dot(q,q)-1.);if(h<0.)return 1e4;float t=(-b-sqrt(h))/a;return t>0.?t:1e4;}
float glow(vec3 ro,vec3 rd,vec3 c,float r,float stop){float t=dot(c-ro,rd);if(t<0.||t>stop+.005)return 0.;vec3 q=ro+rd*t-c;return exp(-dot(q,q)/(r*r));}
void mainImage(out vec4 O,in vec2 F){
vec2 uv=(2.*F-iResolution.xy)/iResolution.y;float aspect=iResolution.x/iResolution.y;
float a=.9+iTime*.052+.09*sin(iTime*.023)+uScenePointer.x*.22,el=.22+.15*sin(iTime*.031)+uScenePointer.y*.12,dist=4.1+.18*sin(iTime*.043);
vec3 ro=vec3(cos(a)*cos(el),sin(el),sin(a)*cos(el))*dist,fw=normalize(-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
float mobile=1.-smoothstep(.85,1.25,aspect);// Keep radial groups centered without a screen-up bias.
vec3 rd=normalize(fw*mix(2.15,1.38,mobile)+rt*uv.x+up*uv.y);
float skyCloud=clouds(rd*3.4+vec3(iTime*.014,0,iTime*.008));
vec3 col=mix(vec3(.016,.04,.075),vec3(.13,.20,.26),smoothstep(.35,.76,skyCloud)) + vec3(.10,.075,.04)*pow(max(0.,dot(rd,normalize(vec3(-.5,.5,-1.)))),6.);
vec3 light=normalize(vec3(-.5,.8,1.));
vec2 worldBound=sphere(ro,rd,vec3(0),2.15);if(worldBound.y<0.){O=vec4(pow(col/(1.+col),vec3(.454545)),1.);return;}
vec2 hit=sphere(ro,rd,vec3(0),1.);float stop=hit.x>0.&&hit.y>0.?hit.x:1e4;vec3 surface=ro+rd*min(stop,10.);
if(stop<100.){vec3 n=surface;float dif=max(dot(n,light),0.),rim=pow(1.-max(dot(n,-rd),0.),3.);float panel=pow(abs(sin(n.x*16.+n.z*8.)*sin(n.y*17.-n.z*7.)),.35);float detail=0.;float mineral=.5+.5*sin(n.x*5.+sin(n.z*7.))*sin(n.y*8.+n.z*3.);vec3 blue=mix(vec3(.018,.065,.145),vec3(.025,.11,.24),mineral);col=blue*(.22+dif*1.35+detail)+vec3(.045,.18,.32)*rim*.50;col+=vec3(.13,.27,.40)*pow(max(dot(reflect(rd,n),light),0.),40.)*.4;
float cloud=smoothstep(.48,.68,clouds(n*4.8+vec3(iTime*.024,0,iTime*.012)));
col=mix(col,vec3(.50,.62,.68)*(.38+.62*dif),cloud*.74);}
float tangent=length(cross(ro,rd));if(dot(ro,rd)<0.){float limb=abs(tangent-1.);col+=vec3(.045,.23,.45)*exp(-limb*65.)*.42;col+=vec3(.025,.105,.22)*exp(-limb*23.)*.12*smoothstep(.99,1.025,tangent);}
vec3 emission=vec3(0);float globeStop=stop;
// Four groups, three sources and one meeting point each. No global marching loop.
for(int G=0;G<4;G++){float g=float(G),age=iTime-g*1.5;
vec3 sharedCenter=(source(g,0.)+source(g,1.)+source(g,2.))/3.;
vec3 outward=normalize(sharedCenter),destination=outward*1.48;
vec2 groupBound=sphere(ro,rd,sharedCenter,1.5);if(groupBound.y<0.)continue;float sinceArrival=max(0.,age-6.);
float grown=age<6.?0.:1.-exp(-sinceArrival*16.);
float bounce=age<6.?0.:exp(-sinceArrival*6.5)*cos(sinceArrival*17.);
float impact=exp(-pow((sinceArrival-.18)/.09,2.))*step(6.,age);float arrival=pow(.5+.5*cos(6.283185*(age-6.)/2.666667),24.);float cycle=age*.20;
for(int B=0;B<4;B++){float b=float(B);bool big=B==3;if(big&&grown<.001)continue;vec3 n=big?normalize(destination):source(g,b),base=big?destination+outward*.20*bounce:n;float scale=big?max(.001,2.3*grown*(1.+.15*exp(-sinceArrival*7.)*sin(sinceArrival*19.))):mix(.82,1.2,smoothstep(0.,4.,age));float power=big?grown*(.92+.30*arrival+.65*impact):mix(.2,.7,smoothstep(0.,4.,age));if(!big)power*=.94+.06*sin(cycle);
mat3 basis=frame(n);
// A brief squash at landing followed by a damped settle gives weight to arrival.
if(big){basis[0]*=1.+impact*.09;basis[1]*=1.-impact*.16;basis[2]*=1.+impact*.09;}
vec3 center=base+n*.09*scale;vec2 bound=sphere(ro,rd,center,.12*scale);if(bound.y>0.&&bound.x<stop){vec3 w=ro-base,q=vec3(dot(w,basis[0])/dot(basis[0],basis[0]),dot(w,basis[1])/dot(basis[1],basis[1]),dot(w,basis[2])/dot(basis[2],basis[2]))/scale,v=vec3(dot(rd,basis[0])/dot(basis[0],basis[0]),dot(rd,basis[1])/dot(basis[1],basis[1]),dot(rd,basis[2])/dot(basis[2],basis[2]))/scale;
float t=1e4;vec3 normal=vec3(0);float part=0.;
for(int K=0;K<3;K++){float k=float(K);vec3 c=K==0?vec3(0,.103,0):(K==1?vec3(0,.06,0):vec3(0,.023,0));vec3 r=K==0?vec3(.046):(K==1?vec3(.024,.035,.024):vec3(.023,.027,.023));float t0=ellipsoid(q,v,c,r);if(t0<t){t=t0;normal=basis*normalize((q+v*t-c)/(r*r));part=k;}}
if(t<stop){vec3 p=q+v*t;float rim=pow(1.-max(dot(normal,-rd),0.),2.),dif=max(dot(normal,light),0.);vec3 material;if(part>1.5){float thread=.75+.25*sin(p.y*420.);material=vec3(.32,.24,.11)*(.28+dif)*thread;material+=vec3(.25,.20,.11)*pow(max(dot(reflect(rd,normal),light),0.),24.);}else{float stem=abs(abs(p.x)-(.009+.008*sin((p.y-.07)*55.)));
float filament=exp(-stem*stem/.000018)*smoothstep(.065,.085,p.y)*(1.-smoothstep(.12,.142,p.y));material=vec3(.07,.12,.16)*(.4+dif)+vec3(1.,.57,.17)*(rim*.55+filament*1.4+.10)*power;material+=reflectedLight(reflect(rd,normal))*(.12+.5*rim);material+=vec3(1.,.48,.12)*pow(max(dot(-normal,light),0.),2.)*.25*power;material+=vec3(1.,.85,.55)*pow(max(dot(reflect(rd,normal),light),0.),32.);}col=material;stop=t;}}
// Occlusion by the globe is tested independently from the bulb envelope.
emission+=vec3(1.,.52,.14)*glow(ro,rd,center+n*.02*scale,.047*scale,globeStop)*power*.23;
if(globeStop<100.)col+=vec3(.18,.075,.014)*exp(-dot(surface-base,surface-base)*130.)*power;
}
// All three arcs converge on the same radially bouncing socket.
for(int J=0;J<3;J++){
 vec3 s=source(g,float(J)),end=destination+outward*.20*bounce;
 vec3 control=(s+end)*.5+normalize(s+end)*.30;
 vec3 boundCenter=(s+end)*.5;
 if(sphere(ro,rd,boundCenter,length(end-s)*.5+.6).y<0.)continue;
 float reveal=smoothstep(1.,3.5,age);
 for(int D=0;D<14;D++){
  float u=float(D)/13.;if(u>reveal)continue;
  vec3 c=mix(mix(s,control,u),mix(control,end,u),u);
  float first=exp(-pow((u-(age-4.)/2.)/.14,2.))*smoothstep(3.8,4.,age);
  float pulse=first+pow(.5+.5*cos(6.283185*(u-(age-6.)/2.666667)),24.)*smoothstep(6.,6.3,age);
  if(D>0){
   float v=u-1./13.;vec3 prev=mix(mix(s,control,v),mix(control,end,v),v);
   vec3 seg=c-prev,w=ro-prev;
   float ss=dot(seg,seg),dr=dot(rd,seg),dw=dot(rd,w),sw=dot(seg,w);
   float q=clamp((sw-dr*dw)/max(ss-dr*dr,.000001),0.,1.);
   vec3 point=prev+seg*q;float depth=dot(point-ro,rd);
   float d=length(ro+rd*depth-point),aa=max(.0006,depth/(iResolution.y*1.8));
   float coverage=(1.-smoothstep(.0015,.0015+aa,d))*.35;
   if(depth>0.&&depth<stop)col=mix(col,vec3(.075,.30,.42),coverage);
  }
  vec2 dh=sphere(ro,rd,c,.0065);
  if(dh.x>0.&&dh.y>0.&&dh.x<stop){col=vec3(.18,.63,.85)*(1.+pulse*2.);stop=dh.x;}
  emission+=vec3(.05,.36,.55)*glow(ro,rd,c,.009,globeStop)*(.12+pulse*.6);
 }
}
}

col+=min(emission,vec3(.8));O=vec4(pow(max(col,0.)/(1.+max(col,0.)),vec3(.454545)),1.);
}
