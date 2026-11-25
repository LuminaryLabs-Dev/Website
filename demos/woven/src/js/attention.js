/* WOVEN V7 — lightweight, fully local glimmer/particle direction system.
   Does not drive gameplay state. Active targets are supplied by the loom controller.
   All cues have a reduced-motion fallback and remain behind clickable objects. */
(function(){
'use strict';
class Attention {
  constructor(canvas,renderer){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.renderer=renderer;
    this.focus=[];this.particles=[];this.trails=[];this.time=0;this.spawnClock=0;
    this.reduced=!!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.pixelRatio=1;this.width=0;this.height=0;this.lastFocus='';
    this.resize();
  }
  resize(){
    const d=Math.min(1.6,window.devicePixelRatio||1),w=Math.max(1,Math.round(this.canvas.clientWidth*d)),h=Math.max(1,Math.round(this.canvas.clientHeight*d));
    if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;}
    this.pixelRatio=d;this.width=this.canvas.clientWidth||innerWidth;this.height=this.canvas.clientHeight||innerHeight;
    this.ctx.setTransform(d,0,0,d,0,0);
  }
  suspend(){
    this.focus=[];this.particles.length=0;this.trails.length=0;this.spawnClock=0;
    this.ctx.clearRect(0,0,this.width,this.height);
  }
  setFocus(entries){
    this.focus=(entries||[]).filter(x=>x && x.name);
    this.lastFocus=this.focus.map(x=>x.name).join('|');
    this.spawnClock=.05;
  }
  point(name){
    const p=this.renderer.center(name),s=p && this.renderer.project(p);
    return s && Number.isFinite(s.x)&&Number.isFinite(s.y)&&s.z>-1 && s.z<1 ? s : null;
  }
  burst(name,count=20){
    const p=this.point(name);if(!p)return;
    const n=this.reduced?6:Math.min(42,count);
    for(let i=0;i<n;i++){
      const theta=(i/n)*Math.PI*2+Math.random()*.24, speed=22+Math.random()*85;
      this.particles.push({x:p.x,y:p.y,vx:Math.cos(theta)*speed,vy:Math.sin(theta)*speed-24,r:1+Math.random()*2.6,life:.38+Math.random()*.52,maxLife:1,color:i%5===0?'#bbdded':'#ffe5a4',kind:'burst'});
    }
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  spawnAround(p,color){
    const a=Math.random()*Math.PI*2,rad=12+Math.random()*24;
    this.particles.push({x:p.x+Math.cos(a)*rad,y:p.y+Math.sin(a)*rad,vx:(Math.random()-.5)*13,vy:-14-Math.random()*18,r:.8+Math.random()*1.9,life:.6+Math.random()*.55,maxLife:1.2,color:color||'#ffdea4',kind:'focus'});
    if(this.particles.length>130)this.particles.splice(0,this.particles.length-130);
  }
  update(dt){
    this.resize();const c=this.ctx,w=this.width,h=this.height;
    c.clearRect(0,0,w,h);this.time+=Math.min(dt,.08);
    const focusPts=[];
    for(const f of this.focus){const p=this.point(f.name);if(p){focusPts.push({...p,color:f.color||'#ffe3ac',radius:f.radius||25});}}
    if(!this.reduced && focusPts.length){
      this.spawnClock-=dt;
      if(this.spawnClock<=0){
        // Bound fill rate on older integrated GPUs, prioritize a single next action.
        const p=focusPts[Math.floor(Math.random()*focusPts.length)];
        this.spawnAround(p,p.color);this.spawnClock=.055+Math.random()*.095;
      }
    }
    // Soft localized glints: the full-screen canvas stays transparent away from active parts.
    c.save();c.globalCompositeOperation='lighter';
    focusPts.forEach((p,i)=>{
      const radius=p.radius*(1+.12*Math.sin(this.time*3+i));
      const g=c.createRadialGradient(p.x,p.y,3,p.x,p.y,radius*2.2);
      g.addColorStop(0,'rgba(255,235,190,.13)');g.addColorStop(.48,'rgba(255,218,149,.07)');g.addColorStop(1,'rgba(255,214,140,0)');
      c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,radius*2.2,0,Math.PI*2);c.fill();
      if(!this.reduced){
        const phase=this.time*2.6+i*1.8;
        const gx=p.x+Math.cos(phase)*radius*.8,gy=p.y+Math.sin(phase)*radius*.38;
        c.strokeStyle='rgba(255,232,169,.44)';c.lineWidth=1.1;
        c.beginPath();c.moveTo(gx-5,gy);c.lineTo(gx+5,gy);c.moveTo(gx,gy-5);c.lineTo(gx,gy+5);c.stroke();
      }
    });
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.91,dt*60);p.vy*=Math.pow(.98,dt*60);
      const alpha=Math.max(0,Math.min(1,p.life/(p.kind==='burst'?.85:1.2)));
      c.globalAlpha=Math.min(.92,alpha)*.78;
      c.fillStyle=p.color;c.shadowBlur=12;c.shadowColor=p.color;
      c.beginPath();c.arc(p.x,p.y,p.r*Math.min(1,alpha*1.5),0,Math.PI*2);c.fill();
    }
    c.restore();
  }
}
window.WovenAttention={Attention};
})();
