(async function () {
  const main = document.querySelector("main");
  if (!main || !document.body.classList.contains("home-fractal-mode")) return;
  const bulbMarkup = `<section class="fractal-home" aria-label="Interactive GLSL shader"><canvas class="fractal-canvas"></canvas><div class="fractal-overlay"><div class="fractal-guide" aria-live="polite">Click the diamond stars</div><div class="guide-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><button class="fractal-core" aria-label="Reveal mission"></button><div class="bulb-particles" aria-hidden="true"></div><div class="fractal-mission">Luminary Labs LLC - Embedding Bleeding Edge Technology into Everyday Life for the Greater Social Good</div></div></section>`;
  main.insertAdjacentHTML("afterbegin", bulbMarkup);
  const core = main.querySelector(".fractal-core");
  core.addEventListener("click", () => document.body.classList.add("nav-revealed"));
  const canvas = main.querySelector("canvas"), gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return;
  const source = await fetch("assets/shaders/fractal-filament.glsl").then(r => r.text());
  const vertex = `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
  const fragment = `precision highp float; uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse; uniform float uPower; uniform float uStarA; uniform float uStarB; uniform float uStarC;\n` + source.replace("vec3 glow = integrateFilamentGlow(ro, rd, fragCoord);", "vec3 glow = integrateFilamentGlow(ro, rd, fragCoord) * (1.0 + uPower * 1.6);") + `\nvoid main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;
  function compile(type, text) { const shader = gl.createShader(type); gl.shaderSource(shader, text); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader)); return shader; }
  const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); gl.useProgram(program);
  const sparkPass = window.createSparkParticlePass
    ? await window.createSparkParticlePass(gl).catch(error => {
        console.error("Spark particle pass failed:", error);
        return null;
      })
    : null;
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW); const position = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "iResolution"), time = gl.getUniformLocation(program, "iTime"), power = gl.getUniformLocation(program, "uPower"), starUniforms = ["uStarA", "uStarB", "uStarC"].map(name => gl.getUniformLocation(program, name)); let started = performance.now(); let charge = [0, 0, 0];
  const nativeStars = [[-0.76, 0.62], [0.78, 0.52], [0.76, -0.30]];
  const guideParticles = main.querySelector(".guide-particles"), bulbParticles = main.querySelector(".bulb-particles"), mission = main.querySelector(".fractal-mission");
  canvas.addEventListener("click", event => { const rect = canvas.getBoundingClientRect(); const uv = [(2 * (event.clientX - rect.left) - rect.width) / rect.height, (2 * (rect.height - (event.clientY - rect.top)) - rect.height) / rect.height]; let closest = -1, distance = 0.11; nativeStars.forEach(([x, y], index) => { const current = Math.hypot(uv[0] - x, uv[1] - y); if (current < distance) { distance = current; closest = index; } }); if (closest >= 0) { charge[closest] = 1.0; if (charge.every(value => value >= 1)) { guideParticles.classList.add("complete"); bulbParticles.classList.add("active"); core.classList.add("active"); } } });
  core.addEventListener("click", () => { if (charge.every(value => value >= 1)) { mission.classList.add("revealed"); bulbParticles.classList.remove("active"); } });
  function resize() { const rect = canvas.parentElement.getBoundingClientRect(); canvas.width = Math.max(1, rect.width); canvas.height = Math.max(1, rect.height); gl.viewport(0, 0, canvas.width, canvas.height); }
  addEventListener("resize", resize); resize();
  function frame(now) { const elapsed = (now - started) / 1000; gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0); gl.uniform3f(resolution, canvas.width, canvas.height, 1); gl.uniform1f(time, elapsed); gl.uniform1f(power, Math.min(1.0, (charge[0] + charge[1] + charge[2]) / 2.4)); charge.forEach((value, index) => gl.uniform1f(starUniforms[index], value)); gl.drawArrays(gl.TRIANGLES, 0, 6); if (sparkPass) sparkPass.render(elapsed, canvas.width, canvas.height); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})().catch(error => console.error("Fractal Filament failed:", error));
