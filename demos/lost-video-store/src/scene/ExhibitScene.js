import { setFinaleLighting } from './Lighting.js';
import { activateArchiveDoor } from './Environment.js';
import { syncHotspots } from './Hotspots.js';
export function renderScene(scene, door, progression){ const unlocked = progression.isFinaleUnlocked(); syncHotspots(scene, progression); setFinaleLighting(scene, unlocked); if (unlocked) activateArchiveDoor(door); }
