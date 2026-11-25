/* WOVEN V8: original locally synthesized foley only; no network or autoplay.
   Playback starts exclusively from actual visitor interactions.
   A mute toggle is available in the paper help panel and via M. */
(function(){
'use strict';
const FILES=Object.freeze({
 yarn:'yarn_rustle.wav', pattern:'pattern_sample.wav', treadle:'treadle_clunk.wav',
 shuttle:'shuttle_pass.wav', beater:'beater_thump.wav', inspect:'inspect_paper.wav',
 complete:'cloth_complete.wav'
});
const VOLUME=Object.freeze({yarn:.28,pattern:.21,treadle:.38,shuttle:.33,beater:.39,inspect:.14,complete:.28});
const STORAGE_KEY='woven-v8-muted';
class SoundBank{
 constructor(opts={}){
  this.makeAudio=opts.makeAudio || (src=>new Audio(src));
  this.storage=opts.storage === undefined ? (typeof localStorage!=='undefined'?localStorage:null) : opts.storage;
  this.muted=false;this.voices=new Map();this.base='assets/sfx/';
  try{this.muted=this.storage?.getItem(STORAGE_KEY)==='1';}catch(_){ /* file security restrictions */ }
 }
 setMuted(value){
  this.muted=!!value;
  try{this.storage?.setItem(STORAGE_KEY,this.muted?'1':'0');}catch(_){}
  if(this.muted){for(const voices of this.voices.values())for(const a of voices){try{a.pause?.();a.currentTime=0;}catch(_){}}}
  return this.muted;
 }
 toggleMuted(){return this.setMuted(!this.muted);}
 play(key){
  if(this.muted||!FILES[key])return false;
  let voices=this.voices.get(key);
  if(!voices){voices=[];this.voices.set(key,voices);}
  let voice=voices.find(v=>v.paused || v.ended);
  if(!voice){
   if(voices.length>=3)voice=voices[0];
   else{voice=this.makeAudio(this.base+FILES[key]);voice.preload='auto';voices.push(voice);}
  }
  try{
   voice.pause?.();voice.currentTime=0;voice.volume=VOLUME[key]??.3;
   const result=voice.play();if(result&&typeof result.catch==='function')result.catch(()=>{});
   return true;
  }catch(_){return false;}
 }
}
window.WovenSound={SoundBank,FILES,STORAGE_KEY};
})();
