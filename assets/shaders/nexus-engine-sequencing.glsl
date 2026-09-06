#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
// Ordered, pixel-aware edges keep existing study geometry stable at every size.
float edgeRamp(float a,float b,float x){float pad=1.0/max(iResolution.y,1.);float v=smoothstep(min(a,b)-pad,max(a,b)+pad,x);return a<b?v:1.-v;}

float box(vec2 p, vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; float hover=iMouse.z>0.?iMouse.x/iResolution.x:.5; float pulse=fract(iTime*.16); vec3 col=vec3(1.); for(int i=0;i<5;i++){float x=-.72+float(i)*.36; float node=edgeRamp(.045,.0,box(p-vec2(x,0.),vec2(.055,.055))); float active=edgeRamp(.08,.0,abs(p.x-(x-.72+fract(pulse)*1.44)))*edgeRamp(.035,.0,abs(p.y)); col=mix(col,vec3(.08,.48,.22),node); col+=vec3(.08,.48,.22)*active*.8;} for(int i=0;i<4;i++){float x=-.54+float(i)*.36; float line=edgeRamp(.012,0.,abs(p.y-.0))*edgeRamp(.012,0.,abs(p.x-x-.18)); col-=vec3(.08,.48,.22)*line*.35;} float ink=clamp(1.-col.r,0.,1.);col+=vec3(.025,.04,.025)*ink*max(0.,1.-length(p-vec2(-.2,.2)));c=vec4(clamp(col,0.,1.),1.);}
