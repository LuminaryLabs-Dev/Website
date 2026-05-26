(() => {
'use strict';

const canvas = document.getElementById('game');
const splash = document.getElementById('splash');
const end = document.getElementById('end');
const scoreEl = document.getElementById('score-display');
const heightEl = document.getElementById('height');
const gemsEl = document.getElementById('gems');
const controlsPill = document.getElementById('controls-pill');
const hookUI = document.getElementById('grapple-indicator');

// --- GAME STATE ---
const state = {
  started: false, ended: false, endTime: 0, keys: {}, mousePressed: false,
  moveX: 0, moveY: 0, primary: false, primaryPressed: false, primaryReleased: false, secondary: false,
  score: 0, gems: 0, highestY: 0, killFloor: -150, currentGenY: -10,
  grappled: false, grapplePoint: new THREE.Vector3(), grappleLength: 0, targetAnchor: null,
  lastPrimary: false, swingTime: 0
};

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
let renderer, scene, camera, player, terrain, rope;
let skyMesh, skyGeom;
let velocity = new THREE.Vector3();
let spawn = new THREE.Vector3(8, 12, 0);

// Entity arrays for cleanup
let platforms = [], anchors = [], gems = [], bursts = [], stalkParts = [], clouds = [];

// --- PROCEDURAL GENERATION CONSTANTS ---
const CHUNK_HEIGHT = 20;
const VINE_COUNT = 3;
const VINE_FREQ = 0.08;

// --- CEL SHADING MATERIALS ---
let toonMatGreen, toonMatLeaf, outlineMat;
let leafGeometry;

function createCrispGradientTexture() {
  const colorsRGBA = new Uint8Array([
    100, 100, 100, 255,   // Shadow 
    180, 180, 180, 255,   // Base
    255, 255, 255, 255    // Highlight
  ]);
  const tex = new THREE.DataTexture(colorsRGBA, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function initMaterials() {
  const gradientMap = createCrispGradientTexture();
  outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  
  toonMatGreen = new THREE.MeshToonMaterial({ color: 0x34d399, gradientMap });
  toonMatLeaf = new THREE.MeshToonMaterial({ color: 0x10b981, gradientMap });
}

function addOutline(mesh, thickness = 0.15) {
  const outline = new THREE.Mesh(mesh.geometry.clone(), outlineMat);
  outline.geometry.computeVertexNormals(); 
  const pos = outline.geometry.attributes.position;
  const norm = outline.geometry.attributes.normal;
  if(pos && norm) {
    const newPos = new Float32Array(pos.count * 3);
    for(let i=0; i<pos.count; i++) {
      newPos[i*3] = pos.getX(i) + norm.getX(i) * thickness;
      newPos[i*3+1] = pos.getY(i) + norm.getY(i) * thickness;
      newPos[i*3+2] = pos.getZ(i) + norm.getZ(i) * thickness;
    }
    outline.geometry.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
  }
  mesh.add(outline);
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
}

function createScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x6eb8ff, 60, 400);
  
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(25, 20, 30);
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.5)); 
  
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  mainLight.position.set(100, 200, 50);
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x78e9ff, 0.6);
  rimLight.position.set(-100, 50, -100);
  scene.add(rimLight);
  
  skyGeom = new THREE.SphereGeometry(900, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  skyMesh = new THREE.Mesh(skyGeom, skyMat);
  scene.add(skyMesh);
  
  const starsGeo = new THREE.BufferGeometry();
  const starPos = [];
  for(let i=0; i<800; i++) {
    starPos.push((Math.random()-0.5)*1000, 800 + Math.random()*1500, (Math.random()-0.5)*1000);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xffffff, size: 2, sizeAttenuation: false}));
  scene.add(stars);
}

function updateSkyColors(topC, botC) {
  const pos = skyGeom.attributes.position;
  let colAttr = skyGeom.attributes.color;
  
  if(!colAttr) {
     skyGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
     colAttr = skyGeom.attributes.color;
  }
  
  const cArr = colAttr.array;
  for(let i=0; i<pos.count; i++) {
    const y = pos.getY(i);
    const normY = Math.max(0, Math.min(1, (y / 900) * 0.5 + 0.5));
    const t = normY * normY * (3 - 2 * normY); 
    cArr[i*3] = botC.r + (topC.r - botC.r) * t;
    cArr[i*3+1] = botC.g + (topC.g - botC.g) * t;
    cArr[i*3+2] = botC.b + (topC.b - botC.b) * t;
  }
  colAttr.needsUpdate = true;
}

function buildLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(3, 1, 8, 5, 10, 12);
  shape.bezierCurveTo(11, 18, 5, 24, 0, 30);
  shape.bezierCurveTo(-5, 24, -11, 18, -10, 12);
  shape.bezierCurveTo(-8, 5, -3, 1, 0, 0);
  
  const extrudeSettings = { depth: 1.0, bevelEnabled: false };
  leafGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  leafGeometry.rotateX(Math.PI / 2);
}

function spawnPlatform(x, y, z, rY, scale = 1) {
  const mesh = new THREE.Mesh(leafGeometry, toonMatLeaf);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rY;
  mesh.scale.setScalar(scale);
  addOutline(mesh, 0.1 / scale);
  scene.add(mesh);
  platforms.push(mesh);
  return mesh;
}

function spawnAnchor(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 8, 16), new THREE.MeshToonMaterial({color: 0xf5c84b, gradientMap: toonMatGreen.gradientMap}));
  ring.rotation.x = Math.PI/2;
  addOutline(ring, 0.1);
  
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({color: 0x78e9ff}));
  
  group.add(ring, core);
  group.userData = { ring, core };
  scene.add(group);
  anchors.push(group);
}

function spawnGemField(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  
  const gemGeo = new THREE.IcosahedronGeometry(1.2, 0);
  const gemMat = new THREE.MeshToonMaterial({color: 0xffd45a, gradientMap: toonMatGreen.gradientMap});
  const gem = new THREE.Mesh(gemGeo, gemMat);
  addOutline(gem, 0.15);
  
  const count = 40;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(count * 3);
  const baseData = [];
  for(let i=0; i<count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 1.5 + Math.random() * 3.5;
    const h = (Math.random() - 0.5) * 5;
    pPos[i*3] = Math.cos(ang)*rad; pPos[i*3+1] = h; pPos[i*3+2] = Math.sin(ang)*rad;
    baseData.push({ang, rad, h, spd: 0.5 + Math.random()});
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({color: 0xffd45a, size: 0.4}));
  
  group.add(gem, points);
  group.userData = { gem, points, baseData, collected: false };
  scene.add(group);
  gems.push(group);
}

function createBurst(pos, color) {
  const count = 60;
  const geo = new THREE.BufferGeometry();
  const pPos = new Float32Array(count * 3);
  const vels = [];
  for(let i=0; i<count; i++) {
    pPos[i*3] = pos.x; pPos[i*3+1] = pos.y; pPos[i*3+2] = pos.z;
    vels.push(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(15 + Math.random()*20));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({color, size: 0.5, transparent: true}));
  scene.add(pts);
  bursts.push({pts, vels, life: 1});
}

function generateChunk() {
  const startY = state.currentGenY;
  const endY = startY + CHUNK_HEIGHT;
  
  for (let v = 0; v < VINE_COUNT; v++) {
    const offset = (v / VINE_COUNT) * Math.PI * 2;
    const pts = [];
    for (let y = startY; y <= endY + 2; y += 4) {
      const radius = Math.max(1.5, 5 - y * 0.005);
      pts.push(new THREE.Vector3(
        Math.sin(y * VINE_FREQ + offset) * radius,
        y - startY, 
        Math.cos(y * VINE_FREQ + offset) * radius
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 8, 1.8, 8, false);
    const tube = new THREE.Mesh(tubeGeo, toonMatGreen);
    tube.position.y = startY; 
    addOutline(tube, 0.12);
    scene.add(tube);
    stalkParts.push(tube);
  }

  const leafY = startY + CHUNK_HEIGHT * 0.5;
  const chosenVine = Math.floor(Math.random() * VINE_COUNT);
  const leafOffset = (chosenVine / VINE_COUNT) * Math.PI * 2;
  const stemRadius = Math.max(1.5, 5 - leafY * 0.005);
  
  const stemX = Math.sin(leafY * VINE_FREQ + leafOffset) * stemRadius;
  const stemZ = Math.cos(leafY * VINE_FREQ + leafOffset) * stemRadius;
  
  const angleOut = Math.atan2(stemX, stemZ);
  const scale = 0.8 + Math.random() * 0.4;
  spawnPlatform(stemX, leafY, stemZ, angleOut, scale);
  
  const tipDist = 40 * scale; 
  const anchorX = stemX + Math.sin(angleOut) * tipDist;
  const anchorZ = stemZ + Math.cos(angleOut) * tipDist;
  spawnAnchor(anchorX, leafY + 16, anchorZ);
  
  if (Math.random() > 0.2) spawnGemField(anchorX, leafY + 24, anchorZ);
  
  if (Math.random() > 0.4) {
    const cx = (Math.random()-0.5) * 150;
    const cz = (Math.random()-0.5) * 150;
    const cloud = new THREE.Mesh(
      new THREE.IcosahedronGeometry(8 + Math.random()*10, 1),
      new THREE.MeshToonMaterial({color: 0xffffff, transparent: true, opacity: 0.8})
    );
    cloud.position.set(cx, leafY + Math.random()*10, cz);
    cloud.scale.set(1, 0.4, 1);
    scene.add(cloud);
    clouds.push(cloud);
  }

  state.currentGenY = endY;
}

function createPlayer() {
  player = new THREE.Group();
  player.position.copy(spawn);
  scene.add(player);
  
  const antColor = 0x1a0f0f;
  const antMat = new THREE.MeshToonMaterial({color: antColor, gradientMap: toonMatGreen.gradientMap});
  
  const abdomenGeo = new THREE.SphereGeometry(0.7, 16, 16);
  const abdomen = new THREE.Mesh(abdomenGeo, antMat);
  abdomen.scale.set(1, 1, 1.4);
  abdomen.position.set(0, 0.7, -0.8);
  addOutline(abdomen, 0.08);
  player.add(abdomen);
  
  const thoraxGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const thorax = new THREE.Mesh(thoraxGeo, antMat);
  thorax.scale.set(1, 1, 1.2);
  thorax.position.set(0, 0.9, 0.2); 
  addOutline(thorax, 0.08);
  player.add(thorax);
  
  const headGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const head = new THREE.Mesh(headGeo, antMat);
  head.position.set(0, 1.0, 0.9); 
  addOutline(head, 0.08);
  player.add(head);

  const antennaGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.5);
  antennaGeo.translate(0, 0.25, 0);
  const leftAntenna = new THREE.Mesh(antennaGeo, antMat);
  leftAntenna.position.set(0.2, 1.3, 1.1);
  leftAntenna.rotation.set(0.5, 0, -0.5);
  const rightAntenna = new THREE.Mesh(antennaGeo, antMat);
  rightAntenna.position.set(-0.2, 1.3, 1.1);
  rightAntenna.rotation.set(0.5, 0, 0.5);
  player.add(leftAntenna, rightAntenna);

  const legMat = new THREE.MeshBasicMaterial({color: 0x0a0a0a});
  for(let i=0; i<6; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.02, 1.2), legMat);
    const zOff = (i%3 - 1) * 0.4;
    const side = i > 2 ? 1 : -1;
    leg.position.set(side * 0.5, 0.4, 0.2 + zOff);
    leg.rotation.z = side * -Math.PI / 6;
    leg.rotation.x = zOff * 0.3;
    player.add(leg);
  }

  const ropeGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 6);
  ropeGeo.translate(0, 0.5, 0); 
  ropeGeo.rotateX(Math.PI/2);   
  ropeGeo.computeVertexNormals();
  rope = new THREE.Mesh(ropeGeo, new THREE.MeshBasicMaterial({color: 0xffffff}));
  rope.visible = false;
  scene.add(rope);
}

function setupInput() {
  window.addEventListener('keydown', e => { 
    state.keys[e.code] = true; 
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); 
  });
  window.addEventListener('keyup', e => { state.keys[e.code] = false; });
  window.addEventListener('mousedown', () => { state.mousePressed = true; });
  window.addEventListener('mouseup', () => { state.mousePressed = false; });
  
  document.getElementById('start').addEventListener('click', () => {
    state.started = true;
    splash.classList.add('hidden');
  });
}

function pollInput(time) {
  let pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for(let i=0; i<pads.length; i++) {
    if(pads[i] && pads[i].connected) { pad = pads[i]; break; }
  }
  
  let ax = 0, ay = 0, padPrimary = false, padSecondary = false;
  
  if (pad) {
    ax = Math.abs(pad.axes[0]) > 0.2 ? pad.axes[0] : 0;
    ay = Math.abs(pad.axes[1]) > 0.2 ? pad.axes[1] : 0;
    padPrimary = pad.buttons[0]?.pressed; 
    padSecondary = pad.buttons[2]?.pressed; 
    controlsPill.textContent = 'Arcade Controller Connected';
  } else {
    controlsPill.textContent = 'Controller: None';
  }
  
  state.moveX = ax || (state.keys.KeyD || state.keys.ArrowRight ? 1 : 0) - (state.keys.KeyA || state.keys.ArrowLeft ? 1 : 0);
  state.moveY = ay || (state.keys.KeyS || state.keys.ArrowDown ? 1 : 0) - (state.keys.KeyW || state.keys.ArrowUp ? 1 : 0);
  
  state.primary = padPrimary || state.keys.Space || state.mousePressed;
  state.secondary = padSecondary || state.keys.KeyE || state.keys.ShiftLeft || state.keys.ShiftRight;
  
  state.primaryPressed = state.primary && !state.lastPrimary;
  state.primaryReleased = !state.primary && state.lastPrimary;
  state.lastPrimary = state.primary;
  
  if (state.primaryPressed) {
    if (!state.started && document.getElementById('start')) {
      document.getElementById('start').click();
    } else if (state.ended && time > state.endTime + 0.5) { 
      location.reload();
    }
  }
}

function disposeEntity(obj) {
  if (!obj) return;
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
    else obj.material.dispose();
  }
  if (obj.children) obj.children.forEach(c => disposeEntity(c));
  scene.remove(obj);
}

function cleanupWorld() {
  const threshold = state.killFloor + 30; 
  const cleanArray = (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].position.y < threshold) {
        disposeEntity(arr[i]);
        arr.splice(i, 1);
      }
    }
  };
  cleanArray(platforms);
  cleanArray(anchors);
  cleanArray(gems);
  cleanArray(stalkParts);
  cleanArray(clouds);
}

function checkPlatforms(delta) {
  const feetNow = player.position.y;
  const feetNext = feetNow + velocity.y * delta; 
  
  for (const plat of platforms) {
    const platY = plat.position.y;
    
    if (feetNow >= platY - 0.2 && feetNext <= platY + 0.5) {
      const box = new THREE.Box3().setFromObject(plat);
      if (player.position.x > box.min.x && player.position.x < box.max.x &&
          player.position.z > box.min.z && player.position.z < box.max.z) {
        
        player.position.y = platY;
        velocity.y = 0;
        return true;
      }
    }
  }
  return false;
}

function updatePhysics(delta) {
  const yaw = camera.rotation.y;
  const fwd = tmp.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  const right = tmp2.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
  
  const ropeAttachPoint = player.position.clone().setY(player.position.y + 0.9);

  if (state.grappled) {
    const inputMag = Math.max(Math.abs(state.moveX), Math.abs(state.moveY));
    if (inputMag > 0.1) {
      state.swingTime += delta;
      
      const toAnchor = new THREE.Vector3().subVectors(state.grapplePoint, ropeAttachPoint).normalize();
      const inputDir = new THREE.Vector3()
        .addScaledVector(right, state.moveX)
        .addScaledVector(fwd, -state.moveY)
        .normalize();
        
      const dot = inputDir.dot(toAnchor);
      const tangent = inputDir.sub(toAnchor.multiplyScalar(dot)).normalize();
      
      const swingThrust = Math.min(90, 25 + Math.log(1 + state.swingTime * 5) * 65);
      velocity.addScaledVector(tangent, swingThrust * inputMag * delta);
    } else {
      state.swingTime = 0;
    }
  } else {
    state.swingTime = 0;
    const speed = 35;
    velocity.addScaledVector(right, state.moveX * speed * delta);
    velocity.addScaledVector(fwd, -state.moveY * speed * delta);
  }
  
  const grounded = checkPlatforms(delta) || (player.position.y <= 0 && state.currentGenY < 100);
  
  if (state.primaryPressed && grounded && !state.grappled) {
    velocity.y = 22;
  }
  
  if (state.secondary) {
    velocity.y += 25 * delta;
  }
  
  if (state.primaryPressed && state.targetAnchor && !state.grappled) {
    state.grappled = true;
    state.grapplePoint.copy(state.targetAnchor.position);
    state.grappleLength = ropeAttachPoint.distanceTo(state.grapplePoint);
    rope.visible = true;
  }
  
  if (state.primaryReleased && state.grappled) {
    state.grappled = false;
    rope.visible = false;
    
    velocity.y += 18; 
    const horizVel = new THREE.Vector3(velocity.x, 0, velocity.z);
    if (horizVel.lengthSq() > 1) {
      velocity.add(horizVel.normalize().multiplyScalar(15));
    } else {
      velocity.addScaledVector(fwd, 15);
    }
  }
  
  velocity.y -= 35 * delta; 
  if (velocity.y < -60) velocity.y = -60; 
  if (velocity.y > 35) velocity.y = 35; 
  
  velocity.x *= Math.pow(0.9, delta * 60);
  velocity.z *= Math.pow(0.9, delta * 60);
  
  if (state.grappled) {
    const toHook = new THREE.Vector3().subVectors(state.grapplePoint, ropeAttachPoint);
    const dist = toHook.length();
    
    if (dist > state.grappleLength) {
      const norm = toHook.normalize();
      
      const radialVel = velocity.dot(norm);
      if (radialVel < 0) {
        velocity.addScaledVector(norm, -radialVel);
        velocity.addScaledVector(norm, 5 * delta); 
      }
      
      const correction = dist - state.grappleLength;
      player.position.addScaledVector(norm, correction);
    }
  }
  
  player.position.addScaledVector(velocity, delta);
  
  if (player.position.y < 0 && state.highestY < 50) {
    player.position.y = 0;
    velocity.y = Math.max(0, velocity.y);
  }
  
  if (velocity.x !== 0 || velocity.z !== 0) {
    const targetAngle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = targetAngle; 
  }
}

function updateVisuals(time, delta) {
  state.targetAnchor = null;
  let bestDist = 45;
  let hookScreenPos = null;

  for (const anchor of anchors) {
    const dist = anchor.position.distanceTo(player.position);
    const hit = dist < bestDist && anchor.position.y > player.position.y;
    
    anchor.userData.ring.rotation.z += delta;
    
    if (hit) {
      bestDist = dist;
      state.targetAnchor = anchor;
      tmp.copy(anchor.position).project(camera);
      if(tmp.z < 1) { 
        hookScreenPos = {
          x: (tmp.x * .5 + .5) * window.innerWidth,
          y: (tmp.y * -.5 + .5) * window.innerHeight
        };
      }
    }
    
    const scale = hit ? 1.5 + Math.sin(time*10)*0.2 : 1;
    anchor.userData.ring.scale.lerp(tmp2.set(scale,scale,scale), 0.2);
    anchor.userData.core.scale.setScalar(hit ? 1.8 : 1);
  }

  if (hookScreenPos && !state.grappled) {
    hookUI.style.display = 'block';
    hookUI.style.left = hookScreenPos.x + 'px';
    hookUI.style.top = hookScreenPos.y + 'px';
    hookUI.classList.add('active-hook');
  } else {
    hookUI.style.display = 'none';
  }

  if (state.grappled) {
    const attachY = player.position.y + 0.9;
    rope.position.set(player.position.x, attachY, player.position.z);
    rope.lookAt(state.grapplePoint);
    const dist = rope.position.distanceTo(state.grapplePoint);
    rope.scale.set(1, 1, dist);
  }

  for (const g of gems) {
    if (g.userData.collected) continue;
    g.userData.gem.rotation.y += delta * 2;
    g.userData.gem.rotation.x += delta;
    
    const pts = g.userData.points.geometry.attributes.position.array;
    for(let i=0; i<g.userData.baseData.length; i++) {
      const b = g.userData.baseData[i];
      const a = b.ang + time * b.spd * 2;
      pts[i*3] = Math.cos(a)*b.rad;
      pts[i*3+1] = b.h + Math.sin(time*3+b.rad)*0.5;
      pts[i*3+2] = Math.sin(a)*b.rad;
    }
    g.userData.points.geometry.attributes.position.needsUpdate = true;
    
    if (g.position.distanceTo(player.position) < 6) {
      g.userData.collected = true;
      g.visible = false;
      state.gems++;
      gemsEl.textContent = state.gems;
      createBurst(g.position, 0xffd45a);
      if(!state.grappled && velocity.y < 15) velocity.y = 15;
    }
  }

  for(let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life -= delta * 1.5;
    if(b.life <= 0) {
      scene.remove(b.pts);
      b.pts.geometry.dispose();
      b.pts.material.dispose();
      bursts.splice(i, 1);
      continue;
    }
    b.pts.material.opacity = b.life;
    const arr = b.pts.geometry.attributes.position.array;
    for(let j=0; j<b.vels.length; j++) {
      arr[j*3] += b.vels[j].x * delta;
      arr[j*3+1] += b.vels[j].y * delta;
      arr[j*3+2] += b.vels[j].z * delta;
      b.vels[j].multiplyScalar(0.95);
    }
    b.pts.geometry.attributes.position.needsUpdate = true;
  }

  for (const c of clouds) {
    c.rotation.y += delta * 0.05;
    c.position.x += Math.sin(time * 0.2 + c.position.y) * delta * 2;
  }
}

function updateEnvironment(delta) {
  const targetCam = player.position.clone().add(new THREE.Vector3(30, 15, 35));
  targetCam.y = Math.max(targetCam.y, state.killFloor + 30);
  camera.position.lerp(targetCam, 1 - Math.pow(0.01, delta));
  camera.lookAt(player.position.x, player.position.y + 5, player.position.z);

  skyMesh.position.copy(camera.position);

  const h = Math.max(0, player.position.y);
  let topC = new THREE.Color(0x1e5799); 
  let botC = new THREE.Color(0x76b2fe); 
  let fogC = new THREE.Color(0x6eb8ff);
  
  if (h > 500 && h <= 1500) {
    const t = (h - 500) / 1000;
    topC.lerpColors(new THREE.Color(0x1e5799), new THREE.Color(0x0f1b29), t);
    botC.lerpColors(new THREE.Color(0x76b2fe), new THREE.Color(0xff6a00), t); 
    fogC.lerpColors(new THREE.Color(0x6eb8ff), new THREE.Color(0xff6a00), t);
  } else if (h > 1500) {
    topC.setHex(0x020204); 
    botC.setHex(0x110022); 
    fogC.setHex(0x110022);
  }
  
  updateSkyColors(topC, botC);
  scene.fog.color.lerp(fogC, 0.05);
}

function gameOver(time) {
  if (state.ended) return;
  state.ended = true;
  state.endTime = time;
  document.getElementById('final-score').textContent = state.score;
  end.classList.remove('hidden');
  hookUI.style.display = 'none';
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  pollInput(time);

  if (state.started && !state.ended) {
    updatePhysics(delta);
    
    if (player.position.y > state.highestY) {
      state.highestY = player.position.y;
      state.killFloor = Math.max(state.killFloor, state.highestY - 150);
    }
    
    state.score = Math.floor(state.highestY * 5) + (state.gems * 250);
    scoreEl.textContent = `Score: ${state.score}`;
    heightEl.textContent = Math.floor(state.highestY);
    
    if (state.highestY > state.currentGenY - 150) generateChunk();
    if (Math.random() < 0.05) cleanupWorld();
    
    updateVisuals(time, delta);
    updateEnvironment(delta);
    
    if (player.position.y < state.killFloor) gameOver(time);
  } else if (!state.started) {
    updateEnvironment(delta);
  }
  
  renderer.render(scene, camera);
}

function resize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
  createRenderer();
  createScene();
  initMaterials();
  buildLeafGeometry();
  createPlayer();
  
  for(let i=0; i<5; i++) generateChunk();
  
  setupInput();
  window.addEventListener('resize', resize);
  
  animate();
}

init();
})();