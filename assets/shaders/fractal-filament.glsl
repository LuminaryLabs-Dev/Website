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
    d += 0.003
       * sin(p.y * 9.0 + p.x * 5.0 + iTime * 0.7)
       * sin(p.z * 7.0 - iTime * 0.43);

    // Conservative sphere-tracing factor.
    return d * 0.86;
}

float ellipseRing3D(vec3 p, vec2 radius, float thickness)
{
    float ring = (length(p.xy / radius) - 1.0) * min(radius.x, radius.y);
    return length(vec2(ring, p.z)) - thickness;
}

float curvedFilamentStem(vec3 p, float side, float lane)
{
    float low = -0.48;
    float high = 0.09;
    float y = clamp(p.y, low, high);
    float u = (y - low) / (high - low);
    float spread = smoothstep(0.05, 1.0, u);

    float x = side * mix(0.045, 0.165, spread);
    x += lane * mix(0.042, 0.020, u);
    x += 0.006 * sin(iTime * 13.0 + y * 44.0 + side * 2.0 + lane * 8.0);

    vec3 q = vec3(p.x - x, p.y - y, p.z);
    return length(q) - 0.012;
}

float filamentRawSDF(vec3 p)
{
    p.x += 0.005 * sin(iTime * 17.0 + p.y * 51.0);
    p.z += 0.004 * cos(iTime * 19.0 - p.y * 46.0);

    float pulse = 0.009 * sin(iTime * 4.2);

    vec3 left = p - vec3(-0.17, 0.12, 0.0);
    left.xy *= rot(0.30 + 0.035 * sin(iTime * 3.1));

    vec3 right = p - vec3(0.17, 0.12, 0.0);
    right.xy *= rot(-0.30 - 0.035 * sin(iTime * 3.1));

    float leftLoop = ellipseRing3D(left, vec2(0.145 + pulse, 0.085), 0.013);
    float rightLoop = ellipseRing3D(right, vec2(0.145 - pulse, 0.085), 0.013);

    float stems = curvedFilamentStem(p, -1.0, 0.0);
    stems = min(stems, curvedFilamentStem(p, 1.0, 0.0));
    stems = min(stems, curvedFilamentStem(p, -1.0, 1.0));
    stems = min(stems, curvedFilamentStem(p, 1.0, -1.0));
    stems = min(stems, curvedFilamentStem(p, 0.0, 0.0));

    float bridge = sdCapsule(
        p,
        vec3(-0.12, 0.025, 0.0),
        vec3(0.12, 0.025, 0.0),
        0.012
    );

    return min(min(leftLoop, rightLoop), min(stems, bridge));
}

float supportSDF(vec3 p)
{
    float left = sdCapsule(
        p,
        vec3(-0.13, -0.57, 0.025),
        vec3(-0.06, -0.44, 0.005),
        0.013
    );

    float right = sdCapsule(
        p,
        vec3(0.13, -0.57, 0.025),
        vec3(0.06, -0.44, 0.005),
        0.013
    );

    return min(left, right);
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

    float contact = sdEllipsoid(
        p - vec3(0.0, -1.285, 0.0),
        vec3(0.19, 0.13, 0.19)
    );

    // Retain the conservative factor for solid tracing.
    return min(min(body, collar), contact) * 0.72;
}

// x = distance, y = material: 1 base, 2 support, 3 filament
vec2 solidScene(vec3 p)
{
    vec2 result = vec2(FAR_CLIP, 0.0);

    float base = baseSDF(p);
    if (base < result.x) result = vec2(base, 1.0);

    float support = supportSDF(p);
    if (support < result.x) result = vec2(support, 2.0);

    // Conservative factor keeps the animated curve safe for overstepping.
    float filament = filamentRawSDF(p) * 0.66;
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

    float fractal = foldedFractal(p * 3.1 + vec3(0.0, iTime * 0.08, 0.0));
    float signal = sin(p.y * 20.0 + fractal * 8.0 - iTime * 2.5);
    vec3 hot = energyColor(signal) * 3.2;
    hot += vec3(1.6, 1.15, 0.52) * (0.7 + fractal);
    return hot;
}

vec3 shadeGlass(vec3 p, vec3 rd)
{
    vec3 n = glassNormal(p);
    float fresnel = pow(1.0 + dot(n, rd), 3.2);

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

float starBurst(vec2 p, float size, float phase)
{
    p /= size;
    vec2 q = abs(p);
    float pulse = 0.72 + 0.28 * sin(iTime * 3.4 + phase);
    float core = exp(-17.0 * length(p));
    // Compact flares only; long rays inside the glass read as marching artifacts.
    float rays = exp(-34.0 * q.x - 5.0 * q.y)
               + exp(-34.0 * q.y - 5.0 * q.x);
    return (core * 2.0 + rays) * pulse;
}

vec3 render(vec2 fragCoord)
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(
        0.055 * sin(iTime * 0.23),
        0.045 + 0.025 * sin(iTime * 0.19),
        3.75
    );

    vec3 target = vec3(0.018 * sin(iTime * 1.35), -0.06 + 0.014 * sin(iTime * 1.72), 0.0);
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.86 + right * uv.x + up * uv.y);

    vec3 color = vec3(0.0004, 0.0006, 0.00045);

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

    vec3 glow = integrateFilamentGlow(ro, rd, fragCoord);
    color += glow;

    float glassHit = traceGlass(ro, rd);
    vec2 solidHit = traceSolid(ro, rd);

    if (solidHit.y > 0.0)
    {
        vec3 p = ro + rd * solidHit.x;
        color = shadeSolid(p, rd, solidHit.y) + glow * 0.62;
    }

    if (glassHit < FAR_CLIP && glassHit < solidHit.x)
    {
        vec3 p = ro + rd * glassHit;
        vec3 n = glassNormal(p);
        float fresnel = pow(1.0 + dot(n, rd), 3.1);
        vec3 glass = shadeGlass(p, rd);
        float opacity = 0.055 + 0.25 * fresnel;
        // Single clean glass composite; the previous double-add produced muddy bands.
        color = mix(color, color + glass * 0.72, opacity);
        color += glass * 0.18;
    }

    float starA = starBurst(uv - vec2(-0.76, 0.62), 0.050 * (1.0 + uStarA), 0.0);
    float starB = starBurst(uv - vec2(0.78, 0.52), 0.044 * (1.0 + uStarB), 2.2);
    float starC = starBurst(uv - vec2(0.76, -0.30), 0.040 * (1.0 + uStarC), 4.4);
    color += mix(vec3(1.0, 0.16, 0.02), vec3(0.12, 0.72, 1.0), 0.5 + 0.5 * sin(iTime * 1.7)) * starA * 0.9;
    color += mix(vec3(0.22, 0.45, 1.0), vec3(1.0, 0.22, 0.04), 0.5 + 0.5 * sin(iTime * 1.5 + 2.2)) * starB * 0.9;
    color += mix(vec3(1.0, 0.75, 0.08), vec3(0.15, 1.0, 0.62), 0.5 + 0.5 * sin(iTime * 1.9 + 4.4)) * starC * 0.9;
    float stars = starA + starB + starC;
    color += vec3(1.0, 1.0, 0.55) * stars * stars * 0.36;

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

    return pow(color, vec3(0.4545));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    fragColor = vec4(render(fragCoord), 1.0);
}
