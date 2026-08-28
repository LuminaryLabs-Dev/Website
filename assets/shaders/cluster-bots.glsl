//based on Cluster Bots by simonsdev and Crimson Wheeler
mat2 R(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float H(vec3 p){return fract(sin(dot(p,vec3(17.,59.,113.)))*43758.5);}
vec3 K(vec3 p){return vec3(H(p),H(p+19.),H(p+37.));}

// Calculates a safe flight path to avoid colliding with the grid nodes.
// X and Y axis movements are staggered so the camera strictly crosses boundaries in empty space.
vec3 path(float t) {
    float S = 1.5;
    float idx = floor(t);
    float f = fract(t);
    
    float fX = clamp(f * 2.0, 0.0, 1.0);
    fX = fX * fX * (3.0 - 2.0 * fX); 
    
    float fY = clamp((f - 0.5) * 2.0, 0.0, 1.0);
    fY = fY * fY * (3.0 - 2.0 * fY); 
    
    float x_prev = floor(sin((idx - 1.0) * 1.2) * 2.0 + 0.5) * S;
    float x_next = floor(sin(idx * 1.2) * 2.0 + 0.5) * S;
    
    float y_prev = floor(cos((idx - 1.0) * 1.5) * 2.0 + 0.5) * S;
    float y_next = floor(cos(idx * 1.5) * 2.0 + 0.5) * S;
    
    float X = mix(x_prev, x_next, fX) + sin(t * 0.8) * 0.08;
    float Y = mix(y_prev, y_next, fY) + cos(t * 0.6) * 0.08;
    float Z = t * S; 
    
    return vec3(X, Y, Z);
}

// Tracks the web's distance for the volumetric glow effect.
float webDist = 100.0;

float M(vec3 p) {
    float T = iTime * 0.6;
    float S = 1.5;
    float d = 9.0;
    
    // Simulates a directional wind wave to push and ripple the strands.
    float wind = sin(p.x * 2.5 + p.z * 2.0 - iTime * 4.0) * cos(p.y * 2.0 - p.x * 1.5 - iTime * 3.0);
    
    // Distorts space solely for the fractal webs, leaving the bots physically anchored.
    vec3 wp = p;
    wp += 0.15 * sin(p.yzx * 3.0 + T * 0.5 + wind * 0.6);
    wp += 0.05 * sin(p.zxy * 8.0 - T + wind * 1.2);
    
    vec3 wfq = fract(wp/S) * S - S * 0.5;
    float rX = length(wfq.zy);
    float rY = length(wfq.xz);
    float rZ = length(wfq.xy);
    
    webDist = min(rX, min(rY, rZ)) - (0.008 + 0.003 * wind); 
    
    vec3 b = floor(p/S - 0.5);
    
    // Evaluates 8 neighboring grid cells to correctly render overlapping bot geometry.
    for(int j=0; j<8; j++) {
        vec3 o = vec3(float(j&1), float((j>>1)&1), float((j>>2)&1));
        vec3 id = b + o;
        vec3 h = K(id);
        
        vec3 c = (id + 0.5 + 0.05 * sin(T + h * 6.28)) * S; 
        vec3 q = p - c; 
        
        q.xz = R(h.x * 6.283 + T * 0.4) * q.xz; 
        q.xy = R(h.y * 6.283 + T * 0.3) * q.xy; 
        
        float s = 0.1 + 0.15 * h.z + 0.02 * sin(T * 2.0 + h.x * 6.283); 
        vec3 a = abs(q); 
        
        // Creates the octagonal body by intersecting an octahedron with bounding planes.
        float oct1 = (a.x + a.y + a.z) * 0.57735;
        float oct2 = max(a.x, a.z) * 0.866 + a.y * 0.5;
        float body = max(oct1, oct2) - s;
        
        // Renders two tapered prongs along the local Y-axis.
        float prongLen = s * 2.2; 
        vec2 py = vec2(length(q.xz), max(0.0, abs(q.y) - prongLen));
        float pRadius = 0.02 - 0.005 * clamp(abs(q.y) / prongLen, 0.0, 1.0); 
        float prongs = length(py) - pRadius;
        
        d = min(d, min(body, prongs));
    }
    
    return min(d, webDist * 0.6); 
}

vec3 N(vec3 p) {
    vec2 e = vec2(.002, 0);
    return normalize(vec3(M(p+e.xyy)-M(p-e.xyy), M(p+e.yxy)-M(p-e.yxy), M(p+e.yyx)-M(p-e.yyx)));
}

void mainImage(out vec4 o, in vec2 f) {
    vec2 uv = (f * 2.0 - iResolution.xy) / iResolution.y;
    vec2 m = (iMouse.z > 0.0 ? iMouse.xy / iResolution.xy - 0.5 : vec2(0)); 
    
    //global fly time
    float camTime = iTime * 0.05;
    
    // Establishes a smooth, forward-moving camera with an extended look-ahead to prevent jitter.
    vec3 ro = path(camTime);
    vec3 ta = path(camTime + 1.5); 
    
    vec3 fwd = normalize(ta - ro);
    vec3 upGuide = normalize(vec3(sin(camTime * 0.3) * 0.15, 1.0, cos(camTime * 0.25) * 0.15));
    vec3 right = normalize(cross(fwd, upGuide));
    vec3 up = cross(right, fwd);
    
    mat3 camMat = mat3(right, up, fwd);
    vec3 rd = camMat * normalize(vec3(uv, 1.3)); 
    
    rd.xz = R(m.x * 0.8) * rd.xz; 
    rd.yz = R(-m.y * 0.6) * rd.yz;
    
    vec3 p; 
    float t = 0., d = 0., g = 0., wGlow = 0.; 
    
    // Raymarching loop: accumulates distance and volumetric glow.
    for(int i=0; i<65; i++) { 
        p = ro + rd * t; 
        d = M(p); 
        
        g += 0.012 / (0.04 + d * d * 80.0); 
        wGlow += 0.008 / (0.01 + abs(webDist) * 25.0); 
        
        if(d < 0.002 || t > 18.0) break; 
        t += d * 0.8; 
    }
    
    // Calculates ambient glowing colors for the webs and bots.
    float windGlow = sin(p.x * 2.5 + p.z * 2.0 - iTime * 4.0) * 0.5 + 0.5;
    vec3 webCol = vec3(1.0, 0.4 + 0.3 * windGlow, 0.1) * wGlow * (0.6 + 0.5 * windGlow);
    webCol += vec3(0.5, 0.2, 0.8) * wGlow * 0.5 * sin(p.z * 2.0 + iTime * 3.0);
    
    vec3 botGlowCol = 0.4 + 0.4 * cos(p.z * 0.3 + p.x * 0.2 + vec3(0, 2, 4));
    vec3 col = vec3(0.005, 0.01, 0.025) + g * botGlowCol + webCol; 
    
    // Applies basic surface lighting and reflections.
    if(d < 0.01) {
        vec3 n = N(p), l = normalize(vec3(0.6, 0.8, -0.5)), r = reflect(rd, n);
        vec3 tint = 0.65 + 0.35 * cos(vec3(0, 2, 4) + p.z * 0.4 + p.y * 0.2); 
        
        float dif = max(dot(n, l), 0.0);
        float fre = pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
        float sp = pow(max(dot(r, l), 0.0), 28.0); 
        
        col += tint * (0.08 + 0.22 * dif) + vec3(0.55, 0.85, 1.3) * fre + vec3(1.0) * sp * 0.8;
    }
    
    // Renders distant background stars and a vignette effect.
    if(t > 17.0) {
        vec3 st = rd * 100.0;
        col += pow(fract(sin(dot(st.xy + st.z, vec2(12.98, 78.23))) * 43758.5), 150.0) * 1.5; 
    }
    
    col *= smoothstep(1.8, 0.2, length(uv));                                            
    o = vec4(pow(col * exp(-t * 0.06), vec3(0.75)), 1.0);
}