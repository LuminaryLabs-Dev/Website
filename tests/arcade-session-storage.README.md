# Arcade session integration checks

Run `node --test tests/session-storage.test.mjs` from the Website root. Tests use CacheStorage/clients stand-ins and real Request/Response objects. They prove session isolation, path validation, committed payload lookup, malformed/missing-cache recovery and conservative cleanup. They do not exercise a browser service-worker lifecycle or rendering.

The website continues using the existing pinned NexusArcade ArcadeLibrary, BrowserInstaller (hash/size verification) and ArcadePlayer. Its storage adapter isolates game caches by tab and virtual paths by session. Installs are serialized within each page. Closing the player retains the verified package for that tab; leaving the page requests conservative cleanup. A live game opened in a new tab is retained. When another catalogue is open, cleanup defers rather than assuming it is abandoned. Crashed-session leftovers can persist until a later clean exit.
