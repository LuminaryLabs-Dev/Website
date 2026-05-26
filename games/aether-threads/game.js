/**
 * AETHER THREADS - CUSTOM SHADER ENGINE CONFIG
 */

// --- CUSTOM SHADER GLSL DICTIONARY ---

const tunnelVertexShader = `
    varying vec2 vUv;
    uniform float time;
    uniform float speed;
    void main() {
        vUv = uv;
        vec3 pos = position;
        float angle = pos.z * 0.002 + (time * speed * 0.05);
        float s = sin(angle);
        float c = cos(angle);
        pos.xy = mat2(c, -s, s, c) * pos.xy;
        pos.x += sin(pos.z * 0.01 + time) * 15.0;
        pos.y += cos(pos.z * 0.01 + time) * 15.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const tunnelFragmentShader = `
    varying vec2 vUv;
    uniform float time;
    uniform float speed;
    void main() {
        vec2 uv = vUv;
        uv.y -= time * speed * 0.2;
        vec2 grid = abs(fract(uv * vec2(20.0, 150.0)) - 0.5);
        float line = smoothstep(0.48, 0.5, max(grid.x, grid.y));
        vec3 gridColor = vec3(0.02, 0.05, 0.08); 
        vec3 bg = vec3(0.0, 0.0, 0.0);
        gl_FragColor = vec4(mix(gridColor, bg, line), 1.0);
    }
`;

const shapeVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float time;
    void main() {
        vec3 pos = position * (1.0 + sin(time * 10.0 + position.x) * 0.05);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const shapeFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform vec3 baseColor;
    uniform float time;
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = dot(normal, viewDir);
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 1.5);
        float pulse = sin(time * 8.0) * 0.5 + 0.5;
        gl_FragColor = vec4(baseColor * (0.8 + fresnel * 2.5 + pulse * 1.0), 1.0);
    }
`;

const ChromaticAberrationShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "amount":   { value: 0.002 },
        "time":     { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            vec2 coord = uv - 0.5;
            float dist = length(coord);
            float caAmount = amount * dist * 2.0; 
            vec4 cr = texture2D(tDiffuse, uv + coord * caAmount);
            vec4 cg = texture2D(tDiffuse, uv);
            vec4 cb = texture2D(tDiffuse, uv - coord * caAmount);
            gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a) * (1.0 - (dist * dist * 0.8));
        }
    `
};

// --- CORE ENGINE VARIABLES ---

let scene, camera, renderer, composer, caPass;
let tunnel, playerVehicle, particles;
let shapes = [];

let gameRunning = false;
let time = 0;
let baseSpeed = 8;
let currentSpeed = 0;
let targetSpeed = 8;
let score = 0;
let energy = 100;

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
let targetX = 0, targetY = 0;
let gamepadIndex = null;
let lastGamepadAState = false;

let audioCtx, masterCompressor;
let nextNoteTime = 0, currentStep = 0, tempo = 138, whiteNoiseBuffer, globalSpeedFactor = 0;

const TYPE_PINK = { color: new THREE.Color(0xff00aa), name: 'pink' };
const TYPE_RED = { color: new THREE.Color(0xff0000), name: 'red' };
const TYPE_GREEN = { color: new THREE.Color(0x00ff00), name: 'green' };
const TYPE_BLUE = { color: new THREE.Color(0x0088ff), name: 'blue' };

// --- RUNTIME SYSTEM ---

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    container.appendChild(renderer.domElement);

    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.5, 0.8, 0.1);
    caPass = new THREE.ShaderPass(ChromaticAberrationShader);
    
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(caPass);

    createTunnel();
    createPlayer();
    createShapes();
    createParticles();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('gamepadconnected', (e) => { gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', (e) => { if (gamepadIndex === e.gamepad.index) gamepadIndex = null; });

    document.getElementById('init-btn').addEventListener('click', startGame);
    document.getElementById('reboot-btn').addEventListener('click', () => location.reload());

    requestAnimationFrame(animate);
}

function createPlayer() {
    playerVehicle = new THREE.Group();
    const bodyGeom = new THREE.TetrahedronGeometry(4, 0);
    bodyGeom.scale(1.5, 0.5, 2.5);
    bodyGeom.rotateX(Math.PI / 4);
    const body = new THREE.Mesh(bodyGeom, new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }));
    
    const coreGeom = new THREE.TetrahedronGeometry(2, 0);
    coreGeom.scale(1.5, 0.5, 2.5);
    coreGeom.rotateX(Math.PI / 4);
    playerVehicle.add(body, new THREE.Mesh(coreGeom, new THREE.MeshBasicMaterial({ color: 0xffffff })));
    playerVehicle.position.set(0, -10, -50);
    scene.add(playerVehicle);
}

function createTunnel() {
    const geometry = new THREE.CylinderGeometry(150, 150, 4000, 32, 64, true);
    geometry.rotateX(Math.PI / 2);
    tunnel = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
        vertexShader: tunnelVertexShader,
        fragmentShader: tunnelFragmentShader,
        uniforms: { time: { value: 0 }, speed: { value: 1.0 } },
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending
    }));
    scene.add(tunnel);
}

function spawnShape(zOffset) {
    let r = Math.random(), type = TYPE_PINK;
    if (r > 0.7 && r <= 0.8) type = TYPE_RED;
    else if (r > 0.8 && r <= 0.9) type = TYPE_GREEN;
    else if (r > 0.9) type = TYPE_BLUE;

    let geomR = Math.random(), geometry, radius = 6 + Math.random() * 4;
    if (geomR < 0.25) geometry = new THREE.IcosahedronGeometry(radius, 0);
    else if (geomR < 0.5) geometry = new THREE.OctahedronGeometry(radius, 0);
    else if (geomR < 0.75) geometry = new THREE.TetrahedronGeometry(radius, 0);
    else geometry = new THREE.TorusGeometry(radius, radius * 0.3, 8, 16);

    const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
        vertexShader: shapeVertexShader,
        fragmentShader: shapeFragmentShader,
        uniforms: { time: { value: Math.random() * 100 }, baseColor: { value: type.color } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        wireframe: true
    }));

    const angle = Math.random() * Math.PI * 2, dist = Math.random() * 100;
    mesh.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, zOffset);
    mesh.userData = { type: type.name, radius, rotX: (Math.random() - 0.5) * 2, rotY: (Math.random() - 0.5) * 2, rotZ: (Math.random() - 0.5) * 2, hit: false };
    scene.add(mesh);
    return mesh;
}

function createShapes() {
    for (let i = 0; i < 80; i++) shapes.push(spawnShape(-(Math.random() * 6000)));
}

function createParticles() {
    const particleCount = 2000, geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3), sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = -Math.random() * 1000;
        sizes[i] = Math.random() * 2;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particles = new THREE.Points(geometry, new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x00ffff) } },
        vertexShader: `uniform float time; attribute float size; varying float vAlpha; void main() { vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (300.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; vAlpha = 0.5 + sin(time * 5.0 + position.z) * 0.5; }`,
        fragmentShader: `uniform vec3 color; varying float vAlpha; void main() { float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard; gl_FragColor = vec4(color * pow(1.0 - (r * 2.0), 2.0), vAlpha); }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(particles);
}

// --- PROCEDURAL AUDIO FRAMEWORK ---

function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.value = -10;
    masterCompressor.release.value = 0.25;
    masterCompressor.connect(audioCtx.destination);

    const bufferSize = audioCtx.sampleRate * 2.0; 
    whiteNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    nextNoteTime = audioCtx.currentTime + 0.1;
}

function makeDistortionCurve(amount = 50) {
    let curve = new Float32Array(44100);
    for (let i = 0; i < 44100; ++i) {
        let x = i * 2 / 44100 - 1;
        curve[i] = (3 + amount) * x * 20 * (Math.PI / 180) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

function playGlitchZap() {
    const t = audioCtx.currentTime, osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t); osc.frequency.setValueAtTime(1200, t + 0.1);
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(2000, t); filter.Q.value = 20;
    gain.gain.setValueAtTime(0.8, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(masterCompressor);
    osc.start(t); osc.stop(t + 0.2);
}

function playHeavyImpact() {
    const t = audioCtx.currentTime, dist = audioCtx.createWaveShaper(), subOsc = audioCtx.createOscillator(), subGain = audioCtx.createGain();
    dist.curve = makeDistortionCurve(100);
    subOsc.type = 'sine'; subOsc.frequency.setValueAtTime(150, t); subOsc.frequency.exponentialRampToValueAtTime(20, t + 1.0);
    subGain.gain.setValueAtTime(1.0, t); subGain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    subOsc.connect(dist); dist.connect(subGain); subGain.connect(masterCompressor);

    const noiseSrc = audioCtx.createBufferSource(), noiseGain = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
    noiseSrc.buffer = whiteNoiseBuffer; filter.type = 'lowpass'; filter.frequency.setValueAtTime(4000, t);
    noiseGain.gain.setValueAtTime(1.0, t); noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    noiseSrc.connect(filter); filter.connect(dist); dist.connect(noiseGain); noiseGain.connect(masterCompressor);
    subOsc.start(t); subOsc.stop(t + 1.0); noiseSrc.start(t); noiseSrc.stop(t + 0.8);
}

function playWarpBoost() {
    const t = audioCtx.currentTime, osc1 = audioCtx.createOscillator(), osc2 = audioCtx.createOscillator(), filter = audioCtx.createBiquadFilter(), gain = audioCtx.createGain();
    osc1.type = 'sawtooth'; osc2.type = 'square';
    osc1.frequency.setValueAtTime(100, t); osc1.frequency.exponentialRampToValueAtTime(800, t + 0.6);
    osc2.frequency.setValueAtTime(102, t); osc2.frequency.exponentialRampToValueAtTime(816, t + 0.6);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(200, t); filter.frequency.exponentialRampToValueAtTime(4000, t + 0.6);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.5, t + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(masterCompressor);
    osc1.start(t); osc2.start(t); osc1.stop(t + 0.6); osc2.stop(t + 0.6);
}

function playRegenChime() {
    const t = audioCtx.currentTime, notes = [1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const noteTime = t + (i * 0.08);
        gain.gain.setValueAtTime(0, noteTime); gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.3);
        osc.connect(gain); gain.connect(masterCompressor);
        osc.start(noteTime); osc.stop(noteTime + 0.3);
    });
}

function scheduleAudio() {
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        const macroPhase = (nextNoteTime % 300) / 300, isBreakdown = macroPhase > 0.4 && macroPhase < 0.6, isBuild = (macroPhase > 0.3 && macroPhase < 0.4) || (macroPhase > 0.8 && macroPhase < 0.9);
        if (currentStep % 4 === 0 && !isBreakdown) {
            const kickOsc = audioCtx.createOscillator(), kickGain = audioCtx.createGain();
            kickOsc.connect(kickGain); kickGain.connect(masterCompressor);
            kickOsc.frequency.setValueAtTime(150, nextNoteTime); kickOsc.frequency.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
            kickGain.gain.setValueAtTime(1.0, nextNoteTime); kickGain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
            kickOsc.start(nextNoteTime); kickOsc.stop(nextNoteTime + 0.5);
        }
        if (!isBreakdown && (currentStep % 4 === 2 || (isBuild && currentStep % 2 === 0))) {
            const src = audioCtx.createBufferSource(), f = audioCtx.createBiquadFilter(), g = audioCtx.createGain();
            src.buffer = whiteNoiseBuffer; f.type = 'highpass'; f.frequency.value = 7000;
            src.connect(f); f.connect(g); g.connect(masterCompressor);
            g.gain.setValueAtTime(0.2, nextNoteTime); g.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + (currentStep % 4 === 2 ? 0.3 : 0.05));
            src.start(nextNoteTime); src.stop(nextNoteTime + 0.3);
        }
        const acidPattern = [0, null, 3, null, 5, null, 7, 10, 0, null, 3, null, 12, 10, 7, 3];
        if (acidPattern[currentStep] !== null) {
            const bOsc = audioCtx.createOscillator(), bFilter = audioCtx.createBiquadFilter(), bGain = audioCtx.createGain();
            bOsc.type = 'sawtooth'; bOsc.frequency.value = 440 * Math.pow(2, ((36 + acidPattern[currentStep] + ((Math.floor(nextNoteTime / (60/tempo * 4)) % 4 === 3) ? 5 : 0)) - 69) / 12);
            bFilter.type = 'lowpass'; bFilter.Q.value = 15;
            bFilter.frequency.setValueAtTime(100 + (globalSpeedFactor * 2000) + (macroPhase * 1500), nextNoteTime); bFilter.frequency.exponentialRampToValueAtTime(50, nextNoteTime + 0.2);
            bGain.gain.setValueAtTime(0.5, nextNoteTime); bGain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.2);
            bOsc.connect(bFilter); bFilter.connect(bGain); bGain.connect(masterCompressor);
            bOsc.start(nextNoteTime); bOsc.stop(nextNoteTime + 0.2);
        }
        nextNoteTime += 0.25 * (60.0 / tempo); currentStep = (currentStep + 1) % 16;
    }
}

// --- ENGINE LOGIC LOOPS ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
}
function onKeyDown(event) { if (keys.hasOwnProperty(event.key)) keys[event.key] = true; if ((event.key === 'Enter' || event.key === ' ') && !gameRunning) handleMenuSelect(); }
function onKeyUp(event) { if (keys.hasOwnProperty(event.key)) keys[event.key] = false; }

function handleMenuSelect() {
    if (document.getElementById('start-screen').style.display !== 'none') startGame();
    else if (document.getElementById('game-over').style.display === 'flex') location.reload();
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    initAudio(); gameRunning = true;
}

function updateGameLogic(delta) {
    if (!gameRunning) return;
    baseSpeed = 8 + Math.log(1 + (time / 15)) * 10; energy -= 1 * delta;

    let moveX = 0, moveY = 0, moveSpeed = 100 * delta;
    if (gamepadIndex !== null) {
        const gp = navigator.getGamepads()[gamepadIndex];
        if (gp) {
            if (Math.abs(gp.axes[0]) > 0.15) moveX = gp.axes[0] * 1.5;
            if (Math.abs(gp.axes[1]) > 0.15) moveY = -gp.axes[1] * 1.5;
        }
    }
    if (moveX === 0 && moveY === 0) {
        if (keys.ArrowLeft || keys.a) moveX = -1; if (keys.ArrowRight || keys.d) moveX = 1;
        if (keys.ArrowUp || keys.w) moveY = 1; if (keys.ArrowDown || keys.s) moveY = -1;
    }
    targetX = Math.max(-100, Math.min(100, targetX + moveX * moveSpeed));
    targetY = Math.max(-100, Math.min(100, targetY + moveY * moveSpeed));

    playerVehicle.position.x += (targetX - playerVehicle.position.x) * delta * 8;
    playerVehicle.position.y += (targetY - playerVehicle.position.y) * delta * 8;
    playerVehicle.rotation.z = (playerVehicle.position.x - targetX) * 0.1;
    playerVehicle.rotation.x = (playerVehicle.position.y - targetY) * 0.1;

    currentSpeed += (targetSpeed - currentSpeed) * delta;
    targetSpeed = Math.max(baseSpeed, targetSpeed - delta * 12);
    playerVehicle.position.z -= currentSpeed * delta * 50;

    camera.position.x += (playerVehicle.position.x * 0.6 - camera.position.x) * delta * 5;
    camera.position.y += ((playerVehicle.position.y + 15) - camera.position.y) * delta * 5;
    camera.position.z = playerVehicle.position.z + 40;

    tunnel.position.z = playerVehicle.position.z - 2000;
    tunnel.material.uniforms.time.value = time;
    tunnel.material.uniforms.speed.value = currentSpeed * 0.05;

    globalSpeedFactor = Math.max(0, (currentSpeed - baseSpeed) / 80);
    caPass.uniforms.amount.value = 0.002 + (globalSpeedFactor * 0.02);
    camera.fov = 75 + (globalSpeedFactor * 30); camera.updateProjectionMatrix();

    let hitDamage = false;
    shapes.forEach(shape => {
        shape.material.uniforms.time.value = time;
        shape.rotation.x += shape.userData.rotX * delta; shape.rotation.y += shape.userData.rotY * delta;
        if (playerVehicle.position.z < shape.position.z - 50) {
            shape.position.z = playerVehicle.position.z - 6000;
            const angle = Math.random() * Math.PI * 2, dist = Math.random() * 100;
            shape.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, shape.position.z);
            shape.userData.hit = false;
            const colors = { 'pink': TYPE_PINK.color, 'red': TYPE_RED.color, 'green': TYPE_GREEN.color, 'blue': TYPE_BLUE.color };
            shape.material.uniforms.baseColor.value = colors[shape.userData.type];
        }
        if (!shape.userData.hit && Math.abs(playerVehicle.position.z - shape.position.z) < 10) {
            if (Math.sqrt(Math.pow(playerVehicle.position.x - shape.position.x, 2) + Math.pow(playerVehicle.position.y - shape.position.y, 2)) < shape.userData.radius + 6) {
                shape.userData.hit = true; shape.material.uniforms.baseColor.value = new THREE.Color(0xffffff);
                if (shape.userData.type === 'red') { energy = 0; hitDamage = true; playHeavyImpact(); }
                else if (shape.userData.type === 'pink') { energy -= 15; targetSpeed = Math.max(baseSpeed * 0.5, targetSpeed - 15); hitDamage = true; playGlitchZap(); }
                else if (shape.userData.type === 'green') { targetSpeed += 25; score += 500; playWarpBoost(); }
                else if (shape.userData.type === 'blue') { energy = Math.min(100, energy + 25); score += 200; playRegenChime(); }
            }
        }
    });

    score += currentSpeed * delta;
    document.getElementById('damage-vignette').style.boxShadow = hitDamage ? 'inset 0 0 200px rgba(255, 0, 0, 0.9)' : 'inset 0 0 150px rgba(255, 0, 0, 0)';
    document.getElementById('speed-val').innerText = (currentSpeed * 0.01).toFixed(3) + 'c';
    document.getElementById('score-val').innerText = Math.floor(score);
    document.getElementById('energy-bar').style.width = Math.max(0, energy) + '%';
    document.getElementById('energy-bar').style.background = energy < 30 ? '#ff0033' : 'linear-gradient(90deg, #00ffff, #ff00ff)';

    if (energy <= 0) { gameRunning = false; document.getElementById('game-over').style.display = 'flex'; document.getElementById('final-score').innerText = 'DATA INTEGRATED: ' + Math.floor(score); if (audioCtx) { audioCtx.close(); audioCtx = null; } }
    particles.position.z = camera.position.z - 500; particles.material.uniforms.time.value = time;
}

function animate(timestamp) {
    requestAnimationFrame(animate);
    if (!timestamp) return;
    let delta = Math.min((timestamp - (animate.lastTime || timestamp)) / 1000, 0.1);
    animate.lastTime = timestamp; time += delta;

    if (gamepadIndex !== null) {
        const gp = navigator.getGamepads()[gamepadIndex];
        if (gp && gp.buttons[0]) {
            if (gp.buttons[0].pressed && !lastGamepadAState) handleMenuSelect();
            lastGamepadAState = gp.buttons[0].pressed;
        }
    }

    updateGameLogic(delta);
    if (gameRunning) scheduleAudio();
    camera.rotation.z = playerVehicle ? playerVehicle.position.x * -0.005 : 0;
    camera.rotation.x = -0.15;
    caPass.uniforms.time.value = time;
    composer.render();
}

init();