import { cues } from './cues.js';
export class AudioManager {
  constructor(){ this.enabled = true; }
  toggle(){ this.enabled = !this.enabled; return this.enabled; }
  play(name){
    if (!this.enabled) return;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC || !cues[name]) return;
    try {
      const ctx = new AC(); const gain = ctx.createGain(); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      cues[name].forEach((freq, i) => { const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=freq; osc.connect(gain); osc.start(ctx.currentTime+i*0.06); osc.stop(ctx.currentTime+0.35+i*0.06); });
      setTimeout(()=>ctx.close().catch(()=>{}), 800);
    } catch {}
  }
}
