#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
float box(vec2 p, vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; float hover=iMouse.z>0.?iMouse.x/iResolution.x:.5; float pulse=fract(iTime*.16); vec3 col=vec3(1.); for(int i=0;i<5;i++){float x=-.72+float(i)*.36; float node=smoothstep(.045,.0,box(p-vec2(x,0.),vec2(.055,.055))); float active=smoothstep(.08,.0,abs(p.x-(x-.72+fract(pulse)*1.44)))*smoothstep(.035,.0,abs(p.y)); col=mix(col,vec3(.08,.48,.22),node); col+=vec3(.08,.48,.22)*active*.8;} for(int i=0;i<4;i++){float x=-.54+float(i)*.36; float line=smoothstep(.012,0.,abs(p.y-.0))*smoothstep(.012,0.,abs(p.x-x-.18)); col-=vec3(.08,.48,.22)*line*.35;} c=vec4(col,1.);}
