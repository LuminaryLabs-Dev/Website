(() => {
'use strict';

// Ensure the DOM is fully evaluated before initializing WebGL structures
window.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // RESTORED: Master animation clock missing from the modular extraction pass
    const clock = new THREE.Clock();

    // ==========================================
    // GLOBALS & STATE INITIALIZATION
    // ==========================================
    const tempV1 = new THREE.Vector3();
    const tempV2 = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    const idealCamPos = new THREE.Vector3();

    const TILE_SIZE = 60;
    const NUM_CHUNKS = 8; 
    const MAX_COORDS_X = 16.0; 
    const MIN_COORDS_Y = 0.5; 
    const MAX_COORDS_Y = 80.0;
    const MAX_SAFE_Y = 14.0; 

    let gameState = 'START';
    let distanceTraveled = 0;
    let honeycombCount = 0;
    let lastUpgradeMilestone = 0;
    let nextUpgradeDistance = 500; 

    let currentSpeed = 0.5;
    let targetSpeed = 0.55;
    let maxSpeedBonus = 0.0;

    let lives = 3;
    let invulnerabilityTime = 0;

    let altitudeWarningTimer = 0;
    let lastAltitudeDamageTime = 0;
    let dynamicMaxSafeY = 14.0; 

    let hudMesh; 

    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, ' ': false, Shift: false };
    let pointerX = 0; 
    let pointerY = 0; 

    let playerVelocity = new THREE.Vector3();
    let isBoosting = false;
    let boostTimer = 0;
    let boostCooldown = 0;
    let boostCooldownModifier = 1.0;
    let lastButtonStateA = false;
    let lastButtonStateX = false;
    let lastDPadY = 0;

    const globalUniforms = { uTime: { value: 0.0 } };

    // ==========================================
    // HIGH FIDELITY TEXTURE GENERATION
    // ==========================================
    function generateVialTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#ff4444'); 
        grad.addColorStop(0.5, '#aa0000'); 
        grad.addColorStop(1, '#440000'); 
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 128);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(15, 0, 12, 128); 
        return new THREE.CanvasTexture(canvas);
    }

    function generateRustTexture() {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        for(let i=0; i<25000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#5c3a21' : '#3d2212';
            ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
        }
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#222'; ctx.fillRect(0,0,256,256);
        const transformTex = new THREE.CanvasTexture(c);
        transformTex.wrapS = transformTex.wrapT = THREE.RepeatWrapping;
        return transformTex;
    }

    function generateMetalTexture() {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#666'; ctx.fillRect(0,0,256,256);
        for(let i=0; i<5000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, Math.random()*256, 256, 1);
        }
        const transformTex = new THREE.CanvasTexture(c);
        transformTex.wrapS = transformTex.wrapT = THREE.RepeatWrapping;
        return transformTex;
    }

    const rustTex = generateRustTexture();
    const metalTex = generateMetalTexture();

    // ==========================================
    // AUDIO ENGINE
    // ==========================================
    let audioCtx;
    const pentatonicScale = [110.00, 123.47, 130.81, 146.83, 164.81, 196.00, 220.00]; 
    let nextNoteTime = 0;

    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        nextNoteTime = audioCtx.currentTime + 0.1;
    }

    function playSynthPluck(time, isCollect = false) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        if (isCollect) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)] * 4.0, time);
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)] * 0.5, time);
            gain.gain.setValueAtTime(0.08, time); 
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        }
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.8);
    }

    function playImpactSound() {
        if (!audioCtx) return;
        const time = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + 0.4);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.45);
    }

    function playDodgeSound() {
        if (!audioCtx) return;
        const time = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.linearRampToValueAtTime(300, time + 0.35);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.45);
    }

    // ==========================================
    // WEBGL & LIGHTING PASS
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18120c); 
    scene.fog = new THREE.FogExp2(0x18120c, 0.015); 

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 450);
    scene.add(camera);

    const directLight = new THREE.DirectionalLight(0xffcc88, 1.4); 
    directLight.position.set(30, 60, 20);
    directLight.castShadow = true;
    directLight.shadow.mapSize.width = 1024;
    directLight.shadow.mapSize.height = 1024;
    directLight.shadow.camera.near = 0.5;
    directLight.shadow.camera.far = 150;
    directLight.shadow.camera.left = -40;
    directLight.shadow.camera.right = 40;
    directLight.shadow.camera.top = 40;
    directLight.shadow.camera.bottom = -40;

    const lightTarget = new THREE.Object3D();
    scene.add(lightTarget);
    directLight.target = lightTarget;
    scene.add(directLight);

    const ambientLight = new THREE.AmbientLight(0x2d1f18, 1.3);
    scene.add(ambientLight);

    const starsGeo = new THREE.BufferGeometry();
    const starPos = [];
    for(let i=0; i<1200; i++) {
        starPos.push((Math.random()-0.5)*1000, 50 + Math.random()*800, (Math.random()-0.5)*1000);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({color: 0xffddaa, size: 1.5, sizeAttenuation: false, fog: false});
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ==========================================
    // PLAYER GLIDER
    // ==========================================
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 5, 0);
    scene.add(playerGroup);

    const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xc5b358, metalness: 0.9, roughness: 0.2 });

    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.2, 2.8, 12);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, brassMaterial);
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);

    const eyeGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, emissive: 0x550000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.35, 0.15, -1.2);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.35, 0.15, -1.2);
    playerGroup.add(leftEye, rightEye);

    const wingPivots = [];
    const wingOffsets = [
        { x: -0.4, z: -0.4, signX: -1 }, { x: 0.4, z: -0.4, signX: 1 },
        { x: -0.3, z: 0.3, signX: -1 }, { x: 0.3, z: 0.3, signX: 1 }
    ];

    wingOffsets.forEach(offset => {
        const pivot = new THREE.Group();
        pivot.position.set(offset.x, 0.1, offset.z);
        playerGroup.add(pivot);
        wingPivots.push(pivot);

        const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8), brassMaterial);
        joint.rotation.z = Math.PI/2;
        pivot.add(joint);

        const wingFrameGeo = new THREE.BoxGeometry(2.6, 0.03, 0.5);
        wingFrameGeo.translate(1.3 * offset.signX, 0, 0);
        const frame = new THREE.Mesh(wingFrameGeo, brassMaterial);
        frame.castShadow = true;

        const wingGlassGeo = new THREE.BoxGeometry(2.4, 0.01, 0.4);
        wingGlassGeo.translate(1.3 * offset.signX, 0, 0);
        const glass = new THREE.Mesh(wingGlassGeo, new THREE.MeshPhysicalMaterial({
            color: 0x88ccaa, transparent: true, opacity: 0.6, roughness: 0.1, transmission: 0.8, iridescence: 1.0
        }));
        pivot.add(frame);
        pivot.add(glass);
    });

    const tailSegments = [];
    for (let i = 0; i < 6; i++) {
        const tailGeo = new THREE.CylinderGeometry(0.18 - i * 0.025, 0.15 - i * 0.025, 0.5, 8);
        tailGeo.rotateX(Math.PI / 2);
        const seg = new THREE.Mesh(tailGeo, brassMaterial);
        seg.position.set(0, 0, 1.4 + i * 0.45);
        playerGroup.add(seg);
        tailSegments.push(seg);
    }

    const vialOuterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 12);
    vialOuterGeo.rotateX(Math.PI / 2);
    const vialOuter = new THREE.Mesh(vialOuterGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.1, transmission: 0.9 }));
    vialOuter.position.set(0, 0.35, 0.1);
    playerGroup.add(vialOuter);

    const vialInnerGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.72, 8);
    vialInnerGeo.rotateX(Math.PI / 2);
    const vialInner = new THREE.Mesh(vialInnerGeo, new THREE.MeshStandardMaterial({ map: generateVialTexture(), roughness: 0.3, metalness: 0.1 }));
    vialInner.position.set(0, 0.35, 0.1);
    playerGroup.add(vialInner);

    // ==========================================
    // HIGH FIDELITY LEVEL & HAZARD GENERATION
    // ==========================================
    const groundGeo = new THREE.PlaneGeometry(200, TILE_SIZE);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x241a0f, roughness: 1.0 });

    const trunkGeo = new THREE.CylinderGeometry(0.8, 1.4, 15, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2212, roughness: 1.0 });

    const pineGeo1 = new THREE.ConeGeometry(5, 12, 7);
    const pineGeo2 = new THREE.ConeGeometry(4, 10, 7);
    const pineGeo3 = new THREE.ConeGeometry(3, 8, 7);

    const factoryGeoBase = new THREE.BoxGeometry(25, 30, 30);
    const factoryGeoTower = new THREE.BoxGeometry(15, 45, 20);
    const stackGeo = new THREE.CylinderGeometry(1.5, 2.5, 60, 8);
    const windowGeo = new THREE.PlaneGeometry(4, 8);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

    // ------------------------------------------
    // DIEGETIC HUD
    // ------------------------------------------
    const hudPanelGeo = new THREE.PlaneGeometry(2.5, 0.625);
    const hudPanelMat = new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthWrite: false });
    hudMesh = new THREE.Mesh(hudPanelGeo, hudPanelMat); 
    hudMesh.position.set(0, -1.2, -3); 
    hudMesh.rotation.x = -0.3;
    camera.add(hudMesh);

    // ==========================================
    // LEVEL TILE GENERATOR & LOOP
    // ==========================================
    const levelTiles = [];

    for (let i = 0; i < NUM_CHUNKS; i++) {
        const chunk = new THREE.Group();
        chunk.position.z = -i * TILE_SIZE;

        const floor = new THREE.Mesh(groundGeo, groundMat);
        floor.position.y = 0;
        floor.receiveShadow = true;
        chunk.add(floor);

        for (let side = -1; side <= 1; side += 2) {
            if (Math.random() > 0.3) {
                const factGroup = new THREE.Group();
                factGroup.position.set(side * (40 + Math.random() * 20), 0, (Math.random() - 0.5) * TILE_SIZE);
                
                const f1 = new THREE.Mesh(factoryGeoBase, factoryMat); f1.position.y = 15;
                const f2 = new THREE.Mesh(factoryGeoTower, factoryMat); f2.position.set(side*5, 22.5, 5);
                const stack = new THREE.Mesh(stackGeo, factoryMat); stack.position.set(0, 30, -5);
                const win = new THREE.Mesh(windowGeo, windowMat);
                win.position.set(side * -12.6, 20, 0);
                win.rotation.y = side * -Math.PI/2;

                factGroup.add(f1, f2, stack, win);
                chunk.add(factGroup);

                const targetObj = new THREE.Object3D();
                targetObj.position.set(0, 0, factGroup.position.z + (Math.random()-0.5)*10);
                chunk.add(targetObj);
                
                const spotLight = new THREE.SpotLight(0xffe0bb, 2.5, 120, Math.PI / 6, 0.5, 1.0);
                spotLight.position.set(factGroup.position.x - (side*15), 45, factGroup.position.z);
                spotLight.target = targetObj;
                chunk.add(spotLight);
            }

            for(let t = 0; t < 12; t++) {
                const treeGroup = new THREE.Group();
                const tX = side * (18 + Math.random() * 20); 
                const tZ = (Math.random() - 0.5) * TILE_SIZE;
                treeGroup.position.set(tX, 0, tZ);
                
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 7.5;
                treeGroup.add(trunk);

                if (Math.random() > 0.5) {
                    const pColors = [0xbf5a13, 0xd35400, 0xb8860b, 0xa0522d];
                    const branchMat = new THREE.MeshStandardMaterial({ color: pColors[Math.floor(Math.random() * pColors.length)], roughness: 0.8 });
                    const p1 = new THREE.Mesh(pineGeo1, branchMat); p1.position.y = 12;
                    const p2 = new THREE.Mesh(pineGeo2, branchMat); p2.position.y = 16;
                    const p3 = new THREE.Mesh(pineGeo3, branchMat); p3.position.y = 20;
                    treeGroup.add(p1, p2, p3);
                } else {
                    const mColors = [0xb22222, 0xd2691e, 0xcd853f, 0xff4500];
                    const foliageMat = new THREE.MeshStandardMaterial({ color: mColors[Math.floor(Math.random() * mColors.length)], roughness: 0.9 });
                    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5), foliageMat); f1.position.set(0, 14, 0);
                    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5), foliageMat); f2.position.set(1.5, 12.5, 1);
                    const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5), foliageMat); f3.position.set(-1.5, 12.5, -1);
                    treeGroup.add(f1, f2, f3);
                }
                chunk.add(treeGroup);
            }
        }

        const comb = combGroupGeo.clone();
        comb.position.set(-8 + Math.random() * 16, 5 + Math.random() * 10, -TILE_SIZE / 2);
        chunk.add(comb);

        const archsData = [];
        if (Math.random() > 0.6) {
            const arch = new THREE.Mesh(archGeo, honeyMat);
            const offsetZ = (Math.random() - 0.5) * (TILE_SIZE * 0.8);
            arch.position.set(0, 0, offsetZ);
            chunk.add(arch);
            archsData.push({ offsetZ: offsetZ });
        }

        const obstaclesData = [];
        const obsType = Math.floor(Math.random() * 6); 
        const obsGroup = new THREE.Group();
        let customLogic = null;

        if (obsType === 0) { 
            obsGroup.position.set(0, 32, -Math.random() * TILE_SIZE); 
            const pend = pendulumGroupGeo.clone();
            obsGroup.add(pend);
            const phase = Math.random() * Math.PI;
            const baseSpeedMult = 1.0 + Math.random() * 0.8;
            customLogic = (time, delta, playerPos, difficulty) => {
                const speedMult = baseSpeedMult * (1.0 + difficulty * 1.5);
                obsGroup.rotation.z = Math.sin(time * 2.0 * speedMult + phase) * 1.1;
                tempV1.set(0, -15, 0).applyMatrix4(pend.matrixWorld);
                return playerPos.distanceTo(tempV1) < 3.5;
            };
        } 
        else if (obsType === 1) { 
            obsGroup.position.set((Math.random() - 0.5)*20, 2 + Math.random()*12, -Math.random() * TILE_SIZE);
            const saw = new THREE.Mesh(sawGeo, metalMat);
            saw.castShadow = true;
            obsGroup.add(saw);
            const startX = obsGroup.position.x;
            const baseMoveSpeed = 0.5 + Math.random();
            customLogic = (time, delta, playerPos, difficulty) => {
                const moveSpeed = baseMoveSpeed * (1.0 + difficulty * 1.5);
                saw.rotation.z -= delta * 18.0; 
                obsGroup.position.x = startX + Math.sin(time * moveSpeed) * 12;
                tempV1.copy(obsGroup.position).add(chunk.position);
                return playerPos.distanceTo(tempV1) < 5.0;
            };
        }
        else if (obsType === 2) { 
            obsGroup.position.set((Math.random() - 0.5)*15, 0, -Math.random() * TILE_SIZE);
            const shaft = new THREE.Mesh(pistonShaftGeo, metalMat);
            shaft.position.y = 10;
            const head = new THREE.Mesh(pistonHeadGeo, metalMat);
            head.position.y = 20;
            head.castShadow = true;
            
            const furnace = new THREE.Mesh(furnaceBaseGeo, furnaceMat);
            furnace.position.y = 1.0;
            const pLight = new THREE.PointLight(0xff4400, 1.5, 20);
            pLight.position.y = 3.0;

            obsGroup.add(shaft, head, furnace, pLight);
            const phase = Math.random() * Math.PI;
            customLogic = (time, delta, playerPos, difficulty) => {
                const stompingSpeed = 2.5 * (1.0 + difficulty * 1.2);
                const p = (Math.sin(time * stompingSpeed + phase) + 1) / 2; 
                shaft.position.y = 10 - (Math.pow(p, 4)) * 18;
                head.position.y = 20 - (Math.pow(p, 4)) * 18; 
                tempV1.set(0, head.position.y, 0).applyMatrix4(obsGroup.matrixWorld);
                return playerPos.distanceTo(tempV1) < 4.0;
            };
        }
        else if (obsType === 3) { 
            obsGroup.position.set((Math.random() - 0.5)*20, 0, -Math.random() * TILE_SIZE);
            const base = new THREE.Mesh(ventBaseGeo, rustMat);
            base.position.y = 0.75;
            const steam = new THREE.Mesh(steamGeo, steamMat);
            obsGroup.add(base, steam);
            const phase = Math.random() * Math.PI * 2;
            customLogic = (time, delta, playerPos, difficulty) => {
                const activeSpeed = 3.0 * (1.0 + difficulty * 1.5);
                const isActive = Math.sin(time * activeSpeed + phase) > 0;
                if (steam) steam.visible = isActive;
                if (steam) {
                    const jitter = 1.0 + Math.sin(time * 50.0) * 0.1;
                    steam.scale.y = isActive ? jitter : 0.01;
                    steam.scale.x = steam.scale.z = isActive ? jitter : 0.01;
                }
                if (!isActive) return false;
                tempV1.set(0, 7.5, 0).applyMatrix4(obsGroup.matrixWorld); 
                return playerPos.distanceTo(tempV1) < 3.5; 
            };
        }
        else if (obsType === 4) { 
            const coilHeight = [10, 14, 18, 22][Math.floor(Math.random() * 4)];
            chunk.userData.teslaHeight = coilHeight;

            obsGroup.position.set(0, 0, -Math.random() * TILE_SIZE);
            obsGroup.add(buildPillar(-10, coilHeight), buildPillar(10, coilHeight));
            
            const arc = new THREE.Mesh(teslaArcGeo, arcMat);
            arc.position.set(0, coilHeight - 2.0, 0); 
            const pLight = new THREE.PointLight(0x00ffff, 2.0, 30);
            pLight.position.set(0, coilHeight - 2.0, 0);
            obsGroup.add(arc, pLight);

            const phase = Math.random() * 3.0;
            customLogic = (time, delta, playerPos, difficulty) => {
                const isActive = (time + phase) % 3.0 < (1.5 - difficulty * 0.5);
                if (arc) arc.visible = isActive;
                if (pLight) pLight.visible = isActive;
                if (!isActive) return false;
                tempV1.copy(obsGroup.position).add(chunk.position);
                if (Math.abs(playerPos.z - tempV1.z) < 1.5 && Math.abs(playerPos.y - (coilHeight - 2.0)) < 1.5 && Math.abs(playerPos.x) < 10) {
                    return true;
                }
                return false;
            };
        }
        else if (obsType === 5) { 
            obsGroup.position.set(0, 8, -Math.random() * TILE_SIZE);
            const cargo = new THREE.Mesh(cargoBoxGeo, rustMat);
            cargo.castShadow = true;
            obsGroup.add(cargo);
            const phase = Math.random() * Math.PI;
            customLogic = (time, delta, playerPos, difficulty) => {
                const slideSpeed = 1.5 * (1.0 + difficulty * 1.5);
                obsGroup.position.x = Math.sin(time * slideSpeed + phase) * 10;
                tempV1.copy(obsGroup.position).add(chunk.position); 
                if (Math.abs(playerPos.x - tempV1.x) < 4.5 &&
                    Math.abs(playerPos.y - tempV1.y) < 3.5 &&
                    Math.abs(playerPos.z - tempV1.z) < 4.5) {
                    return true;
                }
                return false;
            };
        }

        chunk.add(obsGroup);
        obstaclesData.push({ logic: customLogic });

        chunk.userData = { honeycomb: comb, obstacles: obstaclesData, archs: archsData };
        scene.add(chunk);
        levelTiles.push(chunk);
    }

    // ==========================================
    // DUST & FIRE PARTICLES
    // ==========================================
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 800;
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount*3; i++) { dustPos[i] = (Math.random() - 0.5) * 60; }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffd1a9, size: 0.1, transparent: true, opacity: 0.35 });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    const particleCount = 100;
    const particleGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 1.0 });
    const particlePool = [];

    for (let p = 0; p < particleCount; p++) {
        const pm = new THREE.Mesh(particleGeo, particleMat.clone());
        pm.visible = false;
        scene.add(pm);
        particlePool.push({ mesh: pm, velocity: new THREE.Vector3(), life: 0.0 });
    }

    function triggerSplinterBurst(position, colorHex) {
        particlePool.forEach(part => {
            if (part.life <= 0.0) {
                part.mesh.position.copy(position);
                part.mesh.material.color.setHex(colorHex);
                part.mesh.visible = true;
                part.life = 1.0;
                part.velocity.set((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25);
            }
        });
    }

    window.addEventListener('mousemove', (e) => {
        if (gameState !== 'PLAYING') return;
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('touchmove', (e) => {
        if (gameState !== 'PLAYING') return;
        const t = e.touches[0];
        pointerX = (t.clientX / window.innerWidth) * 2 - 1;
        pointerY = -(t.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

    // ==========================================
    // UPGRADE MENU LOGIC (Buy Multiple Items)
    // ==========================================
    let upgBtns = ['upg-repair', 'upg-speed', 'upg-dodge', 'upg-skip'];
    let selectedUpgIdx = 0;

    function updateUpgradeButtons() {
        const compCombs = document.getElementById('upgrade-combs');
        if (compCombs) compCombs.innerText = honeycombCount;
        
        const btnRepair = document.getElementById('upg-repair');
        const btnSpeed = document.getElementById('upg-speed');
        const btnDodge = document.getElementById('upg-dodge');

        if (btnRepair) btnRepair.disabled = (honeycombCount < 15 || lives >= 3);
        if (btnSpeed) btnSpeed.disabled = (honeycombCount < 25);
        if (btnDodge) btnDodge.disabled = (honeycombCount < 25);
        
        if(gameState === 'UPGRADE') {
            const btns = upgBtns.map(id => document.getElementById(id));
            btns.forEach((b, i) => {
                if (b) b.style.outline = (i === selectedUpgIdx) ? '3px solid #ffd700' : 'none';
            });
            if (btns[selectedUpgIdx]) btns[selectedUpgIdx].focus();
        }
    }

    function triggerUpgradeMenu() {
        gameState = 'UPGRADE';
        selectedUpgIdx = 3; 
        const hudCont = document.getElementById('hud-container');
        if (hudCont) hudCont.style.display = 'none';
        const ui = document.getElementById('ui-upgrade');
        if (ui) {
            ui.style.display = 'flex';
            setTimeout(() => ui.style.opacity = '1', 50);
        }
        updateUpgradeButtons();
        
        playerVelocity.set(0,0,0);
    }

    function closeUpgrade() {
        gameState = 'PLAYING';
        const ui = document.getElementById('ui-upgrade');
        if (ui) {
            ui.style.opacity = '0';
            setTimeout(() => ui.style.display = 'none', 500);
        }
        const hudCont = document.getElementById('hud-container');
        if (hudCont) hudCont.style.display = 'block';
    }

    document.getElementById('upg-repair').addEventListener('click', () => {
        if (honeycombCount >= 15 && lives < 3) { 
            honeycombCount -= 15; 
            lives++; 
            updateUpgradeButtons(); 
        }
    });
    document.getElementById('upg-speed').addEventListener('click', () => {
        if (honeycombCount >= 25) { 
            honeycombCount -= 25; 
            maxSpeedBonus += 0.08; 
            updateUpgradeButtons(); 
        }
    });
    document.getElementById('upg-dodge').addEventListener('click', () => {
        if (honeycombCount >= 25) { 
            honeycombCount -= 25; 
            boostCooldownModifier *= 0.85; 
            updateUpgradeButtons(); 
        }
    });
    document.getElementById('upg-skip').addEventListener('click', closeUpgrade);

    function checkMenuGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                const btnA = gp.buttons[0] && gp.buttons[0].pressed;
                
                if (gameState === 'UPGRADE') {
                    const axisY = gp.axes[1];
                    if (axisY < -0.5 && lastDPadY >= -0.5) { selectedUpgIdx = Math.max(0, selectedUpgIdx - 1); updateUpgradeButtons(); }
                    if (axisY > 0.5 && lastDPadY <= 0.5) { selectedUpgIdx = Math.min(3, selectedUpgIdx + 1); updateUpgradeButtons(); }
                    lastDPadY = axisY;
                }

                if (btnA && !lastButtonStateA) {
                    if (gameState === 'START') document.getElementById('start-btn').click();
                    else if (gameState === 'GAMEOVER') document.getElementById('restart-btn').click();
                    else if (gameState === 'UPGRADE') document.getElementById(upgBtns[selectedUpgIdx]).click();
                }
                lastButtonStateA = btnA;
            }
        }
    }

    // ==========================================
    // MAIN ANIMATION LOOP
    // ==========================================
    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1); 
        const time = clock.getElapsedTime();
        
        globalUniforms.uTime.value = time;

        if (gameState !== 'PLAYING') checkMenuGamepad();

        if (hudMesh) hudMesh.visible = (gameState === 'PLAYING'); 

        stars.position.z = camera.position.z;

        particlePool.forEach(part => {
            if (part.life > 0.0) {
                part.mesh.position.addScaledVector(part.velocity, delta);
                part.life -= delta * 1.8;
                part.mesh.scale.setScalar(part.life);
                if (part.life <= 0.0) part.mesh.visible = false;
            }
        });

        if (gameState === 'PLAYING') {
            if (audioCtx) {
                while (nextNoteTime < audioCtx.currentTime + 0.1) {
                    playSynthPluck(nextNoteTime, false);
                    nextNoteTime += 0.35 - (currentSpeed * 0.1); 
                }
            }

            const difficultyFactor = Math.min(1.0, Math.log10(1.0 + distanceTraveled / 1000.0) / Math.log10(11.0));

            if (distanceTraveled >= nextUpgradeDistance) {
                nextUpgradeDistance += 1000; 
                triggerUpgradeMenu();
                return; 
            }

            if (invulnerabilityTime > 0) {
                invulnerabilityTime -= delta;
                playerGroup.visible = Math.floor(time * 15) % 2 === 0;
                if (invulnerabilityTime <= 0) {
                    playerGroup.visible = true;
                    playerGroup.children.forEach(c => {
                        if(c.material && c.material.emissive && c.geometry !== eyeGeo) c.material.emissive.setHex(0x000000);
                    });
                }
            }

            dynamicMaxSafeY = MAX_SAFE_Y;
            levelTiles.forEach(tile => {
                if (tile.userData.teslaHeight && tile.userData.teslaHeight > dynamicMaxSafeY) {
                    dynamicMaxSafeY = tile.userData.teslaHeight;
                }
            });

            const altWarningUI = document.getElementById('altitude-warning');
            const vignetteUI = document.getElementById('vignette');
            
            if (playerGroup.position.y > dynamicMaxSafeY) {
                altitudeWarningTimer += delta;
                if (altitudeWarningTimer > 3.0) {
                    if (altWarningUI) altWarningUI.style.opacity = 1;
                    if (vignetteUI) vignetteUI.style.boxShadow = `inset 0 0 ${Math.min(150, (altitudeWarningTimer-3)*50)}px rgba(255,0,0,0.65)`;
                    scene.fog.color.lerpColors(new THREE.Color(0x18120c), new THREE.Color(0x4a0000), Math.min(1, (altitudeWarningTimer-3) / 2.0));
                    
                    if (altitudeWarningTimer < 6.0) {
                        let timeLeft = Math.ceil(6.0 - altitudeWarningTimer);
                        if (altWarningUI) altWarningUI.innerText = `WARNING: ALTITUDE LIMIT EXCEEDED\nDESCEND IN ${timeLeft}s`;
                    } else {
                        if (altWarningUI) altWarningUI.innerText = `ALTITUDE LIMIT EXCEEDED\nSTRUCTURAL INTEGRITY FAILING`;
                        if (time - lastAltitudeDamageTime > 1.0) {
                            takeDamage();
                            lastAltitudeDamageTime = time;
                        }
                    }
                }
            } else {
                altitudeWarningTimer = 0;
                if (altWarningUI) altWarningUI.style.opacity = 0;
                if (vignetteUI) vignetteUI.style.boxShadow = `inset 0 0 0px rgba(255,0,0,0)`;
                scene.fog.color.lerp(new THREE.Color(0x18120c), 0.1);
                lastAltitudeDamageTime = time;
            }

            currentSpeed += (targetSpeed - currentSpeed) * (delta * 2.0);
            playerGroup.position.z -= currentSpeed;
            distanceTraveled += currentSpeed * 0.15;

            handleInput(delta);

            renderDynamicHUD(); 

            if (vialInner) {
                const targetVialScale = Math.max(0.01, lives / 3.0);
                vialInner.scale.y += (targetVialScale - vialInner.scale.y) * 10.0 * delta;
                vialInner.position.y = 0.35 - (1.0 - vialInner.scale.y) * 0.36; 
            }

            const flapRate = 35 + (currentSpeed * 24);
            wingPivots.forEach((pivot, index) => {
                const phaseOffset = index < 2 ? 0.0 : Math.PI;
                pivot.rotation.z = Math.sin(time * flapRate + phaseOffset) * 0.52;
            });

            tailSegments.forEach((seg, index) => {
                seg.position.y = Math.sin(time * 8.0 - index) * 0.08;
                seg.position.x = Math.sin(time * 4.0 - index) * 0.08;
            });

            directLight.position.set(playerGroup.position.x + 20, playerGroup.position.y + 50, playerGroup.position.z + 10);
            lightTarget.position.copy(playerGroup.position);

            idealCamPos.copy(playerGroup.position);
            idealCamPos.z += 8.5;
            idealCamPos.y += 3.0;
            
            const targetFOV = isBoosting ? 85 : 65;
            camera.fov += (targetFOV - camera.fov) * 5.0 * delta;
            camera.updateProjectionMatrix();

            camera.position.lerp(idealCamPos, 8.5 * delta);

            targetLookAt.copy(playerGroup.position);
            targetLookAt.z -= 4.0; 
            targetLookAt.y -= 0.4; 
            camera.lookAt(targetLookAt);

            const shakeMagn = (currentSpeed * 0.012) + (isBoosting ? 0.22 : 0) + (altitudeWarningTimer > 3.0 ? 0.18 : 0);
            camera.position.x += (Math.random() - 0.5) * shakeMagn;
            camera.position.y += (Math.random() - 0.5) * shakeMagn;

            dustParticles.position.z = playerGroup.position.z;

            levelTiles.forEach((tile, index) => {
                if (tile.position.z - TILE_SIZE > camera.position.z + 15) {
                    tile.position.z -= TILE_SIZE * NUM_CHUNKS;
                    const comb = tile.userData.honeycomb;
                    if (comb) {
                        comb.position.set(-8 + Math.random() * 16, 5 + Math.random() * 10, -TILE_SIZE / 2);
                        comb.visible = (Math.random() > difficultyFactor * 0.5); 
                    }
                }

                if (tile.userData.obstacles) {
                    tile.userData.obstacles.forEach(obs => {
                        if (invulnerabilityTime <= 0) {
                            if (obs.logic(time, delta, playerGroup.position, difficultyFactor)) {
                                takeDamage();
                            }
                        }
                    });
                }

                if (tile.userData.archs && invulnerabilityTime <= 0) {
                    tile.userData.archs.forEach(arch => {
                        const archZ = tile.position.z + arch.offsetZ;
                        if (Math.abs(playerGroup.position.z - archZ) < 2.0) { 
                            const distFromCenter = Math.hypot(playerGroup.position.x, playerGroup.position.y);
                            if (Math.abs(distFromCenter - 12.0) < 1.8) {
                                takeDamage();
                            }
                        }
                    });
                }

                const comb = tile.userData.honeycomb;
                if (comb && comb.visible) {
                    comb.rotation.y += delta * 2.0;
                    comb.rotation.x += delta * 0.5;
                    tempV2.set(0, 0, 0).applyMatrix4(comb.matrixWorld);
                    if (playerGroup.position.distanceTo(tempV2) < 3.5) {
                        honeycombCount++;
                        comb.visible = false;
                        triggerSplinterBurst(tempV2, 0xffd700);
                        if (audioCtx) playSynthPluck(audioCtx.currentTime, true);
                    }
                }
            });

            if (playerGroup.position.y <= 1.2 && invulnerabilityTime <= 0) {
                takeDamage();
                playerGroup.position.y = 4.0; 
                playerVelocity.y = 8.0; 
                triggerSplinterBurst(playerGroup.position, 0x3d2212); 
            }
            
            const dDist = document.getElementById('hud-dist');
            const dCombs = document.getElementById('hud-combs');
            const dSpeed = document.getElementById('hud-speed');

            if (dDist) dDist.innerText = Math.floor(distanceTraveled).toString().padStart(5, '0');
            if (dCombs) dCombs.innerText = honeycombCount;
            if (dSpeed) dSpeed.innerText = (currentSpeed * 100).toFixed(0);

        } else if (gameState === 'START' || gameState === 'GAMEOVER') {
            playerGroup.position.y = 10.0 + Math.sin(time * 1.5) * 0.35;
            wingPivots.forEach((pivot, index) => {
                const phaseOffset = index < 2 ? 0.0 : Math.PI;
                pivot.rotation.z = Math.sin(time * 3.5 + phaseOffset) * 0.22;
            });

            camera.position.set(
                Math.sin(time * 0.15) * 12.0,
                12.0 + Math.sin(time * 0.5) * 2.0,
                Math.cos(time * 0.15) * 12.0
            );
            camera.lookAt(playerGroup.position);
        }

        renderer.render(scene, camera);
    }

    // ==========================================
    // UI HANDLERS
    // ==========================================
    function triggerGameOver(reasonText) {
        gameState = 'GAMEOVER';
        const goReason = document.getElementById('gameover-reason');
        const finalDist = document.getElementById('final-distance');
        const hudCont = document.getElementById('hud-container');
        const altWarn = document.getElementById('altitude-warning');
        const vignetteUI = document.getElementById('vignette');

        if (goReason) goReason.innerText = reasonText;
        if (finalDist) finalDist.innerText = Math.floor(distanceTraveled);
        if (hudCont) hudCont.style.display = 'none';
        if (altWarn) altWarn.style.opacity = '0';
        if (vignetteUI) vignetteUI.style.boxShadow = `inset 0 0 0px rgba(255,0,0,0)`;
        
        const goUi = document.getElementById('ui-gameover');
        if (goUi) {
            goUi.style.display = 'flex';
            setTimeout(() => goUi.style.opacity = '1', 50);
        }
    }

    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        gameState = 'PLAYING';
        const startUI = document.getElementById('ui-start');
        if (startUI) {
            startUI.style.opacity = '0';
            setTimeout(() => startUI.style.display = 'none', 500);
        }
        const hudCont = document.getElementById('hud-container');
        if (hudCont) hudCont.style.display = 'block';
        resetGame();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        gameState = 'PLAYING';
        const goUi = document.getElementById('ui-gameover');
        if (goUi) {
            goUi.style.opacity = '0';
            setTimeout(() => goUi.style.display = 'none', 500);
        }
        const hudCont = document.getElementById('hud-container');
        if (hudCont) hudCont.style.display = 'block';
        resetGame();
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    resetGame();
    animate();
});

})();