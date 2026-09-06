#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
// Ordered, pixel-aware edges keep existing study geometry stable at every size.
float edgeRamp(float a,float b,float x){float pad=1.0/max(iResolution.y,1.);float v=smoothstep(min(a,b)-pad,max(a,b)+pad,x);return a<b?v:1.-v;}

float line(float x,float w){return edgeRamp(w,0.,abs(x));}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec3 col=vec3(1.); float split=sin(iTime*.35)*.05; for(int i=0;i<4;i++){float x=-.54+float(i)*.36+split; float panel=edgeRamp(.012,0.,abs(p.x-x))*(1.-edgeRamp(.28,.30,abs(p.y))); col-=vec3(.08,.48,.22)*panel*.28; float node=edgeRamp(.055,0.,length(p-vec2(x,.0))); col=mix(col,vec3(.08,.48,.22),node);} float route=line(p.y,.008)*edgeRamp(.9,.2,abs(p.x)); col-=vec3(.08,.48,.22)*route*.55; float ink=clamp(1.-col.r,0.,1.);col+=vec3(.025,.04,.025)*ink*max(0.,1.-length(p-vec2(-.2,.2)));c=vec4(clamp(col,0.,1.),1.);}
