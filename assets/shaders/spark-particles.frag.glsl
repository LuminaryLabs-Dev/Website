precision highp float;
varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vColorClass;

void main()
{
    vec2 sprite=gl_PointCoord*2.0-1.0;
    vec2 tangent=vec2(-vDirection.y,vDirection.x);
    vec2 aligned=vec2(dot(sprite,vDirection),dot(sprite,tangent));
    // White-hot head plus a short, narrower motion-stretched tail.
    float head=exp(-19.0*dot(sprite,sprite));
    float tail=exp(-6.0*pow(aligned.y*2.4,2.0))
              *smoothstep(-0.92,-0.05,aligned.x)
              *(1.0-smoothstep(0.25,0.9,aligned.x));
    float halo=exp(-4.0*dot(sprite,sprite));
    float edge=1.0-smoothstep(0.70,1.0,max(abs(sprite.x),abs(sprite.y)));
    float intensity=(head*1.6+tail*0.5+halo*0.09)
                   *edge*vAlpha*mix(1.0,0.52,vSizeMix);
    vec3 whiteHot=vec3(1.0,0.96,0.83);
    vec3 amber=vec3(1.0,0.43,0.055);
    vec3 cooling=vec3(0.45,0.045,0.005);
    vec3 color=mix(whiteHot,amber,smoothstep(0.08,0.55,vAge));
    color=mix(color,cooling,smoothstep(0.55,1.0,vAge));
    // Rare teal electrical debris, not teal-hot molten metal.
    if(vColorClass>1.5) {
        color=mix(vec3(0.58,0.94,1.0),color,smoothstep(0.0,0.31,vAge));
    }
    gl_FragColor=vec4(color,intensity);
}
