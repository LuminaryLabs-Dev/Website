# Porcupine Falls AR

Standalone static demo following the existing `/demos/` layout, with no build step.

- Experience: https://luminarylabs.dev/demos/porcupinefalls/
- Requested alias: https://luminarylabs.dev/demo/porcupinefalls/
- Printable image target and launch QR: https://luminarylabs.dev/demos/porcupinefalls/target.html

Open in Chrome, allow the camera, and scan the target on another screen or printed page. Recognition stops after acquisition; the terrain persists until Close. Camera frames stay on-device.

## Interaction

Terrain follows the camera with exponential position and rotation damping. Its model scale stays fixed. On phones supporting immersive WebXR AR, tap **Enter spatial AR** after recognition. Tap terrain or **Pin here** to settle it horizontally in local physical space, then move around or closer. **Follow** releases the pin. Optional WebXR anchors stabilize the pose; local reference-space pinning works without the anchors feature. Tracking loss hides the terrain until tracking recovers; reference-space resets release the old pin explicitly.

Tap a path to focus closer by translating the terrain, highlight it with 96 moving particles, and show approximate mapped length plus start/end descriptions. Tap a landmark for its name and description. Selection pins the terrain in spatial AR. There are no size sliders or bottom legends. Looking at terrain for over five active seconds unlocks the title, which fades and settles above it and stays unlocked until closing.

**Compatibility:** physical pinning requires immersive WebXR AR and device world tracking. The Moto G64 is absent from [Google's supported-device list](https://developers.google.com/ar/devices) at implementation time. Runtime support is checked, not assumed. Unsupported phones retain image recognition, orientation-driven damped following, fixed-scale feature focus, particles, and details; Pin explicitly reports unavailable. They cannot support walking around a physically anchored mesh through this browser fallback. No physical Moto G64 or supported WebXR handset has been tested.

Camera-free preview supports orbiting and moving the camera closer with touch/scroll. Preview pinning is a 3D scene demonstration, not proof of physical tracking.

## Data and implementation

Terrain: 99,899 triangles, 106,180 total including trails/skirt; two embedded 2048 textures; GLB 9,345,052 bytes. Existing model, QR, image target, and compiled target remain unchanged. Locally bundled MindAR 1.2.5 and Three.js 0.152.2, with licenses in vendor/.

Sources: [Trail Finder GPX](https://www.trailfinder.info/trails/trail/porcupine-falls-trail-at-calhoun-family-forest) and [USGS 3DEP](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer). Seven downloaded segments; newer orange/white routes are not included. Trail widths are enlarged for readability. `assets/features.json` contains source-derived local coordinates and nine landmarks. Lengths are approximate horizontal GPX distances; endpoint descriptions are inferred from nearby source waypoints and network connections. The source's unnamed cultural point is deliberately described without guessing a structure.

`placement.mjs` owns follow/pin pose and attention timing; `features.js` owns picking, highlight, and particles; `experience.js` owns the camera/XR lifetime and UI. Repeated selection is a no-op; stale async anchor requests are discarded after state changes.

## Validation

`node --test demos/porcupinefalls/placement.test.mjs`: four checks for fixed-size horizontal pinning, camera independence, damping across frame rates, and persistent five-second gaze reveal.

Desktop Chrome checks: real image-feature recognition using a synthetic webcam, persistence after target loss, orientation-driven lag, unsupported pin behavior, camera release, reopening/early close, trail and landmark selection, particles, unchanged scale, stable pinned preview during camera motion, title timing, and removal of bottom controls. Actual phone frame rate, physical anchoring, and outdoor recognition still need device testing.
