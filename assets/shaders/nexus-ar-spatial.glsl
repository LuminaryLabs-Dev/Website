#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec2 m=iMouse.z>0.? (2.*iMouse.xy-iResolution.xy)/iResolution.y:vec2(sin(iTime*.4)*.25,cos(iTime*.3)*.18); vec3 col=vec3(1.); for(int i=1;i<8;i++){float r=.07*float(i); float ring=smoothstep(.008,0.,abs(length(p-m)-r)); col-=vec3(.08,.48,.22)*ring*(1.-float(i)/9.); } float point=smoothstep(.06,0.,length(p-m)); col=mix(col,vec3(.08,.48,.22),point); c=vec4(col,1.);}
