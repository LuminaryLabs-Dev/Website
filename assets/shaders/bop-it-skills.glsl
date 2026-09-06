#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
// Ordered, pixel-aware edges keep existing study geometry stable at every size.
float edgeRamp(float a,float b,float x){float pad=1.0/max(iResolution.y,1.);float v=smoothstep(min(a,b)-pad,max(a,b)+pad,x);return a<b?v:1.-v;}

float dotNode(vec2 p,vec2 q){return edgeRamp(.06,0.,length(p-q));}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec3 col=vec3(1.); float t=fract(iTime*.12); for(int i=0;i<6;i++){float a=6.283*float(i)/6.; vec2 q=vec2(cos(a),sin(a))*.48; float n=dotNode(p,q); col=mix(col,vec3(.08,.48,.22),n); float path=edgeRamp(.012,0.,abs(length(p)-.48))*edgeRamp(.9,.1,abs(sin(a))); col-=vec3(.08,.48,.22)*path*.08;} vec2 active=vec2(-.48+fract(t)*.96,0.); col+=vec3(.08,.48,.22)*dotNode(p,active)*1.4; col=mix(col,vec3(.03,.25,.11),dotNode(p,vec2(0.))); float ink=clamp(1.-col.r,0.,1.);col+=vec3(.025,.04,.025)*ink*max(0.,1.-length(p-vec2(-.2,.2)));c=vec4(clamp(col,0.,1.),1.);}
