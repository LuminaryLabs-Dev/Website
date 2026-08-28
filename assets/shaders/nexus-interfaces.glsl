#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
float line(float x,float w){return smoothstep(w,0.,abs(x));}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec3 col=vec3(1.); float split=sin(iTime*.35)*.05; for(int i=0;i<4;i++){float x=-.54+float(i)*.36+split; float panel=smoothstep(.012,0.,abs(p.x-x))*(1.-smoothstep(.28,.30,abs(p.y))); col-=vec3(.08,.48,.22)*panel*.28; float node=smoothstep(.055,0.,length(p-vec2(x,.0))); col=mix(col,vec3(.08,.48,.22),node);} float route=line(p.y,.008)*smoothstep(.9,.2,abs(p.x)); col-=vec3(.08,.48,.22)*route*.55; c=vec4(col,1.);}
