(function () {
  const VERTEX_SOURCE = "attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}";

  class ShaderRenderer extends HTMLElement {
    static get observedAttributes() { return ["paused", "max-pixels", "pixel-ratio-cap"]; }

    attributeChangedCallback(name) {
      if (!this.ready) return;
      if (name === "paused") this.syncAnimation();
      else this.resize();
    }

    static passFactories = new Map();

    static registerPass(name, factory) {
      if (!name || typeof factory !== "function") return;
      ShaderRenderer.passFactories.set(name, factory);
    }

    constructor() {
      super();
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.buffer = null;
      this.passes = [];
      this.uniformValues = new Map();
      this.uniformLocations = new Map();
      this.startedAt = 0;
      this.elapsedBeforePause = 0;
      this.animationFrame = 0;
      this.visible = true;
      this.documentVisible = !document.hidden;
      this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.lastDrawAt = null;
      this.lastElapsed = 0;
      this.frameCount = 0;
      this.runGeneration = 0;
      this.ready = false;
      this.disposed = false;
      this.initializing = false;
      this.resizeObserver = null;
      this.intersectionObserver = null;
      this.abortController = null;
      this.pointerDown = false;
      this.error = null;
      this.boundFrame = now => this.frame(now);
      this.boundVisibility = () => {
        this.documentVisible = !document.hidden;
        this.syncAnimation();
      };
      this.boundResize = () => this.resize();
    }

    connectedCallback() {
      if (this.initializing || this.ready) return;
      this.disposed = false;
      this.initializing = true;
      const generation = ++this.runGeneration;
      this.dataset.state = "loading";

      this.canvas = document.createElement("canvas");
      this.canvas.className = "shader-renderer-canvas";
      this.canvas.setAttribute("aria-hidden", "true");
      this.append(this.canvas);

      this.abortController = new AbortController();
      this.motionQuery.addEventListener("change", event => {
        this.reduceMotion = event.matches;
        this.syncAnimation();
      }, { signal: this.abortController.signal });
      this.canvas.addEventListener("pointermove", event => this.updatePointer(event, this.pointerDown), {
        passive: true,
        signal: this.abortController.signal,
      });
      this.canvas.addEventListener("pointerdown", event => {
        this.pointerDown = true;
        this.updatePointer(event, true);
      }, {
        passive: true,
        signal: this.abortController.signal,
      });
      this.canvas.addEventListener("pointerup", event => {
        this.pointerDown = false;
        this.updatePointer(event, false);
      }, {
        passive: true,
        signal: this.abortController.signal,
      });
      this.canvas.addEventListener("pointerleave", event => {
        this.pointerDown = false;
        this.updatePointer(event, false);
      }, {
        passive: true,
        signal: this.abortController.signal,
      });
      this.canvas.addEventListener("webglcontextlost", event => {
        event.preventDefault();
        this.fail(new Error("WebGL context was lost"));
      }, { once: true, signal: this.abortController.signal });

      document.addEventListener("visibilitychange", this.boundVisibility, {
        signal: this.abortController.signal,
      });

      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this);
      } else {
        window.addEventListener("resize", this.boundResize, {
          passive: true,
          signal: this.abortController.signal,
        });
      }

      if ("IntersectionObserver" in window) {
        this.intersectionObserver = new IntersectionObserver(entries => {
          this.visible = entries.some(entry => entry.isIntersecting);
          this.syncAnimation();
        }, { rootMargin: "80px" });
        this.intersectionObserver.observe(this);
      }

      this.initialize(generation).catch(error => {
        if (generation === this.runGeneration && !this.disposed) this.fail(error);
      });
    }

    disconnectedCallback() {
      this.dispose();
    }

    async initialize(generation) {
      const fragmentUrl = this.getAttribute("fragment-src");
      if (!fragmentUrl) throw new Error("shader-renderer requires fragment-src");

      const transparent = this.hasAttribute("transparent");
      const gl = this.canvas.getContext("webgl", {
        alpha: transparent,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) throw new Error("WebGL is unavailable");
      this.gl = gl;
      gl.clearColor(0, 0, 0, transparent ? 0 : 1);

      const response = await fetch(fragmentUrl, { signal: this.abortController.signal });
      if (!response.ok) throw new Error(`Shader request failed (${response.status})`);
      const source = await response.text();
      if (this.disposed || generation !== this.runGeneration) return;
      const fragmentSource = `precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
${source}
void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;

      const vertexShader = this.compile(gl.VERTEX_SHADER, VERTEX_SOURCE, "Vertex shader");
      const fragmentShader = this.compile(gl.FRAGMENT_SHADER, fragmentSource, "Fragment shader");
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(message || "Shader program failed to link");
      }
      this.program = program;

      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      this.positionLocation = gl.getAttribLocation(program, "p");
      this.standardLocations = {
        resolution: gl.getUniformLocation(program, "iResolution"),
        time: gl.getUniformLocation(program, "iTime"),
        mouse: gl.getUniformLocation(program, "iMouse"),
      };
      this.setUniform("iMouse", [0, 0, 0, 0], false);
      await this.initializePasses();
      if (this.disposed || generation !== this.runGeneration) return;

      this.startedAt = performance.now();
      this.ready = true;
      this.initializing = false;
      this.dataset.state = "ready";
      this.error = null;
      this.resize();
      this.draw(this.elapsedBeforePause);
      this.dispatchEvent(new CustomEvent("shader-ready", { bubbles: true }));
      this.syncAnimation();
    }

    compile(type, source, label) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        const message = this.gl.getShaderInfoLog(shader);
        this.gl.deleteShader(shader);
        throw new Error(`${label} failed: ${message || "unknown error"}`);
      }
      return shader;
    }

    async initializePasses() {
      const names = (this.getAttribute("passes") || "")
        .split(/[\s,]+/)
        .map(name => name.trim())
        .filter(Boolean);

      for (const name of names) {
        const factory = ShaderRenderer.passFactories.get(name)
          || (name === "spark-particles" ? window.createSparkParticlePass : null);
        if (typeof factory !== "function") {
          this.dispatchEvent(new CustomEvent("shader-pass-error", {
            bubbles: true,
            detail: { name, error: new Error(`Unknown shader pass: ${name}`) },
          }));
          continue;
        }

        try {
          const pass = await factory(this.gl);
          if (pass && typeof pass.render === "function") this.passes.push(pass);
        } catch (error) {
          console.error(`Shader pass ${name} failed:`, error);
          this.dispatchEvent(new CustomEvent("shader-pass-error", {
            bubbles: true,
            detail: { name, error },
          }));
        }
      }
    }

    setUniform(name, value, redraw = true) {
      this.uniformValues.set(name, Array.isArray(value) ? [...value] : value);
      if (redraw && this.ready && this.reduceMotion) this.draw(this.elapsedBeforePause);
    }

    applyUniform(name, value) {
      if (name === "iMouse") return;
      let location = this.uniformLocations.get(name);
      if (location === undefined) {
        location = this.gl.getUniformLocation(this.program, name);
        this.uniformLocations.set(name, location);
      }
      if (location === null) return;

      if (typeof value === "number") this.gl.uniform1f(location, value);
      else if (value.length === 2) this.gl.uniform2f(location, value[0], value[1]);
      else if (value.length === 3) this.gl.uniform3f(location, value[0], value[1], value[2]);
      else if (value.length === 4) this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
    }

    updatePointer(event, pressed) {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / Math.max(rect.width, 1);
      const scaleY = this.canvas.height / Math.max(rect.height, 1);
      const x = (event.clientX - rect.left) * scaleX;
      const y = (rect.bottom - event.clientY) * scaleY;
      this.setUniform("iMouse", [x, y, pressed ? x : 0, pressed ? y : 0]);
    }

    resize() {
      if (!this.canvas || !this.gl) return;
      const rect = this.getBoundingClientRect();
      const requestedCap = Number.parseFloat(this.getAttribute("pixel-ratio-cap") || "1.5");
      const cap = Number.isFinite(requestedCap) ? Math.max(0.5, requestedCap) : 1.5;
      let pixelRatio = Math.min(window.devicePixelRatio || 1, cap);
      const maxPixels = Number.parseInt(this.getAttribute("max-pixels"), 10);
      if (maxPixels > 0 && rect.width * rect.height > 0) {
        pixelRatio = Math.min(pixelRatio, Math.sqrt(maxPixels / (rect.width * rect.height)));
      }
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        if (this.ready && !this.shouldAnimate()) this.draw(this.lastElapsed);
      }
    }

    frame(now) {
      this.animationFrame = 0;
      if (!this.shouldAnimate()) return;
      const elapsed = this.elapsedBeforePause + (now - this.startedAt) / 1000;
      const fps = Number.parseFloat(this.getAttribute("max-fps"));
      const interval = fps > 0 ? 1000 / fps : 0;
      if (this.lastDrawAt === null || now - this.lastDrawAt >= interval - 0.5) {
        this.draw(elapsed);
        this.lastDrawAt = interval && this.lastDrawAt !== null && now - this.lastDrawAt >= interval
          ? now - Math.max(0, (now - this.lastDrawAt) % interval) : now;
      }
      this.animationFrame = requestAnimationFrame(this.boundFrame);
    }

    draw(elapsed) {
      if (!this.ready || !this.gl || !this.program) return;
      this.lastElapsed = elapsed;
      this.frameCount += 1;
      const gl = this.gl;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3f(this.standardLocations.resolution, this.canvas.width, this.canvas.height, 1);
      gl.uniform1f(this.standardLocations.time, elapsed);

      const mouse = this.uniformValues.get("iMouse") || [0, 0, 0, 0];
      gl.uniform4f(this.standardLocations.mouse, mouse[0], mouse[1], mouse[2], mouse[3]);
      this.uniformValues.forEach((value, name) => this.applyUniform(name, value));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.passes.forEach(pass => pass.render(elapsed, this.canvas.width, this.canvas.height));
    }

    shouldAnimate() {
      return this.ready && !this.disposed && this.visible && this.documentVisible
        && !this.reduceMotion && !this.hasAttribute("paused");
    }

    syncAnimation() {
      if (!this.ready) return;
      if (this.shouldAnimate()) {
        if (!this.animationFrame) {
          this.startedAt = performance.now();
          this.lastDrawAt = null;
          this.animationFrame = requestAnimationFrame(this.boundFrame);
        }
      } else {
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = 0;
          this.elapsedBeforePause += (performance.now() - this.startedAt) / 1000;
        }
        this.elapsedBeforePause = this.lastElapsed;
        this.draw(this.lastElapsed);
      }
    }

    fail(error) {
      if (this.disposed) return;
      this.initializing = false;
      this.ready = false;
      this.error = error;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
      this.dataset.state = "error";
      console.error("Shader renderer fallback:", error);
      this.dispatchEvent(new CustomEvent("shader-error", {
        bubbles: true,
        detail: { error },
      }));
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.runGeneration += 1;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      this.abortController?.abort();
      this.passes.forEach(pass => pass.dispose?.());
      if (this.gl) {
        if (this.buffer) this.gl.deleteBuffer(this.buffer);
        if (this.program) this.gl.deleteProgram(this.program);
      }
      this.passes = [];
      this.ready = false;
      this.initializing = false;
      this.canvas?.remove();
      this.canvas = null;
    }
  }

  window.ShaderRenderer = ShaderRenderer;
  if (!customElements.get("shader-renderer")) {
    customElements.define("shader-renderer", ShaderRenderer);
  }
})();
