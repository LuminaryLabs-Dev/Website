// Storage adapter for the existing NexusArcade BrowserInstaller. Each tab owns
// its namespace; installer verification still happens before write()/commit().
export const SESSION_CACHE_PREFIX='nexus-arcade-session-';
export const SESSION_PATTERN=/^[a-zA-Z0-9_-]{16,128}$/;
const GAME=/^NXA-\d{6}$/, VERSION=/^\d+\.\d+\.\d+$/;
export function checkedGame(m){if(!GAME.test(m?.id)||!VERSION.test(m?.version))throw new TypeError('Invalid game identity');return `${m.id}-${m.version}`;}
export function safePath(path){if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.includes('%')||path.split('/').some(p=>!p||p==='.'||p==='..')||/[?#\u0000-\u001f]/.test(path))throw new TypeError('Unsafe runtime path');return path;}
export function sessionCacheName(sessionId,m){if(!SESSION_PATTERN.test(sessionId))throw new TypeError('Invalid session');return `${SESSION_CACHE_PREFIX}${sessionId}--${checkedGame(m)}`;}
export function sessionScope(scopePath,sessionId){if(!SESSION_PATTERN.test(sessionId)||!['/arcade/','/nexus-arcade/'].includes(scopePath))throw new TypeError('Invalid runtime scope');return `${scopePath}sessions/${sessionId}/`;}
const mime=p=>({html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',wasm:'application/wasm',mp3:'audio/mpeg',wav:'audio/wav'})[p.split('.').pop()]||'application/octet-stream';
export class SessionStorageAdapter {
  constructor({sessionId,scopePath,cacheStorage=globalThis.caches,origin=globalThis.location?.origin,metadataStorage}){
    this.sessionId=sessionId;this.scopePath=sessionScope(scopePath,sessionId);this.caches=cacheStorage;this.origin=origin;this.metadataStorage=metadataStorage; if(metadataStorage===undefined){try{this.metadataStorage=globalThis.sessionStorage;}catch{this.metadataStorage=null;}}this.metadataKey=`nexus-arcade-installed:${scopePath}:${sessionId}`;this.transactions=new Map();this.memory={};
  }
  url(m,path=m.entry){return new URL(`${this.scopePath}runtime/${m.id}/${m.version}/${safePath(path)}`,this.origin).href;}
  listInstalled(){try{const x=JSON.parse(this.metadataStorage?.getItem(this.metadataKey)||'null');if(x&&typeof x==='object'&&!Array.isArray(x))this.memory=x;}catch{}return this.memory;}
  writeInstalled(x){this.memory=x;try{this.metadataStorage?.setItem(this.metadataKey,JSON.stringify(x));}catch{}}
  isInstalled(m){return this.listInstalled()[m.id]?.version===m.version;}
  async begin(m){const key=checkedGame(m);if(this.transactions.has(key))throw new Error('This game is already installing');const name=`${sessionCacheName(this.sessionId,m)}-staging-${crypto.randomUUID()}`;this.transactions.set(key,name);await this.caches.open(name);}
  async write(m,file,bytes){const name=this.transactions.get(checkedGame(m));if(!name)throw new Error('No installation transaction');const cache=await this.caches.open(name);await cache.put(this.url(m,file.path),new Response(bytes,{headers:{'Content-Type':mime(file.path),'X-Nexus-Arcade-Integrity':file.sha256,'Content-Length':String(bytes.byteLength)}}));}
  async commit(m){const key=checkedGame(m),name=this.transactions.get(key);if(!name)throw new Error('No installation transaction');const staged=await this.caches.open(name);for(const f of m.files){const r=await staged.match(this.url(m,f.path));if(!r||r.headers.get('X-Nexus-Arcade-Integrity')!==f.sha256)throw new Error(`Incomplete verified install: ${f.path}`);}
    const finalName=sessionCacheName(this.sessionId,m),final=await this.caches.open(finalName);
    for(const f of m.files)await final.put(this.url(m,f.path),await staged.match(this.url(m,f.path)));
    await this.caches.delete(name);this.transactions.delete(key);
    const installed={...this.listInstalled(),[m.id]:{version:m.version,entry:m.entry,files:m.files.map(f=>({path:f.path,sha256:f.sha256})),sessionId:this.sessionId,scopePath:this.scopePath}};this.writeInstalled(installed);return {cacheName:finalName,launchPath:new URL(this.url(m)).pathname};
  }
  // BrowserInstaller's core supplies no manifest to abort. Website serializes
  // install calls, so abort only touches this tab's one active transaction.
  async abort(){await Promise.all([...this.transactions.values()].map(n=>this.caches.delete(n)));this.transactions.clear();}
  async reconcile(){const kept={};for(const [id,r]of Object.entries(this.listInstalled())){try{const m={id,...r},name=sessionCacheName(this.sessionId,m);if(r.scopePath!==this.scopePath||!Array.isArray(r.files)||!r.files.length||!await this.caches.has(name))continue;const c=await this.caches.open(name);let valid=true;for(const f of r.files){const response=await c.match(this.url(m,f.path));if(!response||response.headers.get('X-Nexus-Arcade-Integrity')!==f.sha256){valid=false;break;}}if(valid)kept[id]=r;}catch{}}this.writeInstalled(kept);return kept;}
  releaseSessionMetadata(sessionId){if(sessionId!==this.sessionId)return [];const games=Object.entries(this.listInstalled()).map(([id,r])=>({id,version:r.version}));this.writeInstalled({});return games;}
}
