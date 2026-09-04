import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@3310f5d7c2a65d11e40a0bca3df07a4646e402a6/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/nexus-arcade/" });
