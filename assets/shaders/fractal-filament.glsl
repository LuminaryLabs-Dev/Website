/*
    FRACTAL FILAMENT — OVERSTEP EDITION
    ShaderToy / Image pass / single pass

    3D SDF ray marching with adaptive over-relaxed sphere tracing.
    No textures, buffers, or channels required.
*/

#define PI 3.14159265359
#define FAR_CLIP 8.0
#define HIT_EPS 0.0012
#define GLASS_STEPS 64
#define SOLID_STEPS 72
#define GLOW_STEPS 24
#define OVERSTEP 1.42

uniform float uPower;
// Negative while idle. Seconds since deliberate visitor activation otherwise.
uniform float uVfxTime;
uniform float uHover;
uniform float uPointerSpeed;
uniform float uBurstSeed;
// Zero defaults preserve the fullscreen intro; only the hero cover opts in.
uniform float uLoadingCover;
uniform vec3 uBulbOffset;
uniform vec2 uBulbTilt;
uniform float uStarA;
uniform float uStarB;
uniform float uStarC;

float sat(float x) { return clamp(x, 0.0, 1.0); }

mat2 rot(float a)
{
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

float hash21(vec2 p)
{
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float smin(float a, float b, float k)
{
    float h = sat(0.5 + 0.5 * (b - a) / k);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}

float sdEllipsoid(vec3 p, vec3 r)
{
    float k0 = length(p / r);
    float k1 = length(p / (r * r));
    return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float sdCappedCylinder(vec3 p, float halfHeight, float radius)
{
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(radius, halfHeight);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float radius)
{
    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = sat(dot(pa, ba) / dot(ba, ba));
    return length(pa - ba * h) - radius;
}

float sdCappedCone(vec3 p, float h, float r1, float r2)
{
    vec2 q = vec2(length(p.xz), p.y);
    vec2 k1 = vec2(r2, h);
    vec2 k2 = vec2(r2 - r1, 2.0 * h);
    vec2 ca = vec2(q.x - min(q.x, q.y < 0.0 ? r1 : r2), abs(q.y) - h);
    vec2 cb = q - k1 + k2 * sat(dot(k1 - q, k2) / dot(k2, k2));
    float signValue = cb.x < 0.0 && ca.y < 0.0 ? -1.0 : 1.0;
    return signValue * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

#define TAU 6.28318530718

float wrapPi(float angle)
{
    return mod(angle + PI, TAU) - PI;
}

float quinticBoundary(
    float radiusA,
    float radiusB,
    float slopeA,
    float slopeB,
    float curvatureA,
    float curvatureB,
    float t,
    float span
)
{
    float c0 = radiusA;
    float c1 = slopeA * span;
    float c2 = 0.5 * curvatureA * span * span;

    float remainingRadius =
        radiusB - (c0 + c1 + c2);

    float remainingSlope =
        slopeB * span - (c1 + 2.0 * c2);

    float remainingCurvature =
        curvatureB * span * span - 2.0 * c2;

    float c3 =
          10.0 * remainingRadius
        -  4.0 * remainingSlope
        +  0.5 * remainingCurvature;

    float c4 =
        -15.0 * remainingRadius
        +  7.0 * remainingSlope
        -        remainingCurvature;

    float c5 =
          6.0 * remainingRadius
        - 3.0 * remainingSlope
        + 0.5 * remainingCurvature;

    return c0
         + c1 * t
         + c2 * t * t
         + c3 * t * t * t
         + c4 * t * t * t * t
         + c5 * t * t * t * t * t;
}

float directionalGlobeRadius(vec3 p)
{
    float angle = atan(p.z, p.x);
    float directionX = cos(angle);
    float directionZ = sin(angle);

    return inversesqrt(
        directionX * directionX / (0.73 * 0.73)
        + directionZ * directionZ / (0.71 * 0.71)
    );
}

float globeProfileRadius(vec3 p)
{
    float horizontalRadius =
        directionalGlobeRadius(p);

    float normalizedY =
        (p.y - 0.40) / 0.80;

    return horizontalRadius
        * sqrt(max(
            0.0,
            1.0 - normalizedY * normalizedY
        ));
}

float glassProfileRadius(vec3 p)
{
    const float neckRadius = 0.320;

    // Hidden fourth section.
    const float insertionTopY = -0.540;
    const float insertionBottomY = -0.700;
    const float insertionRadius = 0.260;

    // Visible shoulder.
    const float shoulderStart = -0.440;
    const float globeJoinY = 0.140;

    // Section 4: hidden insertion taper.
    if (p.y < insertionTopY)
    {
        if (p.y <= insertionBottomY)
        {
            return insertionRadius;
        }

        float t = clamp(
            (p.y - insertionBottomY)
            / (insertionTopY - insertionBottomY),
            0.0,
            1.0
        );

        // Quintic smootherstep gives zero slope and
        // zero curvature at both ends.
        float blend =
            t * t * t
            * (t * (t * 6.0 - 15.0) + 10.0);

        return mix(
            insertionRadius,
            neckRadius,
            blend
        );
    }

    // Section 3: visible straight neck.
    if (p.y <= shoulderStart)
    {
        return neckRadius;
    }

    // Section 1: upper globe.
    if (p.y >= globeJoinY)
    {
        return globeProfileRadius(p);
    }

    // Section 2: curvature-matched shoulder.
    float horizontalRadius =
        directionalGlobeRadius(p);

    const float globeCenterY = 0.40;
    const float globeRadiusY = 0.80;

    float normalizedJoinY =
        (globeJoinY - globeCenterY)
        / globeRadiusY;

    float root = sqrt(max(
        0.000001,
        1.0 - normalizedJoinY * normalizedJoinY
    ));

    float joinRadius =
        horizontalRadius * root;

    float joinSlope =
        -horizontalRadius * normalizedJoinY
        / (globeRadiusY * root);

    float joinCurvature =
        -horizontalRadius
        / (
            globeRadiusY
            * globeRadiusY
            * root
            * root
            * root
        );

    float span =
        globeJoinY - shoulderStart;

    float t = clamp(
        (p.y - shoulderStart) / span,
        0.0,
        1.0
    );

    return quinticBoundary(
        neckRadius,
        joinRadius,
        0.0,
        joinSlope,
        0.0,
        joinCurvature,
        t,
        span
    );
}

float glassSDF(vec3 p)
{
    const float bottomY = -0.740;
    const float topY = 1.200;
    const float derivativeStep = 0.002;

    float radius = glassProfileRadius(p);
    float radial = length(p.xz);

    // Estimate the profile slope. Dividing by this gradient length
    // makes the radial profile safer for sphere tracing.
    vec3 above = p + vec3(0.0, derivativeStep, 0.0);
    vec3 below = p - vec3(0.0, derivativeStep, 0.0);

    float radiusAbove = glassProfileRadius(above);
    float radiusBelow = glassProfileRadius(below);

    float radiusSlope = (
        radiusAbove - radiusBelow
    ) / (2.0 * derivativeStep);

    float side = (radial - radius)
        / sqrt(1.0 + radiusSlope * radiusSlope);

    // Close the profile at its top and bottom.
    float verticalCap = max(
        bottomY - p.y,
        p.y - topY
    );

    float d = max(side, verticalCap);

    // Preserve the existing subtle liquid motion.
    d += (uLoadingCover > 0.5 ? 0.0 : 0.003)
       * sin(p.y * 9.0 + p.x * 5.0 + iTime * 0.7)
       * sin(p.z * 7.0 - iTime * 0.43);

    // Conservative sphere-tracing factor.
    return d * 0.86;
}

// Lamp anatomy: short helical tungsten element, lead-in conductors,
// stabilizing hooks, and a separate clear-glass exhaust/stem assembly.
// Geometry is intentionally static; the ignition is handled by emission.
float filamentRawSDF(vec3 p)
{
    // A compact horizontal tungsten coil, not decorative luminous loops.
    const float x0 = -0.205;
    const float x1 = 0.205;
    const float turns = 17.0;
    float x = clamp(p.x, x0, x1);
    float theta = (x - x0) / (x1 - x0) * turns * TAU;
    vec3 center = vec3(x, 0.105 + 0.028 * sin(theta),
                              0.026 * cos(theta));
    // A slight distance reduction prevents diagonal-coil breaks in tracing.
    float coil = length(p-center)-0.0095;
    // Straight conductive ends connect the coil to the two support hooks.
    float a = sdCapsule(p,vec3(-0.230,0.095,0.0),vec3(x0,0.105,0.026),0.009);
    float b = sdCapsule(p,vec3(x1,0.105,0.026),vec3(0.230,0.095,0.0),0.009);
    return min(coil,min(a,b));
}

float supportSDF(vec3 p)
{
    // Two separate conductive lead-in wires from the glass press to coil ends.
    float left = sdCapsule(p,vec3(-0.105,-0.47,0.0),vec3(-0.225,0.09,0.0),0.011);
    float right = sdCapsule(p,vec3(0.105,-0.47,0.0),vec3(0.225,0.09,0.0),0.011);
    // Small tungsten hooks at the ends of the glowing element.
    left=min(left,sdCapsule(p,vec3(-0.225,0.09,0.0),vec3(-0.230,0.105,0.0),0.012));
    right=min(right,sdCapsule(p,vec3(0.225,0.09,0.0),vec3(0.230,0.105,0.0),0.012));
    return min(left,right);
}

float mountSDF(vec3 p)
{
    // Pale inner glass stem, press seal, and narrow exhaust tube.
    float stem=sdCappedCylinder(p-vec3(0.0,-0.295,0.0),0.24,0.041);
    float press=sdEllipsoid(p-vec3(0.0,-0.49,0.0),vec3(0.135,0.085,0.07));
    float exhaust=sdCappedCylinder(p-vec3(0.0,-0.01,0.0),0.055,0.014);
    return min(stem,min(press,exhaust));
}

float baseSDF(vec3 p)
{
    // Slightly tapered metal shell.
    vec3 corePoint = p - vec3(0.0, -0.91, 0.0);

    float core = sdCappedCone(
        corePoint,
        0.315,
        0.270,
        0.292
    );

    // True helical ridge.
    const float threadBottom = -1.205;
    const float threadTop = -0.660;
    const float threadCenterY = -0.9325;

    const float pitch = 0.120;
    const float ridgeRadius = 0.313;
    const float threadRadius = 0.028;

    float radial = length(p.xz);
    float angle = atan(p.z, p.x);

    float phase = wrapPi(
        angle
        - TAU * (p.y - threadBottom) / pitch
    );

    // Convert angular phase into approximate physical distance
    // perpendicular to the helix.
    float phaseMetric = sqrt(
        1.0 / (ridgeRadius * ridgeRadius)
        + (TAU * TAU) / (pitch * pitch)
    );

    float acrossHelix = phase / phaseMetric;

    float thread = length(vec2(
        radial - ridgeRadius,
        acrossHelix
    )) - threadRadius;

    float threadBounds = abs(
        p.y - threadCenterY
    ) - 0.2725;

    thread = max(thread, threadBounds);

    // Small blend attaches the thread cleanly to the shell.
    float body = smin(core, thread, 0.008);

    float collar = sdCappedCylinder(
        p - vec3(0.0, -0.59, 0.0),
        0.065,
        0.345
    );

    // Separate electrical contact and non-conductive spacer are traced below.
    return min(body, collar) * 0.72;
}

float insulatorSDF(vec3 p)
{
    return sdCappedCylinder(p-vec3(0.0,-1.265,0.0),0.052,0.217);
}
float contactSDF(vec3 p)
{
    return sdEllipsoid(p-vec3(0.0,-1.345,0.0),vec3(0.108,0.075,0.108));
}

// Material IDs: 1 brass shell, 2 leads, 3 tungsten, 4 glass,
// 5 electrical insulator, 6 bottom electrical contact.
vec2 solidScene(vec3 p)
{
    vec2 result = vec2(FAR_CLIP, 0.0);

    float base = baseSDF(p);
    if (base < result.x) result = vec2(base, 1.0);

    float insulator = insulatorSDF(p)*0.75;
    if (insulator < result.x) result = vec2(insulator, 5.0);
    float contact = contactSDF(p)*0.75;
    if (contact < result.x) result = vec2(contact, 6.0);

    float support = supportSDF(p);
    if (support < result.x) result = vec2(support, 2.0);

    float mount = mountSDF(p) * 0.85;
    if (mount < result.x) result = vec2(mount, 4.0);

    // Conservative step for tightly wound tungsten.
    float filament = filamentRawSDF(p) * 0.55;
    if (filament < result.x) result = vec2(filament, 3.0);

    return result;
}

/*
    Adaptive over-relaxed sphere tracing.

    A normal step uses distance * OVERSTEP. If the distance spheres at two
    consecutive samples stop overlapping, the accelerated step may have crossed
    a surface. We then roll back and take the previous guaranteed-safe step.
*/
float traceGlass(vec3 ro, vec3 rd)
{
    float t = 0.0;
    float previousRadius = 1e6;
    float previousStep = 0.0;
    float relaxation = OVERSTEP;

    for (int i = 0; i < GLASS_STEPS; i++)
    {
        float signedDistance = glassSDF(ro + rd * t);
        float radius = abs(signedDistance);

        if (radius < HIT_EPS * (1.0 + 0.08 * t)) return t;
        if (t > FAR_CLIP) break;

        bool failed = signedDistance < 0.0
                   || previousStep > previousRadius + radius;

        if (failed)
        {
            t -= previousStep;
            t += previousRadius;
            previousStep = 0.0;
            previousRadius = 1e6;
            relaxation = 1.0;
        }
        else
        {
            previousRadius = radius;
            previousStep = radius * relaxation;
            t += previousStep;
            relaxation = min(OVERSTEP, relaxation + 0.06);
        }
    }

    return FAR_CLIP;
}

vec2 traceSolid(vec3 ro, vec3 rd)
{
    float t = 0.0;
    float material = 0.0;
    float previousRadius = 1e6;
    float previousStep = 0.0;
    float relaxation = OVERSTEP;

    for (int i = 0; i < SOLID_STEPS; i++)
    {
        vec2 scene = solidScene(ro + rd * t);
        float signedDistance = scene.x;
        float radius = abs(signedDistance);

        if (radius < HIT_EPS * (1.0 + 0.08 * t))
        {
            material = scene.y;
            break;
        }

        if (t > FAR_CLIP) break;

        bool failed = signedDistance < 0.0
                   || previousStep > previousRadius + radius;

        if (failed)
        {
            t -= previousStep;
            t += previousRadius;
            previousStep = 0.0;
            previousRadius = 1e6;
            relaxation = 1.0;
        }
        else
        {
            previousRadius = radius;
            previousStep = radius * relaxation;
            t += previousStep;
            relaxation = min(OVERSTEP, relaxation + 0.06);
        }
    }

    if (material == 0.0) t = FAR_CLIP;
    return vec2(t, material);
}

vec3 glassNormal(vec3 p)
{
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
        glassSDF(p + e.xyy) - glassSDF(p - e.xyy),
        glassSDF(p + e.yxy) - glassSDF(p - e.yxy),
        glassSDF(p + e.yyx) - glassSDF(p - e.yyx)
    ));
}

vec3 solidNormal(vec3 p)
{
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
        solidScene(p + e.xyy).x - solidScene(p - e.xyy).x,
        solidScene(p + e.yxy).x - solidScene(p - e.yxy).x,
        solidScene(p + e.yyx).x - solidScene(p - e.yyx).x
    ));
}

// Smooth bounded fractal: keeps the abstract layered look without hard fold seams.
float foldedFractal(vec3 p)
{
    float sum = 0.0;
    float weight = 0.52;

    p.xy *= rot(0.43 + 0.08 * sin(iTime * 0.21));
    p.yz *= rot(-0.37);

    for (int i = 0; i < 4; i++)
    {
        float wave = 0.5 + 0.5 * sin(
            p.x * 2.7 +
            sin(p.y * 1.9) * 1.35 +
            p.z * 2.1 +
            float(i) * 1.73
        );

        sum += weight * wave;
        p = p * 1.83 + vec3(0.37, -0.29, 0.41);
        p.xy *= rot(0.53);
        p.yz *= rot(-0.41);
        weight *= 0.52;
    }

    return sat(sum * 1.35);
}

vec3 energyColor(float signal)
{
    vec3 red = vec3(1.35, 0.018, 0.003);
    vec3 green = vec3(0.004, 1.05, 0.09);
    return mix(red, green, smoothstep(-0.16, 0.16, signal));
}

vec2 raySphere(vec3 ro, vec3 rd, vec3 center, float radius)
{
    vec3 oc = ro - center;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}

vec3 integrateFilamentGlow(vec3 ro, vec3 rd, vec2 pixel)
{
    vec2 bounds = raySphere(ro, rd, vec3(0.0, 0.18, 0.0), 0.86);
    if (bounds.x < 0.0) return vec3(0.0);

    bounds.x = max(bounds.x, 0.0);
    float stepSize = (bounds.y - bounds.x) / float(GLOW_STEPS);
    float jitter = hash21(pixel);
    vec3 glow = vec3(0.0);

    for (int i = 0; i < GLOW_STEPS; i++)
    {
        float t = bounds.x + (float(i) + jitter) * stepSize;
        vec3 p = ro + rd * t;
        float fd = max(filamentRawSDF(p), 0.0);

        // Smooth moving field; the old product-of-sines created visible cross artifacts.
        float field = 0.5 + 0.5 * sin(
            p.x * 8.0 +
            sin(p.y * 5.0 - iTime * 0.7) * 1.7 +
            p.z * 7.0 +
            iTime * 1.25
        );

        float signal = sin(p.y * 12.0 + field * 3.5 - iTime * 1.8);
        float aura = exp(-12.0 * fd) * (0.38 + 0.42 * field);
        float core = exp(-72.0 * fd);

        glow += energyColor(signal) * aura * stepSize * 0.64;
        glow += vec3(1.5, 1.03, 0.34) * core * stepSize * 1.5;
    }

    return glow;
}

vec3 shadeSolid(vec3 p, vec3 rd, float material)
{
    vec3 n = solidNormal(p);
    vec3 lightDirection = normalize(vec3(-0.55, 0.80, 0.65));
    vec3 halfVector = normalize(lightDirection - rd);
    float diffuse = max(dot(n, lightDirection), 0.0);
    float specular = pow(max(dot(n, halfVector), 0.0), 48.0);
    float rim = pow(1.0 + dot(n, rd), 3.0);

    if (material < 1.5)
    {
        float threadAngle = atan(p.z, p.x);

        float threadPhase = wrapPi(
            threadAngle
            - TAU * (p.y + 1.205) / 0.120
        );

        float helicalHighlight = pow(
            0.5 + 0.5 * cos(threadPhase),
            8.0
        );

        float threadRegion =
            step(-1.205, p.y)
            * step(p.y, -0.660);

        float threads = mix(
            0.32,
            helicalHighlight,
            threadRegion
        );

        float movingHighlight = pow(sat(1.0 - abs(p.x - 0.10 * sin(iTime * 0.25)) * 4.8), 6.0);

        vec3 metal = mix(
            vec3(0.025, 0.055, 0.026),
            vec3(0.72, 0.20, 0.008),
            threads * 0.68
        );

        if (uLoadingCover > 0.5 || uVfxTime < 0.0) {
            vec3 brass = mix(vec3(0.12, 0.09, 0.05), vec3(0.48, 0.34, 0.16), threads);
            return brass * (0.35 + diffuse * 0.65)
                 + vec3(0.85, 0.77, 0.56) * specular * 0.7
                 + vec3(0.48, 0.36, 0.18) * movingHighlight * 0.35
                 + vec3(0.20, 0.25, 0.28) * rim * 0.4;
        }
        metal += vec3(1.0, 0.72, 0.15) * movingHighlight;
        return metal * (0.18 + diffuse * 0.78)
             + vec3(1.0, 0.84, 0.25) * specular
             + vec3(0.65, 0.15, 0.005) * rim;
    }

    if (material < 2.5)
    {
        return vec3(0.20, 0.095, 0.012) * (0.24 + diffuse)
             + vec3(1.0, 0.48, 0.05) * specular;
    }

    if (material > 5.5) {
        return vec3(0.60,0.40,0.16)*(0.35+diffuse*0.65)
             +vec3(1.0,0.90,0.62)*specular*0.85;
    }
    if (material > 4.5) {
        return vec3(0.085,0.075,0.068)*(0.55+diffuse*0.45)
             +vec3(0.2)*specular*0.16;
    }
    if (material > 3.5)
    {
        // Translucent lamp stem, distinct from conducting wires and brass.
        return vec3(0.23,0.32,0.36) * (0.28+0.65*diffuse)
             + vec3(0.83,0.92,1.0)*specular*0.72
             + vec3(0.26,0.40,0.44)*rim*0.32;
    }

    // Tungsten heats up during ignition before the branded energy overtakes it.
    float idleFlicker=0.5+0.5*sin(iTime*23.0+2.0*sin(iTime*8.0));
    float hoverHeat=uVfxTime < 0.0
        ? uHover*(0.09+0.14*uPointerSpeed)*idleFlicker : 0.0;
    float ignition=uVfxTime < 0.0 ? hoverHeat
        : smoothstep(0.02,0.27,uVfxTime);
    vec3 tungsten=mix(vec3(0.19,0.07,0.027),vec3(1.8,1.04,0.43),ignition);
    float burnout=uVfxTime < 0.0 ? 0.0 : smoothstep(1.25,2.55,uVfxTime);
    float energized=uVfxTime < 0.0 ? 0.0
        : smoothstep(0.27,0.66,uVfxTime)*(1.0-burnout);
    float fractal = foldedFractal(p * 3.1 + vec3(0.0, iTime * 0.08, 0.0));
    float signal = sin(p.y * 20.0 + fractal * 8.0 - iTime * 2.5);
    vec3 hot = mix(tungsten, energyColor(signal) * 2.2 + vec3(1.6,1.15,0.52) * (0.7+fractal),energized);
    return hot;
}

vec3 shadeGlass(vec3 p, vec3 rd)
{
    vec3 n = glassNormal(p);
    float fresnel = pow(1.0 + dot(n, rd), 3.2);

    if (uLoadingCover > 0.5 || uVfxTime < 0.0) {
        vec3 reflected = reflect(rd, n);
        float softbox = pow(sat(dot(reflected, normalize(vec3(-0.7, 0.4, 0.8)))), 24.0);
        float sidebox = pow(sat(dot(reflected, normalize(vec3(0.8, 0.2, 0.4)))), 40.0);
        vec3 physicalGlass = vec3(0.50,0.65,0.76)*fresnel*1.15
             +vec3(0.91,0.95,1.0)*softbox*0.90
             +vec3(0.82,0.58,0.31)*sidebox*0.48;
        return physicalGlass * (uLoadingCover > 0.5 ? 1.0 : 0.52);
    }
    vec3 fp = p * 2.35 + vec3(
        sin(iTime * 0.17) * 0.22,
        iTime * 0.065,
        cos(iTime * 0.13) * 0.22
    );

    float fractal = foldedFractal(fp);
    float angle = atan(p.y - 0.12, p.x);
    float radial = length(p.xy - vec2(0.0, 0.12));
    float flow = sin(angle * 2.2 - radial * 8.5 + fractal * 7.5 - iTime * 0.62);
    vec3 lacquer = energyColor(flow);

    float contour = pow(1.0 - abs(sin(fractal * 17.0 + angle * 3.0)), 12.0);
    vec3 glass = lacquer * (0.035 + fractal * 0.08);
    glass += vec3(1.0, 0.48, 0.025) * contour * 0.16;

    // Strong gold silhouette and secondary emerald inner rim.
    glass += vec3(1.0, 0.47, 0.018) * fresnel * 0.74;
    glass += vec3(1.0, 0.95, 0.42) * pow(fresnel, 2.2) * 0.72;
    glass += vec3(0.02, 0.62, 0.075) * (1.0 - fresnel) * fractal * 0.12;

    vec3 reflected = reflect(rd, n);
    float movingReflection = pow(sat(reflected.y * 0.7 - reflected.x * 0.3), 18.0);
    glass += vec3(1.0, 1.0, 0.67) * movingReflection * 0.72;

    return glass;
}

float segmentDistance2D(vec2 p, vec2 a, vec2 b)
{
    vec2 v=b-a;
    return length(p-a-v*clamp(dot(p-a,v)/max(dot(v,v),0.00001),0.0,1.0));
}

// Time-varying branching arc, with endpoints fixed to existing metal terminals.
float electricalArc(vec2 uv, vec2 a, vec2 b, float time, float seed)
{
    float dist=10.0;
    vec2 prev=a;
    vec2 side=normalize(vec2(-(b-a).y,(b-a).x));
    float tick=floor(time*52.0);
    for(int i=1;i<=9;i++)
    {
        float u=float(i)/9.0;
        float noise=hash21(vec2(float(i)*1.19+seed,tick));
        float bend=(noise-0.5)*0.045*sin(u*PI);
        vec2 curr=mix(a,b,u)+side*bend;
        dist=min(dist,segmentDistance2D(uv,prev,curr));
        prev=curr;
    }
    float pixelWidth=2.0/max(iResolution.y,1.0);
    return exp(-dist/(pixelWidth*2.1+0.002));
}

vec4 render(vec2 fragCoord)
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(
        0.055 * sin(iTime * 0.23),
        0.045 + 0.025 * sin(iTime * 0.19),
        3.75
    );

    // Short physical recoil followed by a deliberate forward camera push.
    // The 3D spark shader uses this same projection formula.
    if (uLoadingCover < 0.5 && uVfxTime >= 0.0) {
        ro.z += 0.065*exp(-uVfxTime*13.0)*sin(uVfxTime*34.0)
              - 1.28*smoothstep(0.95,1.85,uVfxTime);
    }
    vec3 target = vec3(0.018 * sin(iTime * 1.35), -0.06 + 0.014 * sin(iTime * 1.72), 0.0);
    if (uLoadingCover > 0.5) {
        ro = vec3(0.0, 0.045, 3.75);
        target = vec3(0.0, -0.06, 0.0);
    }
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.86 + right * uv.x + up * uv.y);

    if (uLoadingCover > 0.5) {
        // Inverse object translation keeps every SDF and its normal in one space.
        ro -= uBulbOffset;
        vec2 cx = vec2(cos(uBulbTilt.x), sin(uBulbTilt.x));
        vec2 cy = vec2(cos(uBulbTilt.y), sin(uBulbTilt.y));
        mat2 pitch = mat2(cx.x, -cx.y, cx.y, cx.x);
        mat2 yaw = mat2(cy.x, -cy.y, cy.y, cy.x);
        ro.yz = pitch * ro.yz;
        rd.yz = pitch * rd.yz;
        ro.xz = yaw * ro.xz;
        rd.xz = yaw * rd.xz;
    } else {
        // Inverse rigid rotation about the bulb's neck; every existing
        // piece of glass, wire and metal is transformed together.
        ro.y += 0.57;
        float cx=cos(uBulbTilt.x),sx=sin(uBulbTilt.x);
        float cy=cos(uBulbTilt.y),sy=sin(uBulbTilt.y);
        ro.xz=vec2(cy*ro.x-sy*ro.z,sy*ro.x+cy*ro.z);
        rd.xz=vec2(cy*rd.x-sy*rd.z,sy*rd.x+cy*rd.z);
        ro.yz=vec2(cx*ro.y+sx*ro.z,-sx*ro.y+cx*ro.z);
        rd.yz=vec2(cx*rd.y+sx*rd.z,-sx*rd.y+cx*rd.z);
        ro.y -= 0.57;
    }
    vec3 color = vec3(0.0);
    float coverage = 0.0;

    if (uLoadingCover < 0.5 && uVfxTime >= 0.0) {
    // One-cell procedural dust: no particle loop.
    vec2 grid = uv * 22.0;
    vec2 id = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float h = hash21(id);
    vec2 offset = vec2(hash21(id + 3.1), hash21(id + 8.7)) - 0.5;
    float dust = exp(-110.0 * length(local - offset * 0.55));
    dust *= smoothstep(0.955, 1.0, h);
    dust *= max(0.0, 0.45 + 0.55 * sin(iTime * (1.0 + h * 2.0) + h * 50.0));
    color += vec3(1.0, 0.43, 0.025) * dust * 0.8;
    coverage = max(coverage, sat(dust * 0.8));

    }

    float ignitionGlow = uVfxTime < 0.0 ? 0.0 : smoothstep(0.015,0.19,uVfxTime);
    float overload = uVfxTime < 0.0 ? 0.0 : smoothstep(0.19,0.56,uVfxTime);
    float burst = smoothstep(0.50,0.76,uVfxTime) * (1.0-smoothstep(1.02,1.30,uVfxTime));
    vec3 glow = vec3(0.0);
    if (uLoadingCover > 0.5 || uVfxTime >= 0.0) {
        glow = integrateFilamentGlow(ro,rd,fragCoord)
             * (uLoadingCover > 0.5 ? 0.23 : 0.20*ignitionGlow + 0.55*overload + 1.2*burst);
    }
    color += glow;
    coverage = max(coverage, sat(max(glow.r, max(glow.g, glow.b))));

    float glassHit = traceGlass(ro, rd);
    vec2 solidHit = traceSolid(ro, rd);

    if (solidHit.y > 0.0)
    {
        vec3 p = ro + rd * solidHit.x;
        color = shadeSolid(p, rd, solidHit.y) + glow * 0.62;
        coverage = 1.0;
    }

    if (glassHit < FAR_CLIP && glassHit < solidHit.x)
    {
        vec3 p = ro + rd * glassHit;
        vec3 n = glassNormal(p);
        // Schlick Fresnel and approximate Beer-Lambert absorption through
        // finite-thickness clear glass. Keeps internal contacts visible.
        float facing = clamp(-dot(n,rd),0.0,1.0);
        float fresnel = 0.04+0.96*pow(1.0-facing,5.0);
        vec3 glass = shadeGlass(p,rd);
        float glassPath = 0.032/max(facing,0.16);
        vec3 transmission = color*exp(-vec3(0.09,0.05,0.035)*glassPath);
        float opacity = 0.035+0.26*fresnel;
        color = mix(transmission,transmission+glass*0.78,opacity);
        color += glass*0.11;
        coverage = max(coverage, sat(opacity + max(glass.r, max(glass.g, glass.b)) * 0.18));
    }

    // Projected conductor-to-filament micro-arcs; fragment-space light stays
    // synchronized with the object's physical lead positions.
    if (uLoadingCover < 0.5 && uVfxTime >= 0.0) {
        float t = uVfxTime;
        float arcs = (1.0-smoothstep(0.44,0.72,t));
        float flicker = step(0.33,hash21(vec2(floor(t*55.0),2.7)));
        float discharge = arcs * flicker;
        float leftArc = electricalArc(uv,vec2(-0.11,-0.045),vec2(-0.10,0.075),t,3.0);
        float rightArc = electricalArc(uv,vec2(0.11,-0.045),vec2(0.10,0.075),t,9.0);
        float arc = max(leftArc,rightArc);
        // Bright white plasma cores, cool halos, warm spill on glass.
        vec3 arcLight = vec3(1.8,2.15,2.5)*pow(arc,4.0)
                      +vec3(0.22,0.70,1.6)*arc*0.38;
        color += discharge*arcLight;
        float radial = length(uv);
        float glassSpill = exp(-radial*5.0)*discharge*0.16;
        color += vec3(0.32,0.67,1.0)*glassSpill;
        // A physically motivated overload flash around the filament first,
        // followed by a short camera-filling wash. No permanent white screen.
        float flash = smoothstep(0.59,0.70,t)*(1.0-smoothstep(0.79,0.96,t));
        color += vec3(1.5,1.17,0.82)*flash*exp(-radial*2.7)*1.25;
        // Light streaks are emitted only after the bulb erupts.
        float expansion = smoothstep(0.60,0.84,t)*(1.0-smoothstep(1.12,1.42,t));
        float angle = atan(uv.y,uv.x);
        float stripe = pow(max(0.0,sin(angle*45.0+floor(t*35.0)*0.12)),30.0);
        float trail = exp(-abs(radial-(t-0.62)*2.1)*4.0);
        color += mix(vec3(1.2,0.48,0.08),vec3(0.2,0.84,1.1),0.35)
                 *stripe*trail*expansion*0.55;
        // A controlled exposure roll-off blends into the homepage via CSS.
        color *= 1.0-0.16*smoothstep(1.2,1.75,t);
    }

    float bloom = smoothstep(0.70, 2.2, max(color.r, max(color.g, color.b)));
    color += color * bloom * 0.22;

    float vignette = 1.0 - 0.34 * sat(dot(uv * 0.62, uv * 0.62));
    color *= vignette;

    color = clamp(
        (color * (2.51 * color + 0.03)) /
        (color * (2.43 * color + 0.59) + 0.14),
        vec3(0.0),
        vec3(1.0)
    );

    vec3 mapped = pow(color, vec3(0.4545));
    float opacity = sat(max(coverage, max(mapped.r, max(mapped.g, mapped.b))));
    if (uLoadingCover > 0.5) {
        // Match the cover background exactly outside the raymarched object.
        mapped = mix(vec3(16.0, 22.0, 25.0) / 255.0, mapped, opacity);
        return vec4(mapped, 1.0);
    }
    return vec4(mapped, opacity);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    fragColor = render(fragCoord);
}
