import * as T from './vendor/three.module.js';
const TRAIL_RADIUS=24,LANDMARK_RADIUS=28;
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?T.MathUtils.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
export class Features{
 constructor(model,data){
  this.root=new T.Group();model.add(this.root);this.items=[];this.selected=null;this.particles=null;this.visited=new Set();this.time=0;this.nearCheck=-1;this.localCamera=new T.Vector3();this.closest=new T.Vector3();
  const terrain=model.getObjectByName('Terrain_100k');model.updateMatrixWorld(true);
  const cast=new T.Raycaster(),height=(x,z)=>{cast.set(new T.Vector3(x,1,z),new T.Vector3(0,-1,0));return cast.intersectObject(terrain)[0]?.point.y??0;};
  for(const row of data.trails){
   const mesh=model.children.find(o=>o.name.startsWith(row.meshPrefix));if(!mesh)throw Error('Missing trail '+row.id);mesh.material=mesh.material.clone();
   const points=row.coordinates.map(([x,z])=>new T.Vector3(x,height(x,z)+.001,z)),bounds=new T.Box3().setFromPoints(points),segments=points.slice(1).map((v,i)=>new T.Line3(points[i],v));
   this.items.push({...row,kind:'trail',mesh,points,segments,center:bounds.getCenter(new T.Vector3()),extent:bounds.getSize(new T.Vector3()),near:0});
  }
  const pinGeo=new T.SphereGeometry(.0065,12,8);
  for(const row of data.landmarks){
   const [x,z]=row.coordinates,center=new T.Vector3(x,height(x,z)+.009,z),mesh=new T.Mesh(pinGeo,new T.MeshStandardMaterial({color:0xf3d795,emissive:0x574011,roughness:.5}));mesh.position.copy(center);this.root.add(mesh);
   const stem=new T.BufferGeometry().setFromPoints([new T.Vector3(x,center.y-.009,z),center]);this.root.add(new T.Line(stem,new T.LineBasicMaterial({color:0xd2ba83})));
   this.items.push({...row,kind:'landmark',mesh,center,near:0});
  }
  this.trailCount=data.trails.length;
 }
 // Finger tolerance is measured in CSS pixels, independent of phone resolution
 // and model distance. Every segment is selectable; trails have no pin objects.
 pickScreen(x,y,camera,width,height){
  const tap=new T.Vector2(x,y),project=p=>{const v=this.root.localToWorld(p.clone()).project(camera);return v.z>=-1&&v.z<=1?new T.Vector2((v.x+1)*width/2,(1-v.y)*height/2):null;};
  let best=null,score=Infinity,marker=null,markerDistance=14;this.tapAlternatives=[];
  for(const item of this.items){
   let distance=Infinity;
   if(item.kind==='landmark'){const p=project(item.center);if(p)distance=p.distanceTo(tap);if(distance<14)this.tapAlternatives.push({item,distance});if(distance<markerDistance){marker=item;markerDistance=distance;}}
   else{let a=project(item.points[0]);for(let i=1;i<item.points.length;i++){const b=project(item.points[i]);if(a&&b)distance=Math.min(distance,segmentDistance(tap,a,b));a=b;}}
   const normalized=distance/(item.kind==='trail'?TRAIL_RADIUS:LANDMARK_RADIUS);
   // An exact marker tap wins ties; broad hit areas don't steal exact route taps.
   if(normalized<=1&&(normalized<score-1e-5||(Math.abs(normalized-score)<1e-5&&item.kind==='landmark'))){best=item;score=normalized;}
  }this.tapAlternatives.sort((a,b)=>a.distance-b.distance);return marker??best;
 }
 pick(ray){
  const a=new T.Vector3(),b=new T.Vector3(),onRay=new T.Vector3(),onSegment=new T.Vector3();let best=null,score=Infinity;
  for(const item of this.items){
   let distance=Infinity,depth=1;
   if(item.kind==='landmark'){a.copy(item.center);this.root.localToWorld(a);distance=Math.sqrt(ray.ray.distanceSqToPoint(a));depth=a.distanceTo(ray.ray.origin);}
   else for(const segment of item.segments){a.copy(segment.start);b.copy(segment.end);this.root.localToWorld(a);this.root.localToWorld(b);const d=Math.sqrt(ray.ray.distanceSqToSegment(a,b,onRay,onSegment));if(d<distance){distance=d;depth=onRay.distanceTo(ray.ray.origin);}}
   const normalized=distance/Math.max(.008,depth*.025);if(normalized<=1&&normalized<score){best=item;score=normalized;}
  }return best;
 }
 clearParticles(){if(!this.particles)return;this.root.remove(this.particles);this.particles.geometry.dispose();this.particles.material.dispose();this.particles=null;}
 select(item){
  if(this.selected===item&&(!item||item.kind==='trail'))return false;
  this.clearParticles();this.selected=item;this.selectedAt=this.time;
  if(!item)return true;
  if(item.kind==='trail'){
   this.visited.add(item.id);this.curve=new T.CurvePath();for(const segment of item.segments)this.curve.add(new T.LineCurve3(segment.start,segment.end));
  }
  const count=item.kind==='trail'?96:32;
  this.particles=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3)),new T.PointsMaterial({color:0xe4ff9b,size:.0035,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true}));
  this.particles.frustumCulled=false;this.root.add(this.particles);return true;
 }
 update(time,cameraPosition){
  this.time=time;
  if(cameraPosition&&time-this.nearCheck>.1){
   this.nearCheck=time;this.localCamera.copy(cameraPosition);this.root.worldToLocal(this.localCamera);
   for(const item of this.items){
    let distance=item.kind==='landmark'?item.center.distanceTo(this.localCamera):Infinity;
    if(item.segments)for(const segment of item.segments){segment.closestPointToPoint(this.localCamera,true,this.closest);distance=Math.min(distance,this.closest.distanceTo(this.localCamera));}
    item.near=1-T.MathUtils.smoothstep(distance,.35,.75);
   }
  }
  for(const item of this.items){
   const selected=item===this.selected,pulse=.85+.15*Math.sin(time*4);
   item.mesh.material.emissive.setHex(selected?(item.kind==='trail'?0x76aa28:0xc99028):item.kind==='trail'?0xd2b65b:0x574011);
   item.mesh.material.emissiveIntensity=selected?1.2:item.near*.8*pulse;
   if(item.kind==='landmark')item.mesh.scale.setScalar(1+item.near*.22*pulse);
  }
  if(!this.particles)return;
  const age=Math.max(0,time-this.selectedAt),item=this.selected;
  if(item.kind==='landmark'&&age>1.6){this.clearParticles();return;}
  const p=this.particles.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   let v;
   if(item.kind==='trail'){v=this.curve.getPoint((i/p.count+time*.035)%1);v.y+=.002+.005*((time*.3+i*.618)%1);}
   else{const angle=i*2.39996,r=.006+age*.014;v=item.center.clone().add(new T.Vector3(Math.cos(angle)*r,age*.013*(.4+i/p.count),Math.sin(angle)*r));}
   p.setXYZ(i,v.x,v.y,v.z);
  }
  if(item.kind==='landmark')this.particles.material.opacity=.9*(1-age/1.6);
  p.needsUpdate=true;
 }
}
export function titleSprite(){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d');c.font='500 68px Georgia';c.textAlign='center';c.textBaseline='middle';c.shadowColor='#10241d';c.shadowBlur=10;c.fillStyle='#f1f3df';c.fillText('Porcupine Falls',512,64);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,opacity:0,depthTest:false}));sprite.scale.set(.38,.0475,1);sprite.renderOrder=3;return sprite;}
