import {Vector3,Quaternion,Euler} from './vendor/three.module.js';
export const damping=(dt,tau=.28)=>1-Math.exp(-Math.max(0,dt)/tau);
const UP=new Vector3(0,1,0),FORWARD=new Vector3(0,0,-1);
/** Owns the map pose: horizontal manual pins and vertical trail inspection. Never writes camera or scale. */
export class Placement {
 constructor(){this.position=new Vector3();this.rotation=new Quaternion();this.target=new Vector3();this.targetRotation=new Quaternion();this.mode='following';this.initialized=false;this.revision=0;this.focus=new Vector3();this.distance=1.05;this.inspectFollowing=false;}
 heading(q){const f=FORWARD.clone().applyQuaternion(q);f.y=0;if(f.lengthSq()<.001)f.set(0,0,-1);return f.normalize();}
 follow(focus=null,inspectFollowing=false,distance=null){this.mode='following';this.revision++;this.focus.copy(focus??new Vector3());this.distance=distance??(focus?.55:1.05);this.inspectFollowing=inspectFollowing;}
 pin(cameraPosition,cameraRotation,focus=new Vector3(),distance=.8){
  this.mode='placing';this.revision++;this.focus.copy(focus);
  const heading=this.heading(cameraRotation),yaw=Math.atan2(-heading.x,-heading.z);
  this.targetRotation.setFromAxisAngle(UP,yaw);
  this.target.copy(cameraPosition).addScaledVector(heading,distance);this.target.y-=Math.min(.28,distance*.22);
  this.target.sub(focus.clone().applyQuaternion(this.targetRotation));
 }
 inspect(cameraPosition,cameraRotation,focus,distance=.5){
  this.mode='placing';this.revision++;this.focus.copy(focus);
  const heading=this.heading(cameraRotation),yaw=Math.atan2(-heading.x,-heading.z);
  this.targetRotation.setFromEuler(new Euler(Math.PI/2,yaw,0,'YXZ'));
  this.target.copy(cameraPosition).add(new Vector3(0,0,-distance).applyQuaternion(cameraRotation));
  this.target.sub(focus.clone().applyQuaternion(this.targetRotation));
 }
 update(dt,cameraPosition,cameraRotation){
  if(this.mode==='following'){
   const offset=new Vector3(0,-.045,-this.distance).applyQuaternion(cameraRotation);
   this.target.copy(cameraPosition).add(offset);
   const f=this.heading(cameraRotation);this.targetRotation.setFromEuler(new Euler(this.inspectFollowing?Math.PI/2:.6,Math.atan2(-f.x,-f.z),0,'YXZ'));this.target.sub(this.focus.clone().applyQuaternion(this.targetRotation));
  }
  if(!this.initialized){this.position.copy(this.target);this.rotation.copy(this.targetRotation);this.initialized=true;}
  if(this.mode==='pinned')return;
  const a=damping(Math.min(dt,.1));this.position.lerp(this.target,a);this.rotation.slerp(this.targetRotation,a);
  if(this.mode==='placing'&&this.position.distanceTo(this.target)<.0003&&this.rotation.angleTo(this.targetRotation)<.001){this.position.copy(this.target);this.rotation.copy(this.targetRotation);this.mode='pinned';}
 }
}
/** Consecutive attention unlocks once; tracking loss/background time never counts. */
export class GazeReveal{
 constructor(){this.seconds=0;this.revealed=false;this.fade=0;}
 update(dt,looking,active=true){if(!active)return;dt=Math.min(dt,.1);if(!this.revealed){this.seconds=looking?this.seconds+dt:0;if(this.seconds>5)this.revealed=true;}if(this.revealed)this.fade=Math.min(1,this.fade+dt/2.5);}
}
