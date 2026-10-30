# CAMEL Game Engine public module

Static, buildless app at /apps/CamelGameEngine/. Includes verified Cindercrypt and Skyfeather playable builds, a browser-local brief formatter, and an experimental native Unity project. No model API keys, server environment, private inference logs or backend are published.

Generation requires the existing local CAMEL/Nexus server. The brief handoff is a URL fragment and never automatically starts inference. The public page does not call localhost or ask for a key.

Serve the Website root with a static HTTP server. Verify desktop/mobile navigation, example brief formatting, both demos and disposal on close, clipboard/download, and the Unity ZIP. Demo files remain byte-identical to their sealed source artifacts. release.json records provenance and hashes. Public demo routes do not match the local /runs/ telemetry routes.
