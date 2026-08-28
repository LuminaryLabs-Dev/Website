(async function () {
  const canvas = document.getElementById("shader-canvas");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return;

  const response = await fetch("assets/data/shaders_public.json");
  const catalog = await response.json();
  const symmetryShader = {
    info: {
      name: "Symmetry",
      description: "Coordinate space can be folded using absolute values. This shader designs one rounded structure in a single quadrant, then mirrors it into a luminous architectural emblem.",
      tags: ["symmetry", "distance fields", "geometry"]
    },
    renderpass: [{ type: "image", code: `mat2 rotate(float angle) { float s = sin(angle); float c = cos(angle); return mat2(c, -s, s, c); }
float roundedBox(vec2 p, vec2 size, float radius) { vec2 q = abs(p) - size + radius; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius; }
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  p *= rotate(iTime * 0.08);
  vec2 q = abs(p);
  vec2 formPosition = vec2(0.235);
  float form = roundedBox(q - formPosition, vec2(0.115, 0.16), 0.045);
  float opening = roundedBox(q - formPosition, vec2(0.052, 0.095), 0.025);
  float structure = max(form, -opening);
  float centerDiamond = abs(p.x) + abs(p.y) - 0.07;
  float shape = min(structure, centerDiamond);
  float fill = smoothstep(0.012, -0.012, shape);
  float edge = 1.0 - smoothstep(0.0, 0.014, abs(shape));
  float glow = exp(-abs(shape) * 9.0);
  float colorFlow = 0.5 + 0.5 * sin(q.x * 12.0 - q.y * 9.0 + iTime * 0.7);
  vec3 shapeColor = mix(vec3(0.10, 0.18, 0.85), vec3(0.05, 0.90, 0.95), colorFlow);
  vec3 color = vec3(0.003, 0.006, 0.025);
  color += exp(-length(p) * 3.0) * vec3(0.015, 0.045, 0.14);
  color += fill * shapeColor * 0.5;
  color += edge * vec3(0.30, 0.80, 1.0);
  color += glow * vec3(0.03, 0.18, 0.55);
  float innerLight = exp(-length(q - formPosition) * 18.0);
  color += innerLight * vec3(0.65, 0.16, 0.035) * (1.0 - smoothstep(0.0, 0.18, form));
  fragColor = vec4(color, 1.0);
}` }]
  };
  const shaders = [...catalog.shaders.filter(shader => shader.renderpass?.some(pass => pass.type === "image" && pass.code)), symmetryShader];
  const vertexSource = "attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}";
  let current = 0, paused = false, start = performance.now(), mouse = [0, 0];
  const $ = id => document.getElementById(id);

  function resize() { const d = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * d; canvas.height = (innerHeight - 73) * d; gl.viewport(0, 0, canvas.width, canvas.height); }
  function programFor(source) {
    const fragmentSource = `precision highp float; uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse; ${source}\nvoid main(){mainImage(gl_FragColor, gl_FragCoord.xy);}`;
    const compile = (type, code) => { const shader = gl.createShader(type); gl.shaderSource(shader, code); gl.compileShader(shader); return shader; };
    const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource)); gl.linkProgram(program); return program;
  }
  function sourceFor(index) { return shaders[index].renderpass.find(pass => pass.type === "image").code; }
  let program = programFor(sourceFor(current));
  function uniforms() { return { r: gl.getUniformLocation(program, "iResolution"), t: gl.getUniformLocation(program, "iTime"), m: gl.getUniformLocation(program, "iMouse") }; }
  function update() { const info = shaders[current].info; $("shader-index").textContent = String(current + 1).padStart(2, "0"); $("shader-total").textContent = String(shaders.length).padStart(2, "0"); $("shader-kicker").textContent = `GLSL STUDY ${String(current + 1).padStart(2, "0")}`; $("shader-title").textContent = info.name; $("shader-subtitle").textContent = info.description.split("\\n")[0]; $("shader-family").textContent = (info.tags?.[0] || "PUBLIC API").toUpperCase(); $("card-title").textContent = info.name; $("card-copy").textContent = info.description; $("shader-progress").style.width = `${((current + 1) / shaders.length) * 100}%`; }
  function go(delta) { current = (current + delta + shaders.length) % shaders.length; program = programFor(sourceFor(current)); start = performance.now(); update(); }
  let render = function (now) { resize(); gl.useProgram(program); const u = uniforms(); gl.uniform3f(u.r, canvas.width, canvas.height, 1); gl.uniform1f(u.t, paused ? 0 : (now - start) / 1000); gl.uniform4f(u.m, mouse[0], mouse[1], 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 6); requestAnimationFrame(render); };
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  function bindPosition() { const loc = gl.getAttribLocation(program, "position"); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); }
  const oldRender = render; render = function (now) { bindPosition(); oldRender(now); };
  $("shader-prev").addEventListener("click", () => go(-1)); $("shader-next").addEventListener("click", () => go(1));
  $("shader-prev-zone").addEventListener("click", () => go(-1)); $("shader-next-zone").addEventListener("click", () => go(1));
  $("download-background").addEventListener("click", () => { const link = document.createElement("a"); link.download = `luminary-${shaders[current].info.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`; link.href = canvas.toDataURL("image/png"); link.click(); });
  $("download-animated").addEventListener("click", () => {
    if (!window.MediaRecorder || !canvas.captureStream) { alert("Animated export is not supported by this browser. Download the PNG instead."); return; }
    const button = $("download-animated"); const original = button.innerHTML; button.disabled = true; button.innerHTML = "<span>Recording 6s...</span><span>●</span>";
    const chunks = []; const stream = canvas.captureStream(30); const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type)); if (!mimeType) { button.disabled = false; button.innerHTML = original; alert("This browser cannot export WebM video."); return; } const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => { const blob = new Blob(chunks, { type: "video/webm" }); const link = document.createElement("a"); link.download = `luminary-${shaders[current].info.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.webm`; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href); button.disabled = false; button.innerHTML = original; };
    recorder.start(); setTimeout(() => recorder.stop(), 6000);
  });
  addEventListener("keydown", event => { if (event.key === "ArrowLeft") go(-1); if (event.key === "ArrowRight") go(1); if (event.code === "Space") { event.preventDefault(); paused = !paused; start = performance.now(); } });
  canvas.addEventListener("pointermove", event => { mouse = [event.clientX, innerHeight - event.clientY]; }); addEventListener("resize", resize); update(); resize(); requestAnimationFrame(render);
})();
