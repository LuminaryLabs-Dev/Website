import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@edaadf8165644e51cebb893de835200575b5087c/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/nexus-arcade/" });
