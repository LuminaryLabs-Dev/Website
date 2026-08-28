# Website Repo Memory

## Current Run

- Intent: stop GLSL presentation text from visually bleeding outside its dark surfaces.
- Finding: text panels did not enforce explicit width and overflow boundaries at narrow widths or with long shader names.
- Change: constrained the top metadata and title surfaces, added overflow clipping and word wrapping, capped headings to panel width, and increased info-card opacity for reliable contrast.
- Validation: CSS patch applied locally; page assets remain served by the local static server.
- Result: GLSL copy stays contained inside its semi-opaque black surfaces across viewport sizes.
- Run time: 2026-08-28.

## Current Run

- Intent: add the supplied Symmetry GLSL study to the presentation.
- Finding: the user-provided shader is a single-pass, low-cost distance-field shader and fits the existing WebGL uniform wrapper.
- Change: added the normalized Symmetry source as a fifth local presentation entry and updated the initial counter from four to five.
- Validation: JavaScript syntax check and local page asset checks remain required after reload.
- Result: the GLSL Lab now presents the original four catalog shaders plus Symmetry.
- Run time: 2026-08-28.

## Current Run

- Intent: add dynamic wallpaper export while preserving the existing static PNG option.
- Finding: browser downloads cannot directly become Windows live wallpapers, but the animated canvas can be recorded into a compatible local video.
- Change: added a six-second `Download WebM` control with recording state, codec fallback across VP9/VP8/WebM, and a clear unsupported-browser fallback; retained `Download PNG`.
- Validation: JavaScript syntax passed after the export addition; local page assets continue serving through the static server.
- Result: users can import the downloaded WebM into Lively Wallpaper or Wallpaper Engine.
- Run time: 2026-08-28.

## Current Run

- Intent: refine GLSL Lab readability and navigation behavior while keeping the approved four-shader catalog.
- Finding: text panels needed content-fitting bounds, the info chip was an unnecessary extra affordance, and arrow visibility was coupled too broadly to page hover.
- Change: sized the title panel to its content, added consistent semi-opaque black text surfaces, replaced the INFO chip with the lower-left download button, removed the drag hint, and added left/right hover lanes that reveal only the matching arrow.
- Validation: JavaScript syntax passed; local page, CSS, JS, and shader JSON endpoints returned 200; all nine root HTML pages contain the GLSL Lab navbar entry.
- Result: the GLSL page now has clearer text contrast, cleaner lower-left controls, and directional arrow discovery on the side edges.
- Run time: 2026-08-28.

## Current Run

- Intent: retain the four approved shaders and improve text readability over the animated canvas.
- Finding: the shader page text needed a consistent dark surface for contrast against bright procedural motion.
- Change: added semi-opaque transparent black, blurred text panels behind the metadata, title, controls hint, and existing info card; kept the four-shader catalog unchanged.
- Validation: stylesheet patch applied locally; the four imported shader names remain unchanged.
- Result: GLSL presentation copy now stays readable without covering the shader canvas with an opaque block.
- Run time: 2026-08-28.

## Current Run

- Intent: add a complete GLSL presentation page with 20 dynamic shader slides, hover-only chrome, navigation, and Windows-background downloads.
- Finding: the static site had no shader-specific surface or shared navigation entry for a visual GLSL archive.
- Change: added `glsl.html`, `assets/css/glsl.css`, and `assets/js/glsl.js`; added `GLSL Lab` to all public page nav bars; implemented 20 local procedural shader studies, arrow/keyboard navigation, pointer disturbance, pause support, and PNG export.
- Refinement: anchored shader information to a lower-left `INFO` trigger and limited side arrows to the active info-card region.
- Validation: local HTTP checks returned 200 for the page, stylesheet, and script; JavaScript syntax check passed; shader manifest count confirmed 20; screenshot runner was unavailable because the machine `npx` launcher could not resolve its CLI.
- Result: the new page is locally runnable and self-contained; browser download creates a PNG suitable for Windows wallpaper selection.
- Run time: 2026-08-28.

Luminary Labs public website is a static HTML/CSS/JS site deployed from `Website` with `CNAME` set to `luminarylabs.dev`. Keep the public site lightweight and additive: hidden/internal experiments should not be linked from the main nav unless explicitly requested.

Moonlit Labs is the private internal workspace brand. `Website` only hosts the public static gate, browser decrypt loader, and encrypted vault artifacts under `vault/`. The public loader decrypts `vault/moonlit-shell.enc` with the top password, then decrypts individual project pages from opaque `vault/projects/*.enc` paths with top password plus project password.

Prototype Moonlit passwords are intentionally insecure for now. Do not treat the static encrypted vault as a place for production secrets or API credentials.

Encrypted Moonlit project payload filenames in the public `Website/vault/projects/` folder should be opaque IDs, not project slugs or titles. Public code may expose the existence of a hidden encrypted workspace, but must not expose plaintext project titles, project content, project-specific passwords, or private source paths.

Private source builds should generate and validate a plaintext preview before encryption so internal pages can be visually checked before `Website/vault/*.enc` is republished.

The public site also has an additive `/ai/` knowledge-base surface for crawlable AI, automation, human-in-the-loop operations, and XR/WebXR content. Keep it public, machine-readable, and separate from the vault/hidden system. The allowed outside-the-section changes are footer links, `llms.txt`, and `sitemap.xml` references that expose the new public pages without moving or replacing existing content.

Public static apps can live under `/apps/` when they are generated outputs from source repos. `apps/lost-pages` is deployed from `MuseumMultiverse-TheLostPages` and should not be edited as the source of truth inside Website.
