(async function () {
  const main = document.querySelector("main");
  if (!main || !document.body.classList.contains("contact-shader-page")) return;
  main.innerHTML = '<section class="contact-shader-scene"><canvas class="contact-shader-canvas"></canvas><div class="contact-shader-wash"></div><div class="contact-shader-copy"><h1>Let’s build something.</h1><p>Tell us what you want to make and we’ll get back to you within 24 hours.</p><a href="mailto:admin@luminarylabs.dev">admin@luminarylabs.dev ↗</a></div></section>';
  const canvas = main.querySelector("canvas"), gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return;
  const source = await fetch("assets/shaders/cluster-bots.glsl").then(r => r.text());
  const compatible = source.replace("vec3 o = vec3(float(j&1), float((j>>1)&1), float((j>>2)&1));", "vec3 o = vec3(mod(float(j),2.0), mod(floor(float(j)/2.0),2.0), mod(floor(float(j)/4.0),2.0));").replace("vec2 m = (iMouse.z > 0.0 ? iMouse.xy / iResolution.xy - 0.5 : vec2(0));", "vec2 m = vec2(0.0);").replace("vec3 ro = path(camTime);", "vec3 ro = path(camTime) - vec3(0.0, 0.0, 1.5);");
  const fragment = "precision mediump float; uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse;\n" + compatible.replace(/i<65/g, "i<34") + "\nvoid main(){mainImage(gl_FragColor,gl_FragCoord.xy);} ";
  const compile = (type, text) => { const shader = gl.createShader(type); gl.shaderSource(shader, text); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader)); return shader; };
  const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}")); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW); const position = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "iResolution"), time = gl.getUniformLocation(program, "iTime"), mouse = gl.getUniformLocation(program, "iMouse"); let pointer = [0,0,0,0], started = performance.now();
  const resize = () => { const rect = canvas.parentElement.getBoundingClientRect(), scale = .78; canvas.width = Math.max(1, Math.floor(rect.width * scale)); canvas.height = Math.max(1, Math.floor(rect.height * scale)); canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`; gl.viewport(0, 0, canvas.width, canvas.height); }; addEventListener("resize", resize); resize();
  let lastFrame = 0; const frame = now => { if (now - lastFrame >= 33) { lastFrame = now; gl.uniform3f(resolution, canvas.width, canvas.height, 1); gl.uniform1f(time, (now - started) / 1000); gl.uniform4f(mouse, ...pointer); gl.drawArrays(gl.TRIANGLES, 0, 6); } requestAnimationFrame(frame); }; requestAnimationFrame(frame);
})().catch(error => console.error("Contact shader failed:", error));
