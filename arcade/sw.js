import { installServiceWorkerHandlers } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@c7d1ac67063c9950d59a09c51d1cb068c1028652/dist/browser/service-worker.mjs";

installServiceWorkerHandlers(self, { scopePath: "/arcade/" });
