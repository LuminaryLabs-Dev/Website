precision highp float;

attribute vec3 aSpawn;
attribute float aBirthTime;
attribute float aSpeed;
attribute float aCurlPhase;
attribute float aSizeMix;
attribute float aColorClass;

uniform vec2 uResolution;
uniform float uTime;
uniform float uLifetime;
uniform float uCycleDuration;

varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vColorClass;

vec2 projectBulbPoint(vec3 point, float time)
{
    vec3 rayOrigin = vec3(
        0.055 * sin(time * 0.23),
        0.045 + 0.025 * sin(time * 0.19),
        3.75
    );

    vec3 target = vec3(
        0.018 * sin(time * 1.35),
        -0.06 + 0.014 * sin(time * 1.72),
        0.0
    );

    vec3 forward = normalize(target - rayOrigin);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 view = point - rayOrigin;
    float depth = max(dot(view, forward), 0.0001);

    return vec2(
        1.86 * dot(view, right) / depth,
        1.86 * dot(view, up) / depth
    );
}

void main()
{
    float elapsed = mod(
        uTime - aBirthTime + uCycleDuration,
        uCycleDuration
    );

    float isAlive = 1.0 - step(uLifetime, elapsed);
    float age = min(elapsed / uLifetime, 1.0);

    vec2 edge = projectBulbPoint(aSpawn, uTime);
    vec2 direction = edge / max(length(edge), 0.0001);
    vec2 tangent = vec2(-direction.y, direction.x);

    float radialDistance =
        aSpeed * elapsed
        + 0.5 * 0.10 * elapsed * elapsed;

    float curlEnvelope =
        smoothstep(0.0, 0.18, age)
        * (1.0 - smoothstep(0.82, 1.0, age));

    float curl =
        0.018
        * sin(4.2 * elapsed + aCurlPhase)
        * curlEnvelope;

    vec2 particle =
        edge
        + direction * radialDistance
        + tangent * curl;

    float aspect = uResolution.x / max(uResolution.y, 1.0);
    gl_Position = isAlive > 0.5
        ? vec4(particle.x / aspect, particle.y, 0.0, 1.0)
        : vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = mix(4.0, 18.0, aSizeMix);

    vDirection = direction;
    vAge = age;
    vAlpha =
        smoothstep(0.0, 0.06, age)
        * (1.0 - smoothstep(0.68, 1.0, age))
        * mix(1.0, 0.28, aSizeMix)
        * isAlive;
    vSizeMix = aSizeMix;
    vColorClass = aColorClass;
}
