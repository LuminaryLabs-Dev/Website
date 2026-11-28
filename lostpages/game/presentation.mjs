// Camera and conservative visibility helpers; pure, shared with regression tests.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function cameraPose(p,orbit,aspect,objects){
 const forward=[Math.sin(orbit),0,Math.cos(orbit)];
 const target=[p.x+forward[0]*.25,p.y+.8,p.z+forward[2]*.25];
 const distance=aspect<1?4.8:4.25,desired=[p.x-forward[0]*distance,p.y+3.1,p.z-forward[2]*distance];
 let nearest=1;const delta=desired.map((n,i)=>n-target[i]);
 for(const box of objects){if(box.kind!=='wall')continue;const center=[box.x,box.y,box.z],half=[box.w/2+.11,box.h/2+.11,box.d/2+.11];let lo=0,hi=1;
  for(let i=0;i<3;i++){const min=center[i]-half[i],max=center[i]+half[i];if(Math.abs(delta[i])<1e-8){if(target[i]<min||target[i]>max){lo=2;break}}else{const a=(min-target[i])/delta[i],b=(max-target[i])/delta[i];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b))}}
  if(lo<=hi&&lo>.001)nearest=Math.min(nearest,Math.max(.10,lo-.04));
 }
 const eye=target.map((n,i)=>n+delta[i]*nearest);return {eye,target,distance:Math.hypot(...eye.map((n,i)=>n-target[i]))};
}
export function visibleBox(b,eye,maxDistance=40){if(b.kind==='asset')return true;const dx=Math.max(0,Math.abs(b.x-eye[0])-b.w/2),dy=Math.max(0,Math.abs(b.y-eye[1])-b.h/2),dz=Math.max(0,Math.abs(b.z-eye[2])-b.d/2);return dx*dx+dy*dy+dz*dz<=maxDistance*maxDistance;}
export function resolutionFor(dpr,cap,width,height){const ratio=clamp(Math.min(Number.isFinite(dpr)?dpr:1,cap,Math.sqrt(2100000/Math.max(1,width*height))),.5,1.5);return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio)),ratio};}
