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

## 2026-08-28 Nexus Arcade Layout Direction

- Intent: define a minimal monotonic layout direction for Nexus Arcade using the current page and connected Drive references.
- Finding: the current page is a long neon marketing scroll, while Drive references emphasize a compact upright, original rotating game library, operator platform, and first launch-partner pilot.
- Direction: reduce the page to one product claim, one cabinet visual, one playable game index, one operator value section, and one pilot CTA with a consistent left rail and restrained monochrome hierarchy.
- Change: linked the primary arcade CTA to the hosted NexusArcade prototypes and added a monotonic visual treatment with cabinet-led presentation and distinct CSS cover panels for the five local game entries.
- Refinement: removed the hero background image and preorder action; the hero is now left-aligned with an `INSERT COIN` link and the existing technical cabinet sheet displayed beside the copy.
- Refinement: replaced the generic technical sheet in the hero with the user-provided FreeCAD perspective and front-elevation drawings as a paired cabinet header visual.
- Refinement: added technical dimension annotations to the CAD header: 68 cm width, 76 cm depth, and 175 cm total height.
- Refinement: converted dimensions to feet/inches and repositioned the callouts around the small front-view drawing with a full-height line and lower-right depth line.
- Refinement: corrected the callout anchors so width, height, and depth markings align with the smaller front-view image instead of the full CAD image group.
- Refinement: removed measurement lines in favor of a compact W/H/D label, replaced the Arcade Revival section with side-view CAD images 3 and 4 plus the three requested middle cards, and hid the system library and later sections pending the schematic.
- Refinement: rewrote the three Arcade Revival cards as The Collection, The AI Driven Heart, and Evolution of Gaming using the supplied product narrative and supporting detail.
- Refinement: set “Built for fun. Built to thrive.” as the Arcade Revival subheading.
- Change: removed NexusCentral from the universal navigation and homepage promotion, and deleted the standalone NexusCentral page to eliminate its primary public route.
- Change: replaced the Open Source page runtime body with a white-and-green structural skeleton: hero, interwoven systems list, shader placeholder, and contribution links; no shaders or chips added.
- Refinement: added Bop-It Skills as a first-class ecosystem row, explicitly connecting skill orchestration to Game Kit and repeatable Nexus Engine implementation.
- Change: replaced the Services page runtime body with a minimalist outcome-and-capability structure covering XR, web, AI, and GTM services, transparent rates, outputs, engagement models, and process steps.
- Change: replaced the Portfolio page runtime body with an alternating minimalist case-study sequence covering all four featured projects, retaining existing imagery and descriptions without cards or badges.
- Refinement: removed the “Active engagement” label, increased image dominance, and added restrained offset frames and shadows for more depth.
- Refinement: removed the offset image frames that created the misshapen window effect; retained larger images and natural shadow depth.
- Refinement: added generous vertical spacing and divider rules between portfolio case-study text sections for clearer separation.
- Refinement: added deliberate spacing and a narrower measure between the final portfolio CTA heading and supporting paragraph.
- Refinement: changed the Services footer descriptor to “AI Consultants and Software Developers.”
- Change: added five standalone Shadertoy-compatible studies for Engine sequencing, Runtime execution, Interfaces, AR spatial input, and Bop-It Skills; each uses restrained white/green rendering and a distinct `iMouse` interaction hook.
- Refinement: removed the green mini kicker headings from the Open Source skeleton, leaving the primary headings and restrained green accents.
- Refinement: added final robot presentation polish with identity-specific rim shadows, soft studio backdrop, and stronger grounded shadow treatment.
- Change: replaced Contact page body with a minimal full-screen Cluster Bots shader scene, storing the supplied pass locally and compiling a capped-performance variant with reduced raymarch and cell-neighbor work.
- Correction: restored the contact shader controller with WebGL-compatible cell indexing and added a sharp-corner semi-opaque gray panel near the top for contact copy readability.
- Correction: locked the Contact shader camera, moved it backward, restored the full eight-cell neighborhood and 55 march steps to remove artifacts, and lowered the copy panel below the navbar-safe area.
- Performance pass: reduced the Contact shader to 34 march steps, rendered at 58% resolution, and capped animation to 30 FPS while retaining all eight neighboring cells for structure.
- Quality adjustment: raised internal Contact canvas resolution from 58% to 78% while retaining the 34-step raymarch and 30 FPS cap.
- Refinement: removed all visible robot and presentation shadows and shifted the canvas framing upward to keep animated feet inside the portrait frame.
- Correction: disabled the internal Three.js floor shadow material, restored the studio background, removed container cropping, and added safety framing around the animated robot canvas.
- Correction: changed the robot studio background to an elliptical vignette and reduced/lifted the canvas render scale to prevent feet from clipping.
- Correction: moved the Three.js portrait cameras farther back at construction time, restoring a larger visible robot while providing render-space clearance below the feet.
- Refinement: removed the closing “Build something meaningful” CTA so the Team page ends after the three concise profiles.
- Refinement: rebuilt Team robot portraits with rounded shells, visor faces, emissive eyes, chest panels, articulated limbs, antennae, stronger materials, and larger soft shadows.
- Change: replaced the Team page runtime body with a minimalist three-profile layout using animated Three.js robot portraits, identity colors, lighting, and shadow maps; existing bios are preserved and photos removed.
- Refinement: mounted the five ecosystem GLSL studies as interactive white-and-green canvases in the Open Source architecture section, replacing the placeholder.
- Refinement: added the supplied Obsidian Descent concept as a full-screen semi-transparent hero background behind the Open Source header text; local shader and page checks return `200`.
- Refinement: expanded the shader studies into a two-column systems explorer with larger canvases and concept-specific explanatory captions so the visuals communicate architecture rather than act as decorative thumbnails.
- Removal: deleted the standalone GLSL Lab page and its page-specific CSS/JS, removed the GLSL Lab entry from the universal navbar and fallback page links, and preserved shared shader assets used by Open Source and Contact.
- Refinement: added a top-centered pulsing "Click the diamond stars" cue to the homepage shader so the existing interactive stars are discoverable without adding new shader objects.
- Refinement: added a persistent right-aligned `LL` signature with a lightweight CSS glowing bulb in the shared navbar, linking the mark home without introducing a raster asset.
