import {installSessionHandlers,sessionResponse} from '/nexus-arcade/session-service-worker.mjs';
import {createServiceWorkerHandler} from 'https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusArcade@c7d1ac67063c9950d59a09c51d1cb068c1028652/dist/browser/service-worker.mjs';
installSessionHandlers(self,{scopePath:'/nexus-arcade/'});
const legacy=createServiceWorkerHandler({scopePath:'/nexus-arcade/'});
self.addEventListener('fetch',event=>{if(event.request.method==='GET'&&new URL(event.request.url).pathname.startsWith('/nexus-arcade/runtime/'))event.respondWith(legacy(event.request));});
