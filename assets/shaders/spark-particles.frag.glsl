precision highp float;
varying vec2 vDirection;
varying float vAge;
varying float vAlpha;
varying float vSizeMix;
varying float vType;
varying float vColorClass;

void main()
{
    vec2 local=gl_PointCoord*2.0-1.0;
    vec2 perpendicular=vec2(-vDirection.y,vDirection.x);
    vec2 q=vec2(dot(local,vDirection),dot(local,perpendicular));
    float border=1.0-smoothstep(0.72,1.0,max(abs(local.x),abs(local.y)));
    float head=exp(-22.0*dot(local,local));
    float tail=exp(-10.0*pow(q.y*2.2,2.0))
               *smoothstep(-0.95,-0.10,q.x)
               *(1.0-smoothstep(0.1,0.95,q.x));
    float halo=exp(-4.0*dot(local,local));
    vec3 color;
    float intensity;
    if(vType>0.5 && vType<1.5) {
        // Short reflective glass glints. The world-space emitter is on glass.
        float diamond=1.0-smoothstep(0.35,0.90,abs(q.x)+abs(q.y)*1.65);
        float edge=1.0-smoothstep(0.12,0.32,abs(q.y));
        intensity=(diamond*0.52+edge*head*0.85+halo*0.09)
                 *border*vAlpha;
        color=mix(vec3(0.42,0.69,0.88),vec3(1.0,0.91,0.72),
                  0.3+0.35*sin(vAge*15.0+vSizeMix*18.0));
    } else {
        vec3 whiteHot=vec3(1.0,0.96,0.84);
        vec3 amber=vec3(1.0,0.42,0.035);
        vec3 cooling=vec3(0.38,0.038,0.004);
        color=mix(whiteHot,amber,smoothstep(0.08,0.49,vAge));
        color=mix(color,cooling,smoothstep(0.53,1.0,vAge));
        if(vColorClass>0.5) {
            color=mix(vec3(0.55,0.87,1.0),color,smoothstep(0.0,0.36,vAge));
        }
        intensity=(head*1.55+tail*0.44+halo*0.07)
                  *border*vAlpha
                  *(vType>1.5?0.63:1.0);
    }
    gl_FragColor=vec4(color,max(0.0,intensity));
}
