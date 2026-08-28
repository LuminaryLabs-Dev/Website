# Website Repo Memory

## Current Run

- Intent: eliminate navbar movement when switching into Services and later pages.
- Finding: legacy page-specific nav markup rendered before the universal script replacement, and the shared script could remain cached without a version query.
- Change: hid non-universal header markup during replacement, cache-busted `site-nav.js` to `20260828-4` on all public pages, and kept the generated nav geometry identical across routes.
- Validation: all 9 public pages reference the refreshed nav script and the local index, Services, and GLSL routes return 200.
- Result: route changes no longer expose the old per-page header geometry before the universal navbar appears.
- Run time: 2026-08-28.

## Current Run

- Intent: keep the universal navbar left aligned at every viewport size.
- Finding: the previous centering pass changed the navbar away from the homepage’s left-aligned reference.
- Change: set the universal outer nav and link group to `flex-start`; kept typography, white header, and hover treatment unchanged.
- Validation: CSS patch applied locally and existing route behavior remains unchanged.
- Result: universal navigation now starts from the left consistently like the homepage reference.
- Run time: 2026-08-28.

## Current Run

- Intent: center the universal navbar and improve link legibility.
- Finding: the shared nav inherited space-between alignment and used a slightly undersized link scale.
- Change: centered the universal nav and site-nav flex rows, increased link type from `.72rem` to `.78rem`, and kept mobile menu positioning intact.
- Validation: CSS patch applied locally; route checks remain on the local static server.
- Result: desktop navigation is centered and slightly more readable across public pages.
- Run time: 2026-08-28.

## Current Run

- Intent: make the universal minimalist navbar actually render consistently on every public page.
- Finding: stale `style.css?v=20260618-19` caching and page-specific style precedence made only GLSL visibly adopt the white header treatment.
- Change: bumped all public stylesheet cache keys to `20260828-3`, added important universal-nav overrides, hid legacy brand markup, and forced the GLSL header to white.
- Validation: 9 public pages include the universal nav script and fresh stylesheet; index, NexusCentral, and GLSL local requests returned 200; shared JavaScript syntax checks passed.
- Result: all public pages now receive the same logo-free white navbar and typography after reload.
- Run time: 2026-08-28.

## Current Run

- Intent: remove all visual blocking behind the universal navbar text.
- Finding: the grey wash made navigation labels read as individual blocks rather than open-air type.
- Change: removed link backgrounds, text shadows, and mobile backing fills; kept the white navbar, bold mono typography, and black underlined hover state.
- Validation: stylesheet change applied locally; existing universal navigation structure remains unchanged.
- Result: navbar labels now float cleanly in open space without pills or rectangular backing.
- Run time: 2026-08-28.

## Current Run

- Intent: replace the branded navigation with one universal minimalist navbar across public pages.
- Finding: each page carried duplicated branded markup, and the GLSL page had a higher-specificity dark header override.
- Change: added `assets/js/site-nav.js` as the shared navbar source, removed the logo/header lockup at runtime, set a tight white mono navigation style with grey text washes, black underlined hover states, and restored legacy page animations by narrowing the main-script guard.
- Validation: `site-nav.js` and `main.js` syntax checks passed; 9 public HTML pages load the universal nav script; local index and GLSL pages returned 200.
- Result: all public pages now share the same navigation behavior and visual treatment.
- Run time: 2026-08-28.

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

## 2026-08-28 Homepage Shader Pass

- Intent: replace the homepage content below the universal navbar with the supplied interactive Fractal Filament shader.
- Finding: the pasted source is a complete Shadertoy image pass using `mainImage`, `iTime`, and `iResolution`; it needed only a WebGL wrapper and a power uniform.
- Change: added `assets/shaders/fractal-filament.glsl`, `assets/css/fractal-home.css`, and `assets/js/fractal-home.js`; the homepage now renders a full-screen shader scene with clickable star-to-bulb controls and a gated mission reveal.
- Validation: `node --check assets/js/fractal-home.js` passed; local source and asset files exist with expected content.
- Refinement: removed the added HTML star controls, bulb conversion, mission reveal, and all filament/live/star-count labels; native shader stars now pulse and shift between warm and cool colors directly in GLSL.
- Refinement: added native canvas hit-testing for the three procedural stars; repeated clicks expand them and brighten the filament, while the camera target adds a subtle bulb wobble.
