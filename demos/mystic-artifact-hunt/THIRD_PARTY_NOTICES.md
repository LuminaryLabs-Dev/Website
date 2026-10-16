# Third-party notices

- **AR.js 3.4.8** — MIT License. Copyright notices and license: `licenses/ARjs-MIT.txt`. Source: https://github.com/AR-js-org/AR.js
- **A-Frame 1.8.0** — MIT License. Copyright notices and license: `licenses/A-Frame-MIT.txt`. Source: https://github.com/aframevr/aframe
- **ARToolKit5 JavaScript runtime** — LGPL-3.0. License text: `licenses/ARToolKit-LGPL-3.0.txt`. Source: https://github.com/AR-js-org/ARToolKit5-js
- **4x4 BCH marker artwork** — MIT License. License text: `licenses/marker-gallery-MIT.txt`. Source: https://github.com/drcoccodrillus/artoolkit-barcode-markers-gallery/tree/master/4x4_BCH_13_5_5/Print-300dpi. The ten local PNG files in `public/markers/MAH-*.png` are numbered artwork from this gallery.
- **QRCode 1.5.4** — MIT License. License text: `licenses/qrcode-MIT.txt`. Source: https://github.com/soldair/node-qrcode. Used by the desktop gallery to render the phone launch QR code.

Dependency versions are pinned in `package.json` and `package-lock.json`. The current web-only development build loads local authored GLB models, embedded material images and local artwork. The legacy AR/marker dependencies listed above are retained historical dependencies, not part of the active web entry flow.

The local `public/vendor/camera_para.dat` camera calibration file is copied from the AR.js `3.4.8` release at `data/data/camera_para.dat`, alongside the AR.js runtime.

- **NexusEngine 0.0.4** — MIT License, Copyright (c) 2026 Luminary Labs. Pinned source commit `2b5e070fab8c73986174b842559b96a7fd2db662`; license: `licenses/NexusEngine-MIT.txt`. Source: https://github.com/LuminaryLabs-Dev/NexusEngine. This app uses the engine and DomainServiceKit exports, not the experimental ProtoKits adapter.
- **Chunk Five** — SIL Open Font License 1.1. Copyright (c) 2009 Meredith Mandel; Reserved Font Name: “Chunk”. Bundled as `public/fonts/ChunkFive-Regular.ttf`. Full SIL OFL 1.1 text: `public/fonts/LICENSE-ChunkFive.txt`. Source: https://github.com/theleagueof/chunk
- **Inconsolata** — SIL Open Font License 1.1. Copyright 2006 The Inconsolata Project Authors. Bundled as `public/fonts/Inconsolata-Regular.ttf` and `Inconsolata-Bold.ttf`. Full SIL OFL 1.1 text: `public/fonts/LICENSE-Inconsolata.txt`. Source: https://github.com/google/fonts/tree/main/ofl/inconsolata

The cinematic compass and watch packages were authored locally in Blender for this project; source, embedded material provenance and export counts are recorded in `docs/production/CINEMATIC-COMPASS-ASSETS.json` and `CINEMATIC-WATCH-ASSETS.json`. No existing Objaverse model was replaced or removed by these passes.
