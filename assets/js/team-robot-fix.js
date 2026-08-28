(function () {
  if (!window.THREE) return;
  const OriginalShadowMaterial = THREE.ShadowMaterial;
  THREE.ShadowMaterial = function () {
    return new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  };
  THREE.ShadowMaterial.prototype = OriginalShadowMaterial.prototype;
  const OriginalCamera = THREE.PerspectiveCamera;
  THREE.PerspectiveCamera = function (...args) {
    const camera = new OriginalCamera(...args);
    const setPosition = camera.position.set.bind(camera.position);
    camera.position.set = (x, y, z) => setPosition(x, y, z + 2.2);
    return camera;
  };
  THREE.PerspectiveCamera.prototype = OriginalCamera.prototype;
})();
