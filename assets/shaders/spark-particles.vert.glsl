precision highp float;
attribute vec3 aSpawn;
attribute float aBirthTime;
attribute float aSpeed;
attribute float aCurlPhase;
attribute float aSizeMix;
attribute float aColorClass;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSceneTime;
uniform float uLifetime;
uniform float uCycleDuration;

varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vColorClass;

vec2 projectBulbPoint(vec3 point)
{
    vec3 ro = vec3(0.055*sin(uSceneTime*0.23),0.045+0.025*sin(uSceneTime*0.19),3.75);
    ro.z -= 1.28 * smoothstep(0.62,1.13,max(uTime,0.0));
    vec3 target = vec3(0.018*sin(uSceneTime*1.35),-0.06+0.014*sin(uSceneTime*1.72),0.0);
    vec3 forward = normalize(target-ro);
    vec3 right = normalize(cross(forward,vec3(0.0,1.0,0.0)));
    vec3 up = cross(right,forward);
    vec3 rel = point-ro;
    float depth = max(dot(rel,forward),0.0001);
    return vec2(1.86*dot(rel,right)/depth,1.86*dot(rel,up)/depth);
}
void main()
{
    // No modulo: a clicked eruption must never repeat.
    float elapsed = uTime-aBirthTime;
    float alive = step(0.0,elapsed)*(1.0-step(uLifetime,elapsed));
    float t = max(0.0,elapsed);
    float phase = aCurlPhase;
    vec3 velocity = normalize(vec3(cos(phase),0.55+0.5*sin(phase*2.7),sin(phase)*0.75));
    velocity *= aSpeed;
    // Quadratic gravity with damped ballistic travel and slight lateral curl.
    vec3 travel = velocity*((1.0-exp(-0.53*t))/0.53);
    travel.y -= 0.5*1.65*t*t;
    travel.x += 0.035*sin(t*11.0+phase)*t;
    vec3 position = aSpawn+travel;
    vec2 projected = projectBulbPoint(position);
    vec2 projectedAhead = projectBulbPoint(position+velocity*0.028);
    vDirection = normalize(projectedAhead-projected+vec2(0.00001));
    float aspect = uResolution.x/max(uResolution.y,1.0);
    gl_Position = alive>0.5
        ? vec4(projected.x/aspect,projected.y,0.0,1.0)
        : vec4(2.0,2.0,0.0,1.0);
    gl_PointSize = mix(3.0,10.0,aSizeMix);
    vAge = clamp(t/uLifetime,0.0,1.0);
    vAlpha = alive
        *smoothstep(0.0,0.045,t)
        *(1.0-smoothstep(0.63,1.0,vAge))
        *mix(1.0,0.3,aSizeMix);
    vSizeMix = aSizeMix;
    vColorClass = aColorClass;
}
