#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
// Ordered, pixel-aware edges keep existing study geometry stable at every size.
float edgeRamp(float a,float b,float x){float pad=1.0/max(iResolution.y,1.);float v=smoothstep(min(a,b)-pad,max(a,b)+pad,x);return a<b?v:1.-v;}

void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec2 m=iMouse.z>0.? (2.*iMouse.xy-iResolution.xy)/iResolution.y:vec2(sin(iTime*.4)*.25,cos(iTime*.3)*.18); vec3 col=vec3(1.); for(int i=1;i<8;i++){float r=.07*float(i); float ring=edgeRamp(.008,0.,abs(length(p-m)-r)); col-=vec3(.08,.48,.22)*ring*(1.-float(i)/9.); } float point=edgeRamp(.06,0.,length(p-m)); col=mix(col,vec3(.08,.48,.22),point); float ink=clamp(1.-col.r,0.,1.);col+=vec3(.025,.04,.025)*ink*max(0.,1.-length(p-vec2(-.2,.2)));c=vec4(clamp(col,0.,1.),1.);}
