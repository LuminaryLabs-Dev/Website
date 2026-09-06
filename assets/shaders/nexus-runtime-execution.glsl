#ifdef GL_ES
precision highp float;
#endif
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;
// Ordered, pixel-aware edges keep existing study geometry stable at every size.
float edgeRamp(float a,float b,float x){float pad=1.0/max(iResolution.y,1.);float v=smoothstep(min(a,b)-pad,max(a,b)+pad,x);return a<b?v:1.-v;}

float circle(vec2 p,float r){return edgeRamp(r,r-.012,length(p));}
void mainImage(out vec4 c,in vec2 f){vec2 p=(2.*f-iResolution.xy)/iResolution.y; vec3 col=vec3(1.); float orbit=iTime*.42; for(int i=0;i<8;i++){float a=6.283*float(i)/8.+orbit; vec2 q=vec2(cos(a),sin(a))*.52; float n=circle(p-q,.065); col=mix(col,vec3(.08,.48,.22),n); float beam=edgeRamp(.008,0.,abs(cross(vec3(p,0.)-vec3(q,0.),vec3(cos(a),sin(a),0.)).z)); col-=vec3(.08,.48,.22)*beam*.08;} float core=circle(p,.14); col=mix(col,vec3(.03,.25,.11),core); float ink=clamp(1.-col.r,0.,1.);col+=vec3(.025,.04,.025)*ink*max(0.,1.-length(p-vec2(-.2,.2)));c=vec4(clamp(col,0.,1.),1.);}
