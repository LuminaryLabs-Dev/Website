import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@89c0b6d6c950212f352e613dab9045f4eb4ae1f5/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/nexus-arcade/" });
