import * as T from './vendor/three.module.js';
export class Features{
 constructor(model,data){
  this.root=new T.Group();model.add(this.root);this.items=[];this.selected=null;this.particles=null;
  const terrain=model.getObjectByName('Terrain_100k');model.updateMatrixWorld(true);
  const cast=new T.Raycaster();const height=(x,z)=>{cast.set(new T.Vector3(x,1,z),new T.Vector3(0,-1,0));return cast.intersectObject(terrain)[0]?.point.y??0;};
  for(const row of data.trails){
   const mesh=model.children.find(o=>o.name.startsWith(row.meshPrefix));if(!mesh)throw Error('Missing trail '+row.id);
   mesh.material=mesh.material.clone();
   const points=row.coordinates.map(([x,z])=>new T.Vector3(x,height(x,z)+.001,z));
   const geometry=new T.BufferGeometry().setFromPoints(points),line=new T.Line(geometry,new T.LineBasicMaterial({transparent:true,opacity:0,depthWrite:false}));this.root.add(line);
   const center=new T.Box3().setFromPoints(points).getCenter(new T.Vector3());
   const item={...row,kind:'trail',mesh,line,points,center};line.userData.feature=item;this.items.push(item);
  }
  const pinGeo=new T.SphereGeometry(.003,10,6);
  for(const row of data.landmarks){
   const [x,z]=row.coordinates,center=new T.Vector3(x,height(x,z)+.006,z);
   const mesh=new T.Mesh(pinGeo,new T.MeshStandardMaterial({color:0xf3d795,emissive:0x574011,roughness:.5}));mesh.position.copy(center);this.root.add(mesh);
   const item={...row,kind:'landmark',mesh,center};mesh.userData.feature=item;const proxy=new T.Mesh(new T.SphereGeometry(.008,8,6),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));proxy.position.copy(center);proxy.userData.feature=item;this.root.add(proxy);item.proxy=proxy;this.items.push(item);
   const stem=new T.BufferGeometry().setFromPoints([new T.Vector3(x,center.y-.006,z),center]);this.root.add(new T.Line(stem,new T.LineBasicMaterial({color:0xd2ba83})));
  }
  this.pickables=this.items.map(i=>i.line??i.proxy??i.mesh);
 }
 pick(ray){ray.params.Line.threshold=.0045;const hits=ray.intersectObjects(this.pickables,false);if(!hits.length)return null;
  // Landmarks are tiny: prioritize actual sphere hits over nearby route tolerance.
  const landmarks=hits.filter(h=>h.object.userData.feature.kind==='landmark');
  landmarks.sort((a,b)=>ray.ray.distanceSqToPoint(a.object.getWorldPosition(new T.Vector3()))-ray.ray.distanceSqToPoint(b.object.getWorldPosition(new T.Vector3())));
  return (landmarks[0]??hits[0]).object.userData.feature;
 }
 select(item){
  if(this.selected===item)return false;
  if(this.selected){const m=this.selected.mesh.material;m.emissive?.setHex(this.selected.kind==='trail'?0:0x574011);}
  if(this.particles){this.root.remove(this.particles);this.particles.geometry.dispose();this.particles.material.dispose();this.particles=null;}
  this.selected=item;if(!item)return true;item.mesh.material.emissive.setHex(item.kind==='trail'?0x76aa28:0xc99028);item.mesh.material.emissiveIntensity=.8;
  if(item.kind==='trail'){
   const curve=new T.CurvePath();for(let i=1;i<item.points.length;i++)curve.add(new T.LineCurve3(item.points[i-1],item.points[i]));this.curve=curve;
   this.particles=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(96*3),3)),new T.PointsMaterial({color:0xe4ff9b,size:.003,transparent:true,opacity:.85,depthWrite:false,sizeAttenuation:true}));this.particles.frustumCulled=false;this.root.add(this.particles);
  }return true;
 }
 update(time){if(!this.particles)return;const p=this.particles.geometry.attributes.position;for(let i=0;i<96;i++){const t=(i/96+time*.035)%1,v=this.curve.getPoint(t);v.y+=.002+.005*((time*.3+i*.618)%1);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;}
}
export function titleSprite(){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d');c.font='500 68px Georgia';c.textAlign='center';c.textBaseline='middle';c.shadowColor='#10241d';c.shadowBlur=10;c.fillStyle='#f1f3df';c.fillText('Porcupine Falls',512,64);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,opacity:0,depthTest:false}));sprite.scale.set(.38,.0475,1);sprite.renderOrder=3;return sprite;}
