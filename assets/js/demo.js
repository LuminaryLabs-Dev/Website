// Three.js starter: scene with plane and orbit camera
(function () {
  const canvas = document.getElementById("three-canvas");
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c16);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const setSize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 4);
  scene.add(dir);

  // Ground plane
  const planeGeo = new THREE.PlaneGeometry(20, 20, 10, 10);
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0x224466,
    wireframe: false,
    metalness: 0.1,
    roughness: 0.9,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  // Simple wobble to give life
  const start = performance.now();

  // Orbit controls (optional)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  const tick = () => {
    const t = (performance.now() - start) * 0.001;
    // animate plane verts softly
    const pos = plane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // original grid is on X,Z plane before rotation; apply subtle offset to Y
      pos.setZ(
        i,
        Math.sin((x + t) * 0.8) * Math.cos((y + t) * 0.6) * 0.1 + z * 0.0
      );
    }
    pos.needsUpdate = true;
    plane.geometry.computeVertexNormals();

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  window.addEventListener("resize", setSize);
  setSize();
  tick();
})();
