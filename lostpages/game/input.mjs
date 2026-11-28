// Device-independent input: short button taps survive the next fixed simulation tick.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=x=>Number.isFinite(x)?x:0;
export function createControls(){
 const keys=new Set(),buttons=new Map(),pulses=new Map(),keyPulses=new Set();let joy=null,drag=null,orbit=0;
 const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
 const actionKey={Space:'jump',KeyE:'act',Escape:'pause'};
 return {
  key(k,down){if(down){if(!keys.has(k)&&actionKey[k])keyPulses.add(actionKey[k]);keys.add(k)}else keys.delete(k)},
  button(id,name,down){if(down){if(buttons.has(id)||joy?.id===id||drag?.id===id)return false;buttons.set(id,name);pulses.set(id,name);return true}buttons.delete(id);return true},
  startStick(id,x,y){if(joy||buttons.has(id)||drag?.id===id)return false;joy={id,x:finite(x),y:finite(y),dx:0,dz:0};return true},
  moveStick(id,x,y){if(joy?.id!==id)return false;let a=(finite(x)-joy.x)/44,b=(joy.y-finite(y))/44,n=Math.max(1,Math.hypot(a,b));let m=Math.hypot(a/n,b/n);if(m<.10){joy.dx=joy.dz=0}else{let strength=(m-.1)/.9;joy.dx=a/n/m*strength;joy.dz=b/n/m*strength}return true},
  startDrag(id,x){if(drag||buttons.has(id)||joy?.id===id)return false;drag={id,x:finite(x)};return true},
  moveDrag(id,x){if(drag?.id!==id)return false;orbit=wrap(orbit+(drag.x-finite(x))*.006);drag.x=finite(x);return true},
  release(id,cancel=false){if(cancel)pulses.delete(id);if(joy?.id===id)joy=null;if(drag?.id===id)drag=null;buttons.delete(id)},
  clear(){keys.clear();buttons.clear();pulses.clear();keyPulses.clear();joy=null;drag=null},
  rotate(a){orbit=wrap(orbit+finite(a))},get orbit(){return orbit},get stick(){return [joy?.dx??0,-(joy?.dz??0)]},
  read(){const b=[...buttons.values(),...pulses.values(),...keyPulses];pulses.clear();keyPulses.clear();let x=(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(joy?.dx??0),z=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(joy?.dz??0);let n=Math.max(1,Math.hypot(x,z));x/=n;z/=n;return {x:clamp(Math.cos(orbit)*x+Math.sin(orbit)*z,-1,1),y:clamp(-Math.sin(orbit)*x+Math.cos(orbit)*z,-1,1),jump:keys.has('Space')||b.includes('jump'),act:keys.has('KeyE')||b.includes('act'),pause:keys.has('Escape')||b.includes('pause')}}
 };
}
