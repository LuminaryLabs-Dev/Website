precision highp float;

varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vColorClass;

void main()
{
    vec2 sprite = gl_PointCoord * 2.0 - 1.0;
    vec2 perpendicular = vec2(-vDirection.y, vDirection.x);

    vec2 aligned = vec2(
        dot(sprite, vDirection),
        dot(sprite, perpendicular)
    );

    float distanceSquared =
        aligned.x * aligned.x / (2.8 * 2.8)
        + aligned.y * aligned.y / (0.72 * 0.72);

    float edgeFade =
        1.0 - smoothstep(0.72, 1.0, max(abs(sprite.x), abs(sprite.y)));

    float head = smoothstep(-1.0, 0.65, aligned.x);
    float core = exp(-12.0 * distanceSquared);
    float halo = exp(-3.0 * distanceSquared);
    float brightness =
        core * (1.0 - vSizeMix)
        + halo * (0.35 + 0.65 * vSizeMix);

    float intensity = brightness
        * mix(0.58, 1.0, head)
        * edgeFade
        * vAlpha;

    vec3 warmWhite = vec3(1.00, 0.96, 0.72);
    vec3 gold = vec3(1.00, 0.34, 0.015);
    vec3 emerald = vec3(0.015, 0.82, 0.18);

    vec3 startColor = vColorClass < 0.5
        ? gold
        : vColorClass < 1.5
            ? warmWhite
            : emerald;

    vec3 color = mix(
        startColor,
        emerald,
        0.35 * smoothstep(0.55, 1.0, vAge)
    );

    float birthGlow = (1.0 - vAge) * (1.0 - vAge);
    color *= 0.82 + 1.35 * birthGlow;

    gl_FragColor = vec4(color, intensity);
}
