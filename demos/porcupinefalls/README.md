# Porcupine Falls AR

Standalone static demo following the website's `/demos/` layout. No build step.

- Experience: https://luminarylabs.dev/demos/porcupinefalls/
- Alias: https://luminarylabs.dev/demo/porcupinefalls/
- Printable recognition image and launch QR: https://luminarylabs.dev/demos/porcupinefalls/target.html

Open in Chrome, allow the camera, and scan the terrain image on another screen or printed page. Recognition runs once; terrain remains present until Close. Camera images stay on-device.

## Interaction

- Terrain follows the camera with damped translation and rotation at a fixed physical scale.
- After recognition, **Enter spatial AR** starts world tracking. **Pin here** or tapping terrain pins a floor-parallel map; walk around or closer to inspect. **Follow** releases it.
- Tap a trail to focus it by translation, illuminate it, animate 96 particles along it, and show approximate distance, start and endpoint. Selection pins the map. Focus height keeps the selected location in the phone viewport while preserving a flat map.
- Tap a landmark to show its name and description and pin the map. Names and details appear only upon selection. Dismissing details removes the highlight but preserves the map's pin.
- Looking at terrain for over five active seconds unlocks a title that fades and settles above the map, then remains for the experience.
- No size slider, bottom legend, diagnostic window, or pink reference cube. Old `?debug=1` links cannot restore those removed elements.

## Spatial rendering

`spatial-renderer.js` owns the native XRSession frame loop, explicit XRWebGLLayer framebuffer binding, transparent clear, and view/projection matrices. It uses WebGL 1 without antialiasing, based on [Google's WebXR guide](https://developers.google.com/ar/develop/webxr/hello-webxr). The user confirmed this graphics path displayed the terrain on their Moto G64 after the prior Three.js XR-manager path failed to present pixels.

One recognised terrain instance remains in the scene across XR entry and temporary tracking or optional-anchor interruptions. Missing poses pause transform updates at the last transform. Actual presentation during tracking loss remains controlled by the XR runtime. Reference-space resets explicitly release the old pin. Close releases camera/session resources.

`placement.mjs` owns follow/pin transforms and gaze timing; `features.js` owns picking, selection and particles; `experience.js` owns the experience lifetime and UI. Internal read-only counters remain available to browser QA through `inspectDiagnostics()`, with visible error reporting when needed. They create no scene objects or diagnostic interface and transmit no reports.

Runtime WebXR support is checked. Unsupported browsers retain camera-relative following and selection, with physical pinning explicitly unavailable. Camera-free preview supports orbiting and moving the camera closer with touch/scroll.

## Assets and sources

Terrain: 99,899 triangles; 106,180 total model triangles including trails/skirt. Two embedded 2048 textures; GLB 9,345,052 bytes. Existing model, QR target and compiled recognition image are unchanged. MindAR 1.2.5 and Three.js 0.152.2 are bundled locally with licenses in vendor/.

Data: [Trail Finder GPX](https://www.trailfinder.info/trails/trail/porcupine-falls-trail-at-calhoun-family-forest) and [USGS 3DEP](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer). Seven source segments and nine landmarks; newer orange/white routes are not included. Trail widths are enlarged for readability. `assets/features.json` contains mapped coordinates, approximate horizontal GPX distances and endpoint descriptions inferred from adjacent waypoints/network links. The source's unnamed cultural point is described without guessing a structure.

## Validation

`node --test demos/porcupinefalls/placement.test.mjs` checks fixed-size horizontal pinning, camera independence, frame-rate-independent damping, translation-only focus and persistent gaze timing.

Desktop Chrome uses a synthetic camera image with real image-feature recognition and simulated XR poses drawing into a separate real color/depth framebuffer. Checks cover visible terrain pixels/graphics error 0, tracking interruption and recovery, stable instance/pin, ignored non-XR callbacks, camera cleanup, seven trail/nine landmark targets, actual screen-tap selection, trail glow and animated particles, distance/start/end and destination details, flat fixed-scale selection pinning, persistent gaze title, and absence of debug/bottom controls. These automated interaction checks use simulated poses; the user's phone confirmation covers the working direct rendering path, not every interaction or frame-rate measurement.
