// Host supplies precision, iResolution, iTime and iMouse. One opaque WebGL1 pass.
// Direct ray/plane intersections: no ray marching, feedback buffers or textures.
uniform float uDetail;
const float BAY = 9.0;
const vec3 AMBER = vec3(1.0, 0.48, 0.15);
const vec3 CYAN = vec3(0.23, 0.73, 0.86);

float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float grain(vec2 p) {
  vec2 f = fract(p); vec2 i = floor(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);
}
float line(float d, float width, float aa) { return 1.0-smoothstep(width,width+aa,abs(d)); }
vec3 hexLights(vec2 p, float aa, float time, out float seam) {
  p *= 0.95;
  vec2 period = vec2(1.0,1.7320508);
  vec2 a = mod(p,period)-period*0.5;
  vec2 b = mod(p-period*0.5,period)-period*0.5;
  vec2 h = dot(a,a)<dot(b,b)?a:b;
  vec2 q = abs(h);
  float edge = 0.5-max(q.x,dot(q,vec2(0.5,0.8660254)));
  seam = line(edge,0.006,aa);
  // A shared traveling front crosses the connected edge network continuously.
  float phase = p.x*0.16+p.y*0.22-time*0.13;
  float amberFront = abs(fract(phase)-0.5);
  float cyanFront = abs(fract(p.x*0.12-p.y*0.24+time*0.09)-0.5);
  float energyA = 1.0-smoothstep(0.012,0.07,amberFront);
  float energyC = 1.0-smoothstep(0.009,0.04,cyanFront);
  float glow = exp(-max(edge,0.0)*28.0)*0.13;
  return (AMBER*energyA+CYAN*energyC*0.8)*(seam*1.9+glow);
}

// Keep the nearest positive hit. Face IDs: floor=1, ceiling=2, wall=3, bevel=4.
void hitPlane(vec3 ro,vec3 rd,vec3 normal,float offset,float z0,float z1,
              float id,inout float nearest,inout vec3 n,inout float material) {
  float denom=dot(rd,normal);
  if(abs(denom)<0.0001) return;
  float t=(offset-dot(ro,normal))/denom;
  if(t<=0.001 || t>=nearest) return;
  vec3 p=ro+rd*t;
  if(p.z<z0 || p.z>z1 || p.y<0.0 || p.y>5.8) return;
  if(id==3.0 && p.y>4.65) return;
  if(id==4.0 && p.y<4.65) return;
  nearest=t; n=normalize(normal)*(-sign(denom)); material=id;
}

void mainImage(out vec4 color, in vec2 fragCoord) {
  vec2 uv=(2.0*fragCoord-iResolution.xy)/iResolution.y;
  // Continuous travel avoids a camera or material reset. Only geometry cells repeat.
  float travel=iTime*0.38;
  vec3 ro=vec3(-0.8+0.055*sin(iTime*0.11),1.85,travel+2.0);
  vec3 rd=normalize(vec3(uv.x-0.52,uv.y-0.12,1.65));
  float t=90.0, material=0.0; vec3 n=vec3(0,0,-1);
  if(rd.y<-.0001) { t=-ro.y/rd.y; n=vec3(0,1,0); material=1.0; }
  if(rd.y>.0001) { t=(5.8-ro.y)/rd.y; n=vec3(0,-1,0); material=2.0; }
  t=min(t,90.0);
  float first=floor(ro.z/BAY)*BAY;
  // Ten bays bound scene work. Fog hides the far boundary before it becomes visible.
  for(int i=0;i<10;i++) {
    float start=first+float(i)*BAY;
    // Once the next bay is behind the closest surface, no later hit can win.
    if((start-ro.z)/rd.z>t) break;
    for(int s=0;s<2;s++) {
      float side=s==0?-1.0:1.0;
      // Broad folds alternate between outward and inward slopes, joining exactly.
      float slope=-0.19;
      hitPlane(ro,rd,vec3(side,0,-slope),4.55-slope*start,start,start+4.5,3.0,t,n,material);
      slope=0.19;
      hitPlane(ro,rd,vec3(side,0,-slope),3.695-slope*(start+4.5),start+4.5,start+BAY,3.0,t,n,material);
      // Angled upper wall forms the ceiling shoulder.
      slope=-0.19;
      hitPlane(ro,rd,vec3(side,0.85,-slope),4.55+0.85*4.65-slope*start,start,start+4.5,4.0,t,n,material);
      slope=0.19;
      hitPlane(ro,rd,vec3(side,0.85,-slope),3.695+0.85*4.65-slope*(start+4.5),start+4.5,start+BAY,4.0,t,n,material);
    }
  }
  vec3 p=ro+rd*t;
  float aa=clamp(t/(iResolution.y*1.2),0.002,0.10);
  float detailFade=1.0-smoothstep(15.0,38.0,t);
  vec3 col=vec3(0.014,0.021,0.027);
  if(material==3.0 || material==4.0) {
    vec2 wall=vec2(p.z,p.y);
    float tex=grain(wall*4.0)*0.55+0.45;
    if(uDetail>0.5) tex*=0.88+0.12*grain(wall*75.0);
    float facing=0.5+0.5*max(dot(n,normalize(vec3(-0.5,0.9,-0.35))),0.0);
    col=vec3(0.21,0.24,0.26)*tex*facing;
    float facet=mod(floor(p.z/4.5),2.0);
    col*=mix(0.72,1.35,facet);
    float seam;
    vec3 lights=hexLights(wall,aa,iTime,seam);
    col*=1.0-seam*detailFade*0.65;
    col+=lights*detailFade*(p.x>0.0?1.0:0.38);
    float bayEdge=min(mod(p.z,BAY),BAY-mod(p.z,BAY));
    col*=1.0-line(bayEdge,0.025,aa)*0.65;
    // Thin amber sill anchors the architecture; broad falloff lights the material.
    float sill=abs(p.y-0.075);
    col+=AMBER*(line(sill,0.013,aa)*1.8+exp(-sill*5.5)*0.13);
    float top=abs(p.y-4.64);
    col+=vec3(0.26,0.32,0.34)*line(top,0.018,aa)*0.3;
  } else if(material==1.0) {
    float rough=grain(p.xz*7.0);
    col=vec3(0.075,0.09,0.10)*(0.65+0.35*rough);
    float jointX=min(mod(p.x+9.0,3.0),3.0-mod(p.x+9.0,3.0));
    float jointZ=min(mod(p.z,4.5),4.5-mod(p.z,4.5));
    col*=1.0-max(line(jointX,0.006,aa),line(jointZ,0.006,aa))*0.6*detailFade;
    float width=4.55-0.19*min(mod(p.z,BAY),BAY-mod(p.z,BAY));
    float wallDist=abs(abs(p.x)-width);
    col+=AMBER*(0.23*exp(-wallDist*2.0)+0.32*exp(-wallDist*12.0));
    // Approximate rough reflections with surface-space light bands, no second trace.
    float reflection=pow(max(0.0,sin(p.z*1.45-iTime*0.32)),14.0);
    col+=mix(CYAN,AMBER,step(0.0,sin(p.z*0.7)))*reflection*
      exp(-wallDist*0.95)*0.09*(0.5+0.5*rough);
    col+=vec3(0.045,0.058,0.065)*pow(1.0-max(dot(n,-rd),0.0),4.0);
  } else if(material==2.0) {
    col=vec3(0.044,0.055,0.06)*(0.7+0.3*grain(p.xz*3.0));
    float beam=abs(mod(p.z+0.12,BAY)-0.12);
    col*=1.0-line(beam,0.09,aa)*0.7;
    col+=CYAN*0.035*exp(-abs(p.x-1.8)*8.0);
  }
  float fog=1.0-exp(-t*t*0.0013);
  col=mix(col,vec3(0.023,0.033,0.040),fog);
  col=col/(1.0+col); // Bounded highlights, even when pulses overlap.
  col=pow(max(col,vec3(0.0)),vec3(0.82));
  color=vec4(col,1.0);
}
