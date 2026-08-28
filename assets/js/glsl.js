(function () {
  const canvas = document.getElementById("shader-canvas");
  const gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return;

  const shaders = [
    ["Aurora Engine", "ATMOSPHERE", "Layered light fields shaped by time, drift, and atmospheric noise.", "A soft machine for northern light.", "A study in luminous gradients, quiet motion, and color that feels suspended in air.", [0.03, 0.55, 0.72]],
    ["Liquid Memory", "FLUID", "A slow current of color folding back into itself.", "Water remembers every surface.", "Ripples become architecture in this fluid simulation study.", [0.02, 0.48, 0.42]],
    ["Solar Bloom", "ENERGY", "A radiant field where heat becomes geometry.", "Light, compressed until it flowers.", "Concentric pulses turn a simple radial function into a living sun.", [0.92, 0.22, 0.06]],
    ["Velvet Void", "SPACE", "Soft-edged volumes drifting through an almost-black field.", "Darkness with a pulse.", "A restrained exercise in depth, softness, and barely-visible motion.", [0.24, 0.12, 0.58]],
    ["Signal Garden", "ORGANIC", "Procedural tendrils branching through a digital meadow.", "The signal wants to grow.", "Noise fields and repetition combine into an emergent botanical system.", [0.2, 0.7, 0.32]],
    ["Chromatic Fold", "GEOMETRY", "A plane of color continuously creasing through space.", "Geometry is a color event.", "Sine waves become a moving folded surface without ever leaving two dimensions.", [0.06, 0.2, 0.9]],
    ["Afterimage", "MOTION", "Ghosted trajectories tracing the path of a moving point.", "Every frame leaves a trace.", "Layered distance fields create a memory of motion rather than a single moment.", [0.9, 0.08, 0.3]],
    ["Deep Field", "COSMOS", "A starfield stretched into a tunnel of impossible distance.", "Keep falling forward.", "Perspective, noise, and sparse light create a compact voyage through deep space.", [0.08, 0.24, 0.62]],
    ["Warm Circuit", "SYSTEMS", "Copper pathways pulsing beneath a glass surface.", "A board with a heartbeat.", "A warm technical texture built from lines, intersections, and controlled glow.", [0.8, 0.32, 0.06]],
    ["Prism Rain", "OPTICS", "Droplets of refracted color crossing a dark lens.", "Weather, rendered as light.", "Repeating cells and chromatic offsets form a synthetic weather system.", [0.42, 0.16, 0.86]],
    ["Mosslight", "BIOFORM", "A bioluminescent surface breathing in the dark.", "Something is glowing underneath.", "Organic noise meets a cool nocturnal palette in a quiet living texture.", [0.08, 0.65, 0.3]],
    ["Orbit Bloom", "ORBITAL", "Particles finding their rhythm around an unseen center.", "Motion with a center of gravity.", "Angular repetition and polar coordinates turn orbiting points into a flower.", [0.94, 0.42, 0.08]],
    ["Glasshouse", "TRANSPARENCY", "A translucent room filled with shifting weather.", "The room is made of atmosphere.", "Nested gradients create the illusion of volume behind a pane of glass.", [0.04, 0.68, 0.76]],
    ["Ink Current", "ABSTRACT", "Dark pigment pulling itself into a luminous current.", "A mark that refuses to settle.", "A high-contrast flow field designed to feel tactile and almost physical.", [0.12, 0.1, 0.42]],
    ["Ember Grid", "HEAT", "A grid glowing from the pressure between its points.", "Heat lives in the gaps.", "A minimal grid experiment with an orange core and responsive distortion.", [0.92, 0.12, 0.03]],
    ["Blue Hour", "HORIZON", "The last electric color before the night arrives.", "Between day and signal.", "A horizontal gradient study with subtle stars and a drifting horizon line.", [0.03, 0.34, 0.82]],
    ["Microcosm", "CELLULAR", "A microscopic landscape of cells, seams, and bright edges.", "Small worlds, endless edges.", "Distance fields and cellular noise produce a surface that keeps reorganizing.", [0.18, 0.72, 0.62]],
    ["Pulse Map", "DATA", "A topographic map driven by an invisible heartbeat.", "The data is alive.", "Contours, pulses, and falloff create a map that feels both technical and bodily.", [0.74, 0.16, 0.62]],
    ["Frostline", "CRYSTAL", "Fractured planes catching a cold, passing light.", "A geometry of cold light.", "Angular folds and icy highlights make a quiet crystalline composition.", [0.42, 0.66, 0.9]],
    ["Night Garden", "NOCTURNE", "A final garden where flowers are made from frequency.", "The night is still growing.", "The closing study: soft petals, deep space, and a small signal of warmth.", [0.18, 0.08, 0.48]]
  ];

  const vertex = "attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}";
  const fragment = "precision highp float; uniform vec2 r; uniform float t; uniform vec2 m; uniform vec3 c; void main(){ vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y); float d=length(uv); float a=atan(uv.y,uv.x); float wave=sin(d*18.-t*1.8+sin(a*4.+t)*1.4); float rings=sin(d*34.-t*2.3+wave*1.5); float bands=sin((uv.x+sin(uv.y*3.+t)*.18)*10.+t); vec3 col=c*(.28+.38*wave+.22*rings)+vec3(.03,.04,.08)*(1.3-d); col+=vec3(.15,.34,.28)*max(0.,1.-abs(wave))*(.35+.35*sin(t+uv.y*4.)); col*=smoothstep(1.15,.08,d); gl_FragColor=vec4(col,1.); }";
  function compile(type, source) { const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s); return s; }
  const program=gl.createProgram(); gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program); gl.useProgram(program);
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW); const loc=gl.getAttribLocation(program,"p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uniforms={r:gl.getUniformLocation(program,"r"),t:gl.getUniformLocation(program,"t"),m:gl.getUniformLocation(program,"m"),c:gl.getUniformLocation(program,"c")};
  let current=0, start=performance.now(), paused=false, mouse=[0,0];
  const $=id=>document.getElementById(id);
  function resize(){const d=Math.min(window.devicePixelRatio||1,2); canvas.width=innerWidth*d; canvas.height=(innerHeight-73)*d; gl.viewport(0,0,canvas.width,canvas.height);}
  function render(now){const s=shaders[current]; resize(); gl.uniform2f(uniforms.r,canvas.width,canvas.height); gl.uniform1f(uniforms.t,paused?0:(now-start)/1000); gl.uniform2f(uniforms.m,mouse[0],mouse[1]); gl.uniform3fv(uniforms.c,new Float32Array(s[5])); gl.drawArrays(gl.TRIANGLES,0,6); requestAnimationFrame(render);}
  function update(){const s=shaders[current]; $("shader-index").textContent=String(current+1).padStart(2,"0"); $("shader-kicker").textContent=`GLSL STUDY ${String(current+1).padStart(2,"0")}`; $("shader-title").textContent=s[0]; $("shader-subtitle").textContent=s[2]; $("shader-family").textContent=s[1]; $("card-title").textContent=s[3]; $("card-copy").textContent=s[4]; $("shader-progress").style.width=`${((current+1)/shaders.length)*100}%`; }
  function go(delta){current=(current+delta+shaders.length)%shaders.length; start=performance.now(); update();}
  $("shader-prev").addEventListener("click",()=>go(-1)); $("shader-next").addEventListener("click",()=>go(1)); $("download-background").addEventListener("click",()=>{const link=document.createElement("a"); link.download=`luminary-${shaders[current][0].toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`; link.href=canvas.toDataURL("image/png"); link.click();});
  window.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")go(-1); if(e.key==="ArrowRight")go(1); if(e.code==="Space"){e.preventDefault(); paused=!paused; if(!paused)start=performance.now();}}); canvas.addEventListener("pointermove",e=>{mouse=[e.clientX/innerWidth,e.clientY/innerHeight];}); window.addEventListener("resize",resize); update(); resize(); requestAnimationFrame(render);
})();
