# Website Repo Memory

Luminary Labs public website is a static HTML/CSS/JS site deployed from `Website` with `CNAME` set to `luminarylabs.dev`. Keep the public site lightweight and additive: hidden/internal experiments should not be linked from the main nav unless explicitly requested.

Moonlit Labs is the private internal workspace brand. `Website` only hosts the public static gate, browser decrypt loader, and encrypted vault artifacts under `vault/`. The public loader decrypts `vault/moonlit-shell.enc` with the top password, then decrypts individual project pages from opaque `vault/projects/*.enc` paths with top password plus project password.

Prototype Moonlit passwords are intentionally insecure for now. Do not treat the static encrypted vault as a place for production secrets or API credentials.

Encrypted Moonlit project payload filenames in the public `Website/vault/projects/` folder should be opaque IDs, not project slugs or titles. Public code may expose the existence of a hidden encrypted workspace, but must not expose plaintext project titles, project content, project-specific passwords, or private source paths.

Private source builds should generate and validate a plaintext preview before encryption so internal pages can be visually checked before `Website/vault/*.enc` is republished.

The public site also has an additive `/ai/` knowledge-base surface for crawlable AI, automation, human-in-the-loop operations, and XR/WebXR content. Keep it public, machine-readable, and separate from the vault/hidden system. The allowed outside-the-section changes are footer links, `llms.txt`, and `sitemap.xml` references that expose the new public pages without moving or replacing existing content.

Public static apps can live under `/apps/` when they are generated outputs from source repos. `apps/lost-pages` is deployed from `MuseumMultiverse-TheLostPages` and should not be edited as the source of truth inside Website.
