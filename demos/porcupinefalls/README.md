# Porcupine Falls AR

Standalone static demo following the existing `/demos/` layout, with no build step.

- Experience: https://luminarylabs.dev/demos/porcupinefalls/
- Requested alias: https://luminarylabs.dev/demo/porcupinefalls/
- Printable image target and launch QR: https://luminarylabs.dev/demos/porcupinefalls/target.html

Open in Chrome, allow the camera, and scan the target on another screen or printed page. Recognition stops after acquisition; the terrain persists until Close. Camera frames stay on-device.

## Interaction

Terrain follows the camera with exponential position and rotation damping. Its model scale stays fixed. On phones supporting immersive WebXR AR, tap **Enter spatial AR** after recognition. Tap terrain or **Pin here** to settle it horizontally in local physical space, then move around or closer. **Follow** releases the pin. Optional WebXR anchors stabilize the pose; local reference-space pinning works without the anchors feature. Tracking loss hides the terrain until tracking recovers; reference-space resets release the old pin explicitly.

Tap a path to focus closer by translating the terrain, highlight it with 96 moving particles, and show approximate mapped length plus start/end descriptions. Tap a landmark for its name and description. Selection pins the terrain in spatial AR. There are no size sliders or bottom legends. Looking at terrain for over five active seconds unlocks the title, which fades and settles above it and stays unlocked until closing.

**Compatibility:** physical pinning requires immersive WebXR AR and device world tracking. Runtime support is checked, not inferred from a device-name list. The user reports that world tracking starts on their phone, with Pin here and Close visible; this supersedes the earlier compatibility concern. Unsupported browsers retain image recognition, orientation-driven damped following, fixed-scale feature focus, particles, and details; Pin explicitly reports unavailable. The corrected terrain rendering still needs confirmation on the user's physical phone.

Camera-free preview supports orbiting and moving the camera closer with touch/scroll. Preview pinning is a 3D scene demonstration, not proof of physical tracking.

## Data and implementation

Terrain: 99,899 triangles, 106,180 total including trails/skirt; two embedded 2048 textures; GLB 9,345,052 bytes. Existing model, QR, image target, and compiled target remain unchanged. Locally bundled MindAR 1.2.5 and Three.js 0.152.2, with licenses in vendor/.

Sources: [Trail Finder GPX](https://www.trailfinder.info/trails/trail/porcupine-falls-trail-at-calhoun-family-forest) and [USGS 3DEP](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer). Seven downloaded segments; newer orange/white routes are not included. Trail widths are enlarged for readability. `assets/features.json` contains source-derived local coordinates and nine landmarks. Lengths are approximate horizontal GPX distances; endpoint descriptions are inferred from nearby source waypoints and network connections. The source's unnamed cultural point is deliberately described without guessing a structure.

`placement.mjs` owns follow/pin pose and attention timing; `features.js` owns picking, highlight, and particles; `experience.js` owns the camera/XR lifetime and UI. Repeated selection is a no-op; stale async anchor requests are discarded after state changes.

## Validation

`node --test demos/porcupinefalls/placement.test.mjs`: four checks for fixed-size horizontal pinning, camera independence, damping across frame rates, and persistent five-second gaze reveal.

Desktop Chrome checks: real image-feature recognition using a synthetic webcam, persistence after target loss, orientation-driven lag, unsupported pin behavior, camera release, reopening/early close, trail and landmark selection, particles, unchanged scale, stable pinned preview during camera motion, title timing, and removal of bottom controls. Actual phone frame rate, physical anchoring, and outdoor recognition still need device testing.


### Immersive visibility regression

Immersive rendering uses `XRSession.visibilityState`, independently of the HTML document visibility. Entering XR hides the old camera-relative terrain until a valid tracked pose places it. A simulated XR session reproduced the prior failure with a hidden document and a translated/rotated viewer: zero terrain pixels and the model stranded outside the view. After the fix, the real Three.js XR pipeline renders terrain pixels; follow, pin, tracking loss/recovery, and session close pass. The test uses simulated poses and a desktop WebGL framebuffer, not physical AR hardware. Experience HTML and its entry module use a release query to bypass old cached versions.


### Phone diagnostic view

The user confirms the terrain renders before spatial AR and disappears on entry; the visibility fix did not resolve that physical-phone failure. Open the landing page with `?debug=1` to inspect the transition. The optional panel shows frame/pose counts, draw calls, graphics context/framebuffer state, and runtime/shader errors. Its pink cube uses a simple material and raw XR viewer pose independently of terrain placement. Recenter and Basic terrain help distinguish placement from model-material failures. Copy status copies text locally; no telemetry or camera images are transmitted. Diagnostics are absent from the normal interface. The exact phone cause still requires this runtime evidence.
