# Porcupine Falls AR

Standalone static demo, following the existing /demos/ layout.

- Experience: https://luminarylabs.dev/demos/porcupinefalls/
- Requested alias: https://luminarylabs.dev/demo/porcupinefalls/
- Image target: https://luminarylabs.dev/demos/porcupinefalls/target.html

Open the experience in Chrome on Moto G64, allow the camera, and scan the target displayed on a second screen or printed. The model follows the phone after recognition and stays visible until Close. Camera frames stay on-device.

Terrain: 99,899 triangles, 106,180 total including trails/skirt; two embedded 2048 textures; GLB 9,345,052 bytes. Image trigger: the existing terrain preview. Locally bundled MindAR 1.2.5 and Three.js 0.152.2, with licenses in vendor/. No build step.

Sources: [Trail Finder GPX](https://www.trailfinder.info/trails/trail/porcupine-falls-trail-at-calhoun-family-forest) and [USGS 3DEP](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer). Seven downloaded segments; newer orange/white routes are not included. Trail widths are enlarged for readability. The model is camera-relative, not anchored in the room.

Verified in desktop Chrome with a synthetic camera target; actual Moto G64 frame rate and outdoor recognition require device testing.
