// Actual pinned NexusEngine ECS, input intent, scene lifecycle, tick and journal.
import {createEngine} from '../vendor/nexusengine/src/engine.js';
import {defineComponent,defineResource,defineEvent} from '../vendor/nexusengine/src/ecs.js';
import {createCoreInputKit,createInputIntentKit,InputIntentState} from '../vendor/nexusengine/src/core-kits/core-input-kit/index.js';
import {createCoreSceneKit} from '../vendor/nexusengine/src/core-kits/core-scene-kit/index.js';
import {createCoreMotionKit} from '../vendor/nexusengine/src/core-kits/core-motion-kit/index.js';
import {createCorePhysicsKit} from '../vendor/nexusengine/src/core-kits/core-physics-kit/index.js';
import {createCorePersistenceKit} from '../vendor/nexusengine/src/core-kits/core-persistence-kit/index.js';
import {createCoreInteractionKit} from '../vendor/nexusengine/src/core-kits/core-interaction-kit/index.js';
import {createJourneyProgressService,LOST_PAGES_REWARD_REGISTRY} from '../vendor/legacy/journey-progress.mjs';
import {createMemoryStoragePort} from '../vendor/legacy/storage-port.mjs';
import {HUB,MAP,LAYOUTS} from './layout.mjs';
export const ENGINE_PIN='55b7f33f6d008b2e3b120e370f09b96ed73105e9';
export const DT=1/60, PLAYER_RADIUS=.28, PLAYER_HEIGHT=1.503;
export const Pose=defineComponent('lostpages.pose'), Renderable=defineComponent('lostpages.renderable'), Collider=defineComponent('lostpages.collider'), SceneObject=defineComponent('lostpages.sceneObject');
export const Session=defineResource('lostpages.session'), PlayerAction=defineEvent('lostpages.playerAction');
const copy=x=>structuredClone(x), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const loops=new Set(['Idle','Run','Walk','Fall']);
const within=(p,t)=>Math.hypot(p.x-t.x,p.z-t.z)<=t.r;
const support=(p,b)=>p.x>=b.x-b.w/2-.015&&p.x<=b.x+b.w/2+.015&&p.z>=b.z-b.d/2-.015&&p.z<=b.z+b.d/2+.015;
function intersects(p,b){if(p.y>=b.y+b.h/2-.001||p.y+PLAYER_HEIGHT<=b.y-b.h/2)return false;let dx=p.x-clamp(p.x,b.x-b.w/2,b.x+b.w/2),dz=p.z-clamp(p.z,b.z-b.d/2,b.z+b.d/2);return dx*dx+dz*dz<PLAYER_RADIUS*PLAYER_RADIUS-.00001;}
export function createLostPages({storage=createMemoryStoragePort(),launch=HUB,resume=false}={}){
 const journey=createJourneyProgressService({storage});
 const engine=createEngine({kits:[createCoreInputKit({actions:{move:'axis',jump:'button',act:'button',pause:'button'}}),createInputIntentKit(),createCoreMotionKit(),createCorePhysicsKit({descriptors:{colliders:{jr:{radius:PLAYER_RADIUS,height:PLAYER_HEIGHT}},provider:{id:'lost-pages-kinematic-aabb-r01',scope:'game-owned deterministic provider'}}}),createCoreInteractionKit(),createCorePersistenceKit(),createCoreSceneKit({initialSceneId:HUB,allowDirectTransitions:true,scenes:[{id:HUB,title:'Museum',kind:'web-canvas-scene'},{id:MAP,title:'The Character Map',kind:'web-canvas-scene'}]})]});
 const w=engine.world, player=w.addEntity(), sceneApi=engine.n.coreScene;
 let layout=LAYOUTS[HUB], objects=[], sequence=0;
 function savedMapCheckpoint(){const saved=journey.snapshot().pageRecords[MAP];return resume&&saved&&!saved.completed&&saved.checkpoint?.id==='map-checkpoint'&&saved.acceptedPlan?.includes('nexus-r01')?LAYOUTS[MAP].checkpoint:undefined;}
 function pose(spawn){return {...spawn,vy:0,grounded:true,clip:'Idle',clipTime:0,land:0,actionTime:0,actionClip:null,jumpBuffer:0,coyote:0};}
 function state(){return w.getResource(Session)};function playerPose(){return w.getComponent(player,Pose)};
 function publish(s,name,data={}){const e={name,frame:engine.clock.frame,scene:layout.id,...data};s.events=[...s.events.slice(-199),e];w.emit(PlayerAction,e);s.eventSeq++;}
 function setPose(p){w.setComponent(player,Pose,p)}
 function mount(id,s,spawnOverride){const desc=LAYOUTS[id];if(!desc)throw Error('Unknown scene layout '+id);if(sceneApi.getCurrentScene()?.id!==id){let tr=sceneApi.requestTransition({direct:true,toSceneId:id,transitionId:'lp-'+(++sequence),source:'lost-pages-player-action'});if(!tr.accepted)throw Error('Nexus rejected transition');}for(const e of objects)w.removeEntity(e);objects=[];layout=desc;for(const b of desc.boxes){const e=w.addEntity();w.setComponent(e,SceneObject,b.id);w.setComponent(e,Renderable,b);if(b.kind==='floor'||b.kind==='wall')w.setComponent(e,Collider,b);objects.push(e)}
 const p=pose(spawnOverride??desc.spawn);setPose(p);sceneApi.mountScene({sceneId:id,mountId:`lp-mount-${++sequence}`,result:{entities:objects.length,provider:'lost-pages-webgl2-r06'}});s.scene=id;s.checkpoint=id===MAP&&spawnOverride?'map-checkpoint':'start';s.crossed=false;s.claimedThisRun=false;s.paused=false;s.previous={jump:false,act:false,pause:false};s.message=id===HUB?'Discover the incomplete book.':spawnOverride?'Checkpoint restored. Jump across the marked gap.':'Follow the golden route to the green checkpoint.';s.messageTimer=2.5;publish(s,'scene-mounted',{id,entities:objects.length});}
 let s={scene:HUB,bookRead:!!journey.getReceipt(MAP),paused:false,checkpoint:'start',crossed:false,claimedThisRun:false,previous:{jump:false,act:false,pause:false},events:[],eventSeq:0,message:'',messageTimer:0,falls:0,saveIssue:null,checkpointIssue:null,started:true};
 w.setComponent(player,Renderable,{id:'jr',kind:'character'});w.setResource(Session,s);mount(HUB,s);if(launch===MAP){s.bookRead=true;mount(MAP,s,savedMapCheckpoint())}w.setResource(Session,s);
 function message(s,t,seconds=2.8){s.message=t;s.messageTimer=seconds;}
 function saveCheckpoint(s){const result=journey.saveCheckpoint({pageId:MAP,acceptedPlan:['nexus-r01'],checkpoint:{id:'map-checkpoint',tick:engine.clock.frame}});s.checkpointIssue=result.ok?null:result.reason;publish(s,result.ok?'checkpoint-saved':'checkpoint-save-failed',{reason:result.reason});}
 function resetToCheckpoint(s,p){const next=pose(s.checkpoint==='map-checkpoint'&&layout.id===MAP?layout.checkpoint:layout.spawn);setPose(next);s.crossed=false;s.falls++;message(s,'Try again — back at your checkpoint.');publish(s,'respawn',{checkpoint:s.checkpoint});return next;}
 function use(s,p){let target=layout.targets.find(t=>within(p,t));if(!target||!p.grounded){message(s,'Move closer to an exhibit or fragment.');publish(s,'action-rejected',{reason:'out-of-range-or-airborne'});return p;}
 if(layout.id===HUB&&target.id==='book'){s.bookRead=true;message(s,'A page is missing. The golden map frame awakens.',4);p.actionClip='Reach';p.actionTime=.7;publish(s,'book-inspected');return p;}
 if(layout.id===HUB&&target.id==='map'){if(!s.bookRead){message(s,'Inspect the incomplete book first.');publish(s,'action-rejected',{reason:'book-not-inspected'});return p;}mount(MAP,s,savedMapCheckpoint());publish(s,'artifact-entered',{pageId:MAP});return playerPose();}
 if(layout.id===MAP&&target.id==='fragment'){if(s.claimedThisRun){message(s,'Fragment already restored. Return through the portal.');return p;}if(!s.crossed||s.checkpoint!=='map-checkpoint'){message(s,'Cross the marked gap from the checkpoint first.');publish(s,'action-rejected',{reason:'route-incomplete'});return p;}const r=journey.commitCompletion({pageId:MAP,acceptedPlan:['nexus-r01'],checkpoint:{id:'final',tick:engine.clock.frame},mastery:[{type:'direct-platforming'}]});if(!r.ok){s.saveIssue=r.reason;message(s,'Progress could not be saved. Free storage and try again.',5);publish(s,'reward-save-failed',{reason:r.reason});return p;}s.saveIssue=null;s.claimedThisRun=true;message(s,r.existing?'Fragment already restored. Return through the portal.':'Gallery Key Fragment restored! Return through the portal.',5);p.actionClip='Celebrate';p.actionTime=1.2;publish(s,'reward-committed',{existing:r.existing,receipt:r.receipt});return p;}
 if(layout.id===MAP&&target.id==='return'){if(!s.claimedThisRun||!s.crossed){message(s,'Restore the fragment before returning.');publish(s,'action-rejected',{reason:'fragment-required'});return p;}mount(HUB,s,{x:0,y:0,z:5.3,yaw:Math.PI});message(s,'The Character Map is restored. Your progress is saved.',5);publish(s,'returned-to-hub');return playerPose();}return p;}
 engine.scheduler.addSystem('simulate',world=>{let s=copy(state()),p=copy(playerPose());const intent=world.getResource(InputIntentState).intent,a=intent.actions??{};const pressed={jump:!!a.jump&&!s.previous.jump,act:!!a.act&&!s.previous.act,pause:!!a.pause&&!s.previous.pause};s.previous={jump:!!a.jump,act:!!a.act,pause:!!a.pause};const dt=engine.clock.delta;
 if(pressed.pause){s.paused=!s.paused;publish(s,s.paused?'paused':'resumed');}
 if(s.paused){world.setResource(Session,s);return;}
 s.messageTimer=Math.max(0,s.messageTimer-dt);p.land=Math.max(0,p.land-dt);p.actionTime=Math.max(0,p.actionTime-dt);
 const all=world.query(Collider).map(e=>world.getComponent(e,Collider));const walls=all.filter(b=>b.kind==='wall'),floors=all.filter(b=>b.kind==='floor');
 let dx=clamp(num(intent.x),-1,1),dz=clamp(num(intent.y),-1,1),len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;len=1;}const speed=3.0;const prevY=p.y,wasGrounded=p.grounded,prevX=p.x,prevZ=p.z;
 if(len>.05){const target=Math.atan2(dx,dz);const diff=Math.atan2(Math.sin(target-p.yaw),Math.cos(target-p.yaw));p.yaw+=clamp(diff,-12*dt,12*dt);}
 p.jumpBuffer=pressed.jump?.12:Math.max(0,p.jumpBuffer-dt);p.coyote=p.grounded?.085:Math.max(0,p.coyote-dt);if(p.jumpBuffer>0&&(p.grounded||p.coyote>0)){p.vy=4.65;p.grounded=false;p.land=0;p.jumpBuffer=0;p.coyote=0;publish(s,'jump');}
 const nextX={...p,x:p.x+dx*speed*dt};if(!walls.some(b=>intersects(nextX,b)))p.x=nextX.x;const nextZ={...p,z:p.z+dz*speed*dt};if(!walls.some(b=>intersects(nextZ,b)))p.z=nextZ.z;
 p.vy-=12*dt;p.y+=p.vy*dt;p.grounded=false;const landed=floors.filter(b=>support(p,b)&&p.vy<=0&&prevY>=b.y+b.h/2-.008&&p.y<=b.y+b.h/2+.008).sort((a,b)=>b.y+b.h/2-a.y-a.h/2)[0];if(landed){p.y=landed.y+landed.h/2;p.vy=0;p.grounded=true;if(!wasGrounded){p.land=.15;publish(s,'land',{surface:landed.id});}}
 let respawned=false;if(p.y< -2.8||Math.abs(p.x)>40||Math.abs(p.z)>40){p=resetToCheckpoint(s,p);respawned=true;}
 if(layout.id===MAP&&p.grounded&&Math.hypot(p.x-5,p.z-6.6)<.6&&s.checkpoint!=='map-checkpoint'){s.checkpoint='map-checkpoint';saveCheckpoint(s);message(s,'Checkpoint reached. Jump across the marked gap.');publish(s,'checkpoint');}
 if(layout.id===MAP&&p.grounded&&p.z>=9.2&&p.z<=13.2&&s.checkpoint==='map-checkpoint'&&!s.crossed){s.crossed=true;message(s,'Find the glowing fragment.');publish(s,'gap-crossed');}
 const actualSpeed=respawned?0:Math.hypot(p.x-prevX,p.z-prevZ)/dt; if(actualSpeed>.1&&p.actionTime>0&&len>.05){p.actionTime=0;}
 if(pressed.act&&!respawned){const sceneBefore=layout.id;p=use(s,p);if(layout.id!==sceneBefore){s.previous={jump:!!a.jump,act:!!a.act,pause:!!a.pause};setPose(p);world.setResource(Session,s);return;}}
 let clip=p.actionTime>0&&p.grounded?(p.actionClip??'Idle'):!p.grounded?(p.vy>0?'JumpStart':'Fall'):p.land>0?'Land':actualSpeed>.10?(actualSpeed>2.1?'Run':'Walk'):'Idle';if(p.clip!==clip){p.clip=clip;p.clipTime=0;}else p.clipTime+=dt;
 s.previous={jump:!!a.jump,act:!!a.act,pause:!!a.pause};setPose(p);world.setResource(Session,s);});
 return Object.freeze({engine,step(input={}){engine.inputIntent.set({x:clamp(num(input.x),-1,1),y:clamp(num(input.y),-1,1),actions:{jump:!!input.jump,act:!!input.act,pause:!!input.pause}});engine.tick(DT);return snapshot();},pause(){let s=copy(state());if(!s.paused){s.paused=true;s.previous={jump:false,act:false,pause:false};publish(s,'paused',{source:'lifecycle'});w.setResource(Session,s);}},resume(){let s=copy(state());s.paused=false;s.previous={jump:false,act:false,pause:false};publish(s,'resumed',{source:'lifecycle'});w.setResource(Session,s);},snapshot,layout:()=>layout,journey:()=>journey.snapshot(),objects:()=>w.query(Renderable).filter(e=>e!==player).map(e=>w.getComponent(e,Renderable))});
 function snapshot(){let s=copy(state()),p=copy(playerPose()),j=journey.snapshot();const target=p.grounded?layout.targets.find(t=>within(p,t)):null;const text=layout.id===HUB?(s.bookRead?'Approach the golden map frame.':'Inspect the book on the pedestal.'):(s.claimedThisRun&&s.crossed?'Return through the portal.':!s.crossed?'Reach the green checkpoint and jump the gap.':'Restore the Gallery Key Fragment.');let context=target?({book:'Inspect book',map:s.bookRead?'Enter map':'Book required',fragment:s.claimedThisRun?'Fragment restored':'Restore fragment',return:s.claimedThisRun&&s.crossed?'Return to museum':'Fragment required'}[target.id]):'Interact';return {scene:layout.id,player:p,session:s,progress:j,fragments:j.journey.rewardSlots.filter(Boolean).length,objective:text,context,frame:engine.clock.frame,sceneState:{currentSceneId:sceneApi.getState().currentSceneId,visitedSceneIds:[...sceneApi.getState().visitedSceneIds],lastMountedScene:sceneApi.getState().lastMountedScene},entityCount:w.entityCount};}
}
