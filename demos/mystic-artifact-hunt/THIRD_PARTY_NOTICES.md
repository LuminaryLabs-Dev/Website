# Third-party notices

- **AR.js 3.4.8** — MIT License. Copyright notices and license: `licenses/ARjs-MIT.txt`. Source: https://github.com/AR-js-org/AR.js
- **A-Frame 1.8.0** — MIT License. Copyright notices and license: `licenses/A-Frame-MIT.txt`. Source: https://github.com/aframevr/aframe
- **ARToolKit5 JavaScript runtime** — LGPL-3.0. License text: `licenses/ARToolKit-LGPL-3.0.txt`. Source: https://github.com/AR-js-org/ARToolKit5-js
- **4x4 BCH marker artwork** — MIT License. License text: `licenses/marker-gallery-MIT.txt`. Source: https://github.com/drcoccodrillus/artoolkit-barcode-markers-gallery/tree/master/4x4_BCH_13_5_5/Print-300dpi. The ten local PNG files in `public/markers/MAH-*.png` are numbered artwork from this gallery.
- **QRCode 1.5.4** — MIT License. License text: `licenses/qrcode-MIT.txt`. Source: https://github.com/soldair/node-qrcode. Used by the desktop gallery to render the phone launch QR code.

Dependency versions are pinned in `package.json` and `package-lock.json`. This prototype uses local marker images and local SVG icons; it does not fetch 3D models or image assets at runtime.

The local `public/vendor/camera_para.dat` camera calibration file is copied from the AR.js `3.4.8` release at `data/data/camera_para.dat`, alongside the AR.js runtime.

- **NexusEngine 0.0.4** — MIT License, Copyright (c) 2026 Luminary Labs. Pinned source commit `2b5e070fab8c73986174b842559b96a7fd2db662`; license: `licenses/NexusEngine-MIT.txt`. Source: https://github.com/LuminaryLabs-Dev/NexusEngine. This app uses the engine and DomainServiceKit exports, not the experimental ProtoKits adapter.
