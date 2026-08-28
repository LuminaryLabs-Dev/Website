#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
float dotNode(vec2 p,vec2 q){return smoothstep(.06,0.,length(p-q));}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec3 col=vec3(1.); float t=fract(iTime*.12); for(int i=0;i<6;i++){float a=6.283*float(i)/6.; vec2 q=vec2(cos(a),sin(a))*.48; float n=dotNode(p,q); col=mix(col,vec3(.08,.48,.22),n); float path=smoothstep(.012,0.,abs(length(p)-.48))*smoothstep(.9,.1,abs(sin(a))); col-=vec3(.08,.48,.22)*path*.08;} vec2 active=vec2(-.48+fract(t)*.96,0.); col+=vec3(.08,.48,.22)*dotNode(p,active)*1.4; col=mix(col,vec3(.03,.25,.11),dotNode(p,vec2(0.))); c=vec4(col,1.);}
