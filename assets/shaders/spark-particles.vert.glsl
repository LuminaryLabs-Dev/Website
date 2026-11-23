precision highp float;
attribute vec3 aSpawn;
attribute float aBirthTime;
attribute vec3 aVelocity;
attribute float aLifetime;
attribute float aDrag;
attribute float aSizeMix;
attribute float aType;
attribute float aColorClass;

uniform vec2 uResolution;
uniform float uTime;          // seconds since click
uniform float uSceneTime;     // main renderer time

varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vType;
varying float vColorClass;

vec3 projectBulbPoint(vec3 point)
{
    vec3 ro=vec3(0.055*sin(uSceneTime*0.23),
                 0.045+0.025*sin(uSceneTime*0.19),3.75);
    // Match the camera push and recoil in fractal-filament.glsl exactly.
    ro.z+=0.065*exp(-uTime*13.0)*sin(uTime*34.0)
         -1.28*smoothstep(0.95,1.85,uTime);
    vec3 target=vec3(0.018*sin(uSceneTime*1.35),
                     -0.06+0.014*sin(uSceneTime*1.72),0.0);
    vec3 forward=normalize(target-ro);
    vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0)));
    vec3 up=cross(right,forward);
    vec3 view=point-ro;
    float depth=dot(view,forward);
    float safeDepth=max(depth,0.01);
    return vec3(1.86*dot(view,right)/safeDepth,
                1.86*dot(view,up)/safeDepth,depth);
}

void main()
{
    // One-shot 3D ballistic particles; no modulo or camera-aligned radial burst.
    float ageSeconds=uTime-aBirthTime;
    float t=max(ageSeconds,0.0);
    float alive=step(0.0,ageSeconds)*(1.0-step(aLifetime,t));
    float drag=max(aDrag,0.05);
    float travel=(1.0-exp(-drag*t))/drag;
    vec3 point=aSpawn+aVelocity*travel;
    float gravity=aType>1.5 ? 0.58 : (aType>0.5 ? 1.30 : 1.74);
    point.y-=0.5*gravity*t*t;
    // Small lateral turbulence: enough to feel like a toy, never a 2D overlay.
    point.x+=0.018*sin(t*8.0+aSpawn.x*25.0)*t;
    point.z+=0.012*cos(t*6.0+aSpawn.z*17.0)*t;
    vec3 projected=projectBulbPoint(point);
    vec3 projectionNext=projectBulbPoint(point+aVelocity*0.022);
    vec2 direction=projectionNext.xy-projected.xy;
    vDirection=normalize(direction+vec2(0.00001));
    float aspect=uResolution.x/max(uResolution.y,1.0);
    gl_Position=alive>0.5&&projected.z>0.2
        ? vec4(projected.x/aspect,projected.y,0.0,1.0)
        : vec4(2.0,2.0,0.0,1.0);
    float perspective=clamp(3.75/max(projected.z,0.4),0.55,2.5);
    gl_PointSize=clamp(mix(3.0,8.0,aSizeMix)
                 *perspective*(aType>0.5&&aType<1.5?1.35:1.0),2.0,18.0);
    vAge=clamp(t/max(aLifetime,0.001),0.0,1.0);
    vAlpha=alive*clamp((projected.z-0.2)*4.0,0.0,1.0)
          *smoothstep(0.0,0.055,t)
          *(1.0-smoothstep(0.64,1.0,vAge))
          *mix(1.0,0.36,aSizeMix);
    vSizeMix=aSizeMix;
    vType=aType;
    vColorClass=aColorClass;
}
