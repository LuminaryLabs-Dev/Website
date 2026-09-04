import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@3f1bd792194bcfb0a01de747c1aa7b54969fd9c8/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/nexus-arcade/" });
