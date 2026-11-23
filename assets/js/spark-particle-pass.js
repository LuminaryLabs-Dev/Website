(function () {
  const MAX_PARTICLE_COUNT = 144;
  const PROFILE_SAMPLES = 384;
  const SURFACE_MIN_Y = -0.440;
  const TOP_Y = 1.200;
  const TAU = Math.PI * 2;

  function hash(value) {
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function quinticBoundary(
    radiusA,
    radiusB,
    slopeA,
    slopeB,
    curvatureA,
    curvatureB,
    t,
    span
  ) {
    const c0 = radiusA;
    const c1 = slopeA * span;
    const c2 = 0.5 * curvatureA * span * span;
    const remainingRadius = radiusB - (c0 + c1 + c2);
    const remainingSlope = slopeB * span - (c1 + 2 * c2);
    const remainingCurvature = curvatureB * span * span - 2 * c2;
    const c3 = 10 * remainingRadius - 4 * remainingSlope + 0.5 * remainingCurvature;
    const c4 = -15 * remainingRadius + 7 * remainingSlope - remainingCurvature;
    const c5 = 6 * remainingRadius - 3 * remainingSlope + 0.5 * remainingCurvature;

    return c0
      + c1 * t
      + c2 * t * t
      + c3 * t * t * t
      + c4 * t * t * t * t
      + c5 * t * t * t * t * t;
  }

  function glassProfileRadius(y, angle = 0) {
    const neckRadius = 0.320;
    const shoulderStart = -0.440;
    const globeJoinY = 0.140;
    const globeCenterY = 0.400;
    const globeRadiusX = 0.730;
    const globeRadiusY = 0.800;
    const globeRadiusZ = 0.710;
    const directionX = Math.cos(angle);
    const directionZ = Math.sin(angle);
    const horizontalRadius = 1 / Math.sqrt(
      directionX * directionX / (globeRadiusX * globeRadiusX)
      + directionZ * directionZ / (globeRadiusZ * globeRadiusZ)
    );

    if (y <= shoulderStart) return neckRadius;

    const normalizedY = (y - globeCenterY) / globeRadiusY;
    const globe = horizontalRadius * Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY));
    if (y >= globeJoinY) return globe;

    const normalizedJoinY = (globeJoinY - globeCenterY) / globeRadiusY;
    const root = Math.sqrt(Math.max(0.000001, 1 - normalizedJoinY * normalizedJoinY));
    const joinRadius = horizontalRadius * root;
    const joinSlope = -horizontalRadius * normalizedJoinY / (globeRadiusY * root);
    const joinCurvature = -horizontalRadius
      / (globeRadiusY * globeRadiusY * root * root * root);
    const span = globeJoinY - shoulderStart;
    const t = Math.max(0, Math.min(1, (y - shoulderStart) / span));

    return quinticBoundary(
      neckRadius,
      joinRadius,
      0,
      joinSlope,
      0,
      joinCurvature,
      t,
      span
    );
  }

  function createSurfaceSampler() {
    const cumulative = [0];
    const span = TOP_Y - SURFACE_MIN_Y;
    const derivativeStep = 0.001;

    for (let index = 0; index < PROFILE_SAMPLES; index += 1) {
      const y = SURFACE_MIN_Y + span * (index + 0.5) / PROFILE_SAMPLES;
      const aboveY = Math.min(TOP_Y, y + derivativeStep);
      const belowY = Math.max(SURFACE_MIN_Y, y - derivativeStep);
      const radius = glassProfileRadius(y);
      const slope = (glassProfileRadius(aboveY) - glassProfileRadius(belowY))
        / Math.max(aboveY - belowY, 0.000001);

      // Surface-of-revolution area density: r(y) * sqrt(1 + r'(y)^2).
      const areaWeight = Math.max(0.000001, radius * Math.sqrt(1 + slope * slope));
      cumulative.push(cumulative[index] + areaWeight);
    }

    const total = cumulative[cumulative.length - 1];

    return function sampleSurface(unitHeight, unitAngle) {
      const target = unitHeight * total;
      let low = 1;
      let high = cumulative.length - 1;

      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (cumulative[middle] < target) low = middle + 1;
        else high = middle;
      }

      const bin = low - 1;
      const binMix = (target - cumulative[bin])
        / Math.max(cumulative[bin + 1] - cumulative[bin], 0.000001);
      const y = SURFACE_MIN_Y + span * (bin + binMix) / PROFILE_SAMPLES;
      const angle = TAU * unitAngle;
      const radius = glassProfileRadius(y, angle);

      return [
        radius * Math.cos(angle),
        y,
        radius * Math.sin(angle),
      ];
    };
  }

  function normalOnGlass(point) {
    const [x, y, z] = point;
    const angle = Math.atan2(z, x);
    const radiusStep = 0.002;
    const slope = (glassProfileRadius(y + radiusStep, angle) -
                   glassProfileRadius(y - radiusStep, angle)) / (2 * radiusStep);
    const normal = [Math.cos(angle), -slope, Math.sin(angle)];
    const length = Math.hypot(...normal) || 1;
    return normal.map(value => value / length);
  }

  function rotateFromBulb(point, tilt, directionOnly = false) {
    const pitch = tilt[0] || 0, yaw = tilt[1] || 0;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = point[0], y = point[1] + (directionOnly ? 0 : 0.57), z = point[2];
    const ny = cp * y - sp * z, nz = sp * y + cp * z;
    return [cy * x + sy * nz, ny - (directionOnly ? 0 : 0.57), -sy * x + cy * nz];
  }

  function normalizeDirection(v) {
    const length = Math.hypot(...v) || 1;
    return v.map(value => value / length);
  }

  function buildBurstSchedule(sampleSurface, seed, count) {
    const particles = [];
    const random = index => hash(index * 17.71 + seed * 0.137);
    for (let i = 0; i < count; i += 1) {
      // 4 hot sparks : 2 reflective glass splinters : 1 lingering ember.
      const type = i % 7 < 4 ? 0 : i % 7 < 6 ? 1 : 2;
      const side = i % 2 === 0 ? -1 : 1;
      const shell = sampleSurface(random(i + 101), random(i + 201));
      const filament = [side * (0.15 + 0.065 * random(i + 301)),
                        0.105 + 0.023 * (random(i + 302) - 0.5),
                        0.026 * Math.cos(random(i + 303) * TAU)];
      const spawn = type === 1 ? shell : type === 2 && i % 3 === 0 ? shell : filament;
      const normal = type === 1 || (type === 2 && i % 3 === 0)
        ? normalOnGlass(spawn)
        : normalizeDirection([side * (0.5 + random(i + 401)),
                              0.2 + random(i + 402),
                              2 * random(i + 403) - 1]);
      const turbulence = [2 * random(i + 501) - 1,
                          2 * random(i + 502) - 1,
                          2 * random(i + 503) - 1];
      const heading = normalizeDirection(normal.map((value, axis) =>
        value * (type === 1 ? 0.85 : 0.75) + turbulence[axis] * 0.35));
      const speed = type === 0 ? 1.1 + random(i + 601) * 1.65
                  : type === 1 ? 0.75 + random(i + 602) * 1.35
                  : 0.33 + random(i + 603) * 0.8;
      const velocity = heading.map(value => value * speed);
      const birth = type === 0 ? 0.17 + 0.46 * random(i + 701)
                  : type === 1 ? 0.50 + 0.40 * random(i + 702)
                  : 0.72 + 0.48 * random(i + 703);
      const life = Math.min(2.5, 1.0 + (type === 2 ? 0.7 : 0) + 1.12 * random(i + 704));
      particles.push({
        spawn, velocity, birth, life,
        drag: type === 0 ? 0.42 + 0.55 * random(i + 801)
              : type === 1 ? 0.15 + 0.35 * random(i + 802)
              : 0.7 + 0.45 * random(i + 803),
        size: Math.pow(random(i + 901), 2.0),
        type,
        color: random(i + 1001) < 0.12 ? 1 : 0
      });
    }
    return { particles, bursts: [{ index: 0, birthTime: 0.17, count }] };
  }

  function compile(gl, type, source, label) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`${label} failed: ${message}`);
    }

    return shader;
  }

  function link(gl, vertexSource, fragmentSource) {
    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource, "Spark vertex shader");
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource, "Spark fragment shader");
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Spark program failed: ${message}`);
    }

    return program;
  }

  async function createSparkParticlePass(gl) {
    async function loadSource(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Shader request failed (${response.status}): ${url}`);
      return response.text();
    }

    const [vertexSource, fragmentSource] = await Promise.all([
      loadSource("assets/shaders/spark-particles.vert.glsl?v=20261123-vfx-2"),
      loadSource("assets/shaders/spark-particles.frag.glsl?v=20261123-vfx-2"),
    ]);

    const program = link(gl, vertexSource, fragmentSource);
    const sampleSurface = createSurfaceSampler();
    const particleCount = matchMedia("(max-width: 700px)").matches ? 96 : MAX_PARTICLE_COUNT;
    const strideFloats = 12;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleCount * strideFloats * 4, gl.DYNAMIC_DRAW);

    const locations = {
      spawn: gl.getAttribLocation(program, "aSpawn"),
      birth: gl.getAttribLocation(program, "aBirthTime"),
      velocity: gl.getAttribLocation(program, "aVelocity"),
      lifetime: gl.getAttribLocation(program, "aLifetime"),
      drag: gl.getAttribLocation(program, "aDrag"),
      size: gl.getAttribLocation(program, "aSizeMix"),
      type: gl.getAttribLocation(program, "aType"),
      color: gl.getAttribLocation(program, "aColorClass"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      sceneTime: gl.getUniformLocation(program, "uSceneTime"),
    };
    let activationStart = null;
    let schedule = null;
    let surfacePoints = [];

    function activate(rendererTime, seed = 0, tilt = [0, 0]) {
      if (activationStart !== null) return;
      activationStart = rendererTime;
      schedule = buildBurstSchedule(sampleSurface, seed, particleCount);
      surfacePoints = schedule.particles.filter(p => p.type === 1).map(p => p.spawn);
      const data = new Float32Array(particleCount * strideFloats);
      schedule.particles.forEach((p, index) => {
        const offset = index * strideFloats;
        const origin = rotateFromBulb(p.spawn, tilt);
        const velocity = rotateFromBulb(p.velocity, tilt, true);
        data.set([...origin,p.birth,...velocity,p.life,p.drag,p.size,p.type,p.color],offset);
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    }

    function bindAttribute(location, size, offsetFloats) {
      if (location < 0) return;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,size,gl.FLOAT,false,
        strideFloats * Float32Array.BYTES_PER_ELEMENT,
        offsetFloats * Float32Array.BYTES_PER_ELEMENT
      );
    }

    function render(time,width,height) {
      if (activationStart === null || time < activationStart || time - activationStart > 3.5) return;
      const previousProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      const blending = gl.isEnabled(gl.BLEND);
      const srcRGB = gl.getParameter(gl.BLEND_SRC_RGB);
      const dstRGB = gl.getParameter(gl.BLEND_DST_RGB);
      const srcA = gl.getParameter(gl.BLEND_SRC_ALPHA);
      const dstA = gl.getParameter(gl.BLEND_DST_ALPHA);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      bindAttribute(locations.spawn,3,0);
      bindAttribute(locations.birth,1,3);
      bindAttribute(locations.velocity,3,4);
      bindAttribute(locations.lifetime,1,7);
      bindAttribute(locations.drag,1,8);
      bindAttribute(locations.size,1,9);
      bindAttribute(locations.type,1,10);
      bindAttribute(locations.color,1,11);
      gl.uniform2f(locations.resolution,width,height);
      gl.uniform1f(locations.time,time-activationStart);
      gl.uniform1f(locations.sceneTime,time);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS,0,particleCount);
      for (const key of ["spawn","birth","velocity","lifetime","drag","size","type","color"]) {
        if (locations[key] >= 0) gl.disableVertexAttribArray(locations[key]);
      }
      if(!blending) gl.disable(gl.BLEND);
      gl.blendFuncSeparate(srcRGB,dstRGB,srcA,dstA);
      gl.bindBuffer(gl.ARRAY_BUFFER,previousBuffer);
      gl.useProgram(previousProgram);
    }

    function dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }

    return {
      particleCount,
      get bursts() { return schedule?.bursts || []; },
      get surfacePoints() { return surfacePoints; },
      activate,render,dispose,
    };
  }

  window.createSparkParticlePass = createSparkParticlePass;
})();
