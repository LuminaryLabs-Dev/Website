(function () {
  const MAX_PARTICLE_COUNT = 96;
  const PROFILE_SAMPLES = 384;
  const SURFACE_MIN_Y = -0.440;
  const TOP_Y = 1.200;
  const SURFACE_ANGLE_MARGIN = 0.100;
  const LIFETIME = 2.6;
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
      const angle = SURFACE_ANGLE_MARGIN
        + (Math.PI - 2 * SURFACE_ANGLE_MARGIN) * unitAngle;
      const radius = glassProfileRadius(y, angle);

      return [
        radius * Math.cos(angle),
        y,
        radius * Math.sin(angle),
      ];
    };
  }

  function buildBurstSchedule(sampleSurface) {
    const particles = [];
    const bursts = [];
    let nextBurstTime = 0;
    let burstNumber = 0;

    while (particles.length < MAX_PARTICLE_COUNT) {
      const requestedCount = 5 + Math.floor(6 * hash(burstNumber));
      if (particles.length + requestedCount > MAX_PARTICLE_COUNT) break;

      const burst = {
        index: burstNumber,
        birthTime: nextBurstTime,
        count: requestedCount,
      };

      for (let member = 0; member < requestedCount; member += 1) {
        const index = particles.length;
        const surfaceHeight = hash(burstNumber * 131 + member * 17 + 401);
        const surfaceAngle = hash(burstNumber * 197 + member * 29 + 503);
        const sizeMix = Math.pow(hash(index), 2.2);
        const colorSeed = hash(index + 211);
        let colorClass = colorSeed < 0.55 ? 0 : colorSeed < 0.85 ? 1 : 2;

        // Keep warm white concentrated in the smallest, sharpest sparks.
        if (colorClass === 1 && sizeMix > 0.42) {
          colorClass = hash(index + 307) < 0.72 ? 0 : 2;
        }

        particles.push({
          spawn: sampleSurface(surfaceHeight, surfaceAngle),
          birthTime: nextBurstTime,
          speed: 0.16 * (0.85 + 0.30 * hash(index + 17)),
          curlPhase: hash(index + 1) * TAU,
          sizeMix,
          colorClass,
        });
      }

      bursts.push(burst);
      nextBurstTime += 0.35 + (1.10 - 0.35) * hash(burstNumber + 19);
      burstNumber += 1;
    }

    return {
      particles,
      bursts,
      cycleDuration: nextBurstTime,
    };
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
      loadSource("assets/shaders/spark-particles.vert.glsl?v=20260901-1"),
      loadSource("assets/shaders/spark-particles.frag.glsl?v=20260901-1"),
    ]);

    const program = link(gl, vertexSource, fragmentSource);
    const sampleSurface = createSurfaceSampler();
    const schedule = buildBurstSchedule(sampleSurface);
    const particleCount = schedule.particles.length;
    const surfacePoints = schedule.particles.map(particle => particle.spawn);
    const strideFloats = 8;
    const particleData = new Float32Array(particleCount * strideFloats);

    schedule.particles.forEach((particle, index) => {
      const offset = index * strideFloats;
      particleData[offset] = particle.spawn[0];
      particleData[offset + 1] = particle.spawn[1];
      particleData[offset + 2] = particle.spawn[2];
      particleData[offset + 3] = particle.birthTime;
      particleData[offset + 4] = particle.speed;
      particleData[offset + 5] = particle.curlPhase;
      particleData[offset + 6] = particle.sizeMix;
      particleData[offset + 7] = particle.colorClass;
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);

    const locations = {
      spawn: gl.getAttribLocation(program, "aSpawn"),
      birthTime: gl.getAttribLocation(program, "aBirthTime"),
      speed: gl.getAttribLocation(program, "aSpeed"),
      curlPhase: gl.getAttribLocation(program, "aCurlPhase"),
      sizeMix: gl.getAttribLocation(program, "aSizeMix"),
      colorClass: gl.getAttribLocation(program, "aColorClass"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      lifetime: gl.getUniformLocation(program, "uLifetime"),
      cycleDuration: gl.getUniformLocation(program, "uCycleDuration"),
    };

    function bindAttribute(location, size, offsetFloats) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        size,
        gl.FLOAT,
        false,
        strideFloats * Float32Array.BYTES_PER_ELEMENT,
        offsetFloats * Float32Array.BYTES_PER_ELEMENT
      );
    }

    function render(time, width, height) {
      const previousProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      const blendWasEnabled = gl.isEnabled(gl.BLEND);
      const previousSourceRgb = gl.getParameter(gl.BLEND_SRC_RGB);
      const previousDestinationRgb = gl.getParameter(gl.BLEND_DST_RGB);
      const previousSourceAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
      const previousDestinationAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      bindAttribute(locations.spawn, 3, 0);
      bindAttribute(locations.birthTime, 1, 3);
      bindAttribute(locations.speed, 1, 4);
      bindAttribute(locations.curlPhase, 1, 5);
      bindAttribute(locations.sizeMix, 1, 6);
      bindAttribute(locations.colorClass, 1, 7);

      gl.uniform2f(locations.resolution, width, height);
      gl.uniform1f(locations.time, time);
      gl.uniform1f(locations.lifetime, LIFETIME);
      gl.uniform1f(locations.cycleDuration, schedule.cycleDuration);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
      gl.drawArrays(gl.POINTS, 0, particleCount);

      if (!blendWasEnabled) gl.disable(gl.BLEND);
      gl.blendFuncSeparate(
        previousSourceRgb,
        previousDestinationRgb,
        previousSourceAlpha,
        previousDestinationAlpha
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer);
      gl.useProgram(previousProgram);
    }

    function dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }

    return {
      particleCount,
      bursts: schedule.bursts,
      cycleDuration: schedule.cycleDuration,
      surfaceMinY: SURFACE_MIN_Y,
      topY: TOP_Y,
      surfacePoints,
      render,
      dispose,
    };
  }

  window.createSparkParticlePass = createSparkParticlePass;
})();
