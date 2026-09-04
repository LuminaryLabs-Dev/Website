import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@bc1207f5f0b8e48f48df36a569d6b9927e46806b/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/nexus-arcade/" });
