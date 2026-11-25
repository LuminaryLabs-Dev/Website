/* WOVEN — playable physical-object interaction controller (no dependencies). */
(function () {
'use strict';
const {Renderer} = window.WovenEngine;
const PALETTE = [
 {name:'Madder red',hex:'#b76a63', light:'#e5a2a0'},
 {name:'Harvest gold',hex:'#d0ac67', light:'#efd59c'},
 {name:'River blue',hex:'#567a91',light:'#a6c3cb'},
 {name:'Thistle',hex:'#ae8dac',light:'#dbc2d6'},
 {name:'Sage',hex:'#839d81',light:'#bed0b5'},
 {name:'Unbleached linen',hex:'#e3dac2',light:'#f4ede0'}
];
const WEAVES = {
 plain:{name:'Plain weave',index:0,sequence:[0,1],lifts:[[0,2],[1,3]],title:'Over, under, over',description:'On each pick, the two warp groups trade places. Every weft crosses over one group and under the other, making a strong, balanced fabric.'},
 twill:{name:'2/2 twill',index:1,sequence:[0,1,2,3],lifts:[[0,1],[1,2],[2,3],[3,0]],title:'The shifting diagonal',description:'Each pick raises two neighboring shafts. Moving the raised pair creates the characteristic twill diagonal, with longer warp and weft floats.'},
 basket:{name:'2×2 basket',index:2,sequence:[0,0,1,1],lifts:[[0],[1]],title:'Threads in pairs',description:'Two adjacent warp threads act together, and two successive weft picks repeat the same shed. This creates a checkerboard of paired crossings.'}
};
const $=sel=>document.querySelector(sel);
const canvas=$('#scene'),overlay=$('#targets'),toast=$('#toast'),dialog=$('#dialog'),bubble=$('#bubble'),helpBtn=$('#helpBtn');
const title=$('#dialogTitle'),body=$('#dialogBody'),actions=$('#dialogActions');
const r=new Renderer(canvas);
const FX=window.WovenAttention ? new window.WovenAttention.Attention($('#glimmer'),r):{setFocus(){},burst(){},update(){},resize(){},suspend(){}};
const SFX=window.WovenSound ? new window.WovenSound.SoundBank() : {play(){return false},muted:false,toggleMuted(){this.muted=!this.muted;return this.muted}};
const infoPanel=$('#infoPanel'),infoTitle=$('#infoTitle'),infoText=$('#infoText'),infoClose=$('#infoClose');
const swatchDock=$('#swatchDock'),swatchThumbnail=$('#swatchThumbnail'),swatchName=$('#swatchName'),swatchProgress=$('#swatchProgress'),swatchOpen=$('#swatchOpen'),swatchHide=$('#swatchHide'),marksLayer=$('#patternMarks');
const IDLE_GLIMMER_DELAY_MS=7000;
let lastVisitorInteraction=performance.now(),attentionShown=false,lastCueSignature='',pendingFocus=[];
const visitedInfo=new Set();
let inspectorTimer=null;

const TUTORIAL_KEY='woven-loom-v7-guided-pick-complete';
let previousTutorial=false;
try{previousTutorial=window.localStorage?.getItem(TUTORIAL_KEY)==='1';}catch(_){};
const tutorial={active:!previousTutorial,step:0,completed:previousTutorial};
const TUTORIAL_STEPS=[
  {kind:'pattern',anchor:'sample_twill',title:'Choose your weave',instruction:'Select one framed cloth sample. Each pattern raises different warp threads.'},
  {kind:'yarn',anchor:'yarn1',title:'Choose your yarn',instruction:'Touch a colorful bobbin in the yarn basket. It will become the weft.'},
  {kind:'treadle',anchor:'treadle',title:'Open the shed',instruction:'Press the outlined foot treadle to separate the warp threads.'},
  {kind:'shuttle',anchor:'shuttle',title:'Pass the weft',instruction:'Click the shuttle to carry the weft across the open shed.'},
  {kind:'beater',anchor:'beater',title:'Beat the cloth',instruction:'Click the outlined reed to pack the weft against the woven edge.'}
];
function applyGuidancePresentation(){
 document.body?.classList?.toggle('glimmerOnly', tutorial.completed && !tutorial.active);
}
const S={phase:'choose',pattern:'plain',selected:0,pick:0,rows:[],shedAmount:0,liftMask:0,patternIndex:0,anim:[],direction:1,started:false};
r.game=S;
const els=new Map();
const anchors=new Map();
const colorCanvas=document.createElement('canvas');colorCanvas.width=384;colorCanvas.height=256;
const clothCtx=colorCanvas.getContext('2d',{alpha:false});
// A finished swatch is a durable sample, not the current loom state.
// Retain exact per-pick yarn colors so changing patterns cannot rewrite old work.
const SWATCH_KEY='woven-loom-v9-swatch-journal';
const completedSwatches={};
let lastCompletedPattern=null,previewDismissed=false;
function cleanRows(rows){
 if(!Array.isArray(rows)||rows.length!==16||!rows.every(v=>Number.isInteger(v)&&v>=0&&v<PALETTE.length))return null;
 return rows.slice();
}
function restoreSwatches(){
 try{
  const data=JSON.parse(window.localStorage?.getItem(SWATCH_KEY)||'null');
  if(!data||data.version!==1||!data.samples||typeof data.samples!=='object')return;
  for(const key of Object.keys(WEAVES)){
   const rowList=cleanRows(data.samples[key]?.rows);
   if(rowList)completedSwatches[key]={rows:rowList,finishedAt:Math.max(0,Number(data.samples[key].finishedAt)||0)};
  }
  lastCompletedPattern=Object.keys(completedSwatches).sort((a,b)=>completedSwatches[b].finishedAt-completedSwatches[a].finishedAt)[0]||null;
 }catch(_){/* Private browsing still supports in-session achievements. */}
}
function saveSwatches(){
 try{window.localStorage?.setItem(SWATCH_KEY,JSON.stringify({version:1,samples:completedSwatches}));}catch(_){}
}
function recordCompletedSwatch(){
 const rows=cleanRows(S.rows);if(!rows)return false;
 completedSwatches[S.pattern]={rows,finishedAt:Math.max(Date.now(),1+Math.max(0,...Object.values(completedSwatches).map(v=>v.finishedAt||0)))};
 lastCompletedPattern=S.pattern;saveSwatches();updatePatternMarks();updateSwatchDock();return true;
}
restoreSwatches();
let tick=performance.now();let busy=false;let totalFrames=0;
const interactiveNames=[];
const n=name=>r.node(name);
function ar(ids){return ids.map(n).filter(Boolean)}
function move(names,key,value){for(const obj of ar(names))obj.transform[key]=value;}
const INSPECT={
 yarn:{title:'Yarn and the weft',text:'Each bobbin is a different yarn color. The warp threads are prepared on the loom before weaving; the weft is the crosswise yarn carried by the shuttle. You can change the weft color between picks to make stripes.'},
 treadle:{title:'Treadles and shafts',text:'The wooden pedals select which groups of lengthwise warp threads rise. Opening a shed creates space for the shuttle to pass. A different treadle order changes the woven pattern. This simulator uses simplified four-shaft controls.'},
 shuttle:{title:'The shuttle',text:'A shuttle carries the weft from one side of the loom to the other through the opened shed. It returns on the next pick, so the cloth grows as a continuous sequence of crossings.'},
 beater:{title:'The reed and beater',text:'After a shuttle pass, the reed pushes the new weft against the growing edge of the fabric, called the fell. This packs the picks together and gives the cloth its structure.'},
 warp:{title:'Warp: the lengthwise threads',text:'The warp runs lengthwise, held under tension across the loom. Alternating raised warp groups create the openings needed to interlace a continuous weft. The threads are intentionally shown spaced apart so you can study the mechanism.'},
 cloth:{title:'Your growing cloth',text:'Each packed shuttle pass adds one pick of weft. The visible crossing order is determined by the selected weave structure and treadle sequence. Try changing yarn colors between picks and watch the fabric develop.'},
 basket:{title:'The yarn basket',text:'A working weaver keeps prepared yarn near the loom. In this activity, six original dyed or natural yarn choices let you experiment with color. Cotton, wool, and linen have different properties, though this is a simplified teaching model.'},
 frame:{title:'The loom frame',text:'The wooden frame supports the beams, reed, warp, and mechanism that keep threads aligned and tensioned. A handloom is operated directly by a person. Manchester’s large textile factories used mechanized and powered equipment.'},
 roller:{title:'Rollers and tension',text:'Loom beams store or take up yarn and cloth. Controlled tension matters: uneven warp tension can interfere with a clean shed and the regular packing of weft picks.'},
 ratchet:{title:'The ratchet mechanism',text:'Ratchet teeth can prevent a rotating beam from turning backward. Such mechanisms help hold a chosen tension as weaving progresses. This model illustrates the principle rather than reproducing a museum machine exactly.'},
 reed:{title:'The reed',text:'The reed separates and guides the warp ends and moves forward to beat the newly laid weft into place. It is part of the loom’s moving beater assembly.'},
 paper:{title:'Weaving notes',text:'Use this paper to review how to weave, replay the guided pick, and mute or restore the loom sounds. You can explore objects and their explanations without advancing the weaving sequence.'},
 mill:{title:'Manchester and the mills',text:'Manchester, New Hampshire grew around water-powered textile manufacturing, including the Amoskeag mills. This playable handloom demonstrates the basic weaving principle, not the scale or machinery of industrial factory production.'},
 plain:{title:'Plain weave',text:'With two alternating sheds, the weft passes over one group of warp ends and under the next. On the following pick the interlacement reverses. The result is a balanced, familiar cloth.'},
 twill:{title:'2/2 twill',text:'A twill lifts two neighboring groups of warp ends, then shifts the pairing on successive picks. This creates the recognizable diagonal rib and longer thread floats than plain weave.'},
 basketPattern:{title:'2×2 basket weave',text:'Two adjacent warp ends act together, and two weft picks repeat each shed before switching. The larger over-under blocks produce a checkerboard-like structure.'}
};
const EXPLORATION_FOCUS_IDS=['warp','cloth','frame','basket','roller','reed','ratchet','mill'];
let explorationCycleIndex=-1;
function noteFor(def){
 if(def.kind==='pattern')return INSPECT[def.id==='sample_plain'?'plain':def.id==='sample_twill'?'twill':'basketPattern'];
 if(def.kind==='yarn')return {...INSPECT.yarn,title:PALETTE[Number(def.id.slice(4))].name+' yarn'};
 if(def.kind==='explore')return INSPECT[def.topic];
 return INSPECT[def.kind]||INSPECT.paper;
}
function closeInfo(){
 if(!infoPanel) return;
 infoPanel.hidden=true;clearTimeout(inspectorTimer);inspectorTimer=null;
}
function markVisitorInteraction(){
 lastVisitorInteraction=performance.now();attentionShown=false;lastCueSignature='';explorationCycleIndex=-1;
 FX.suspend?.();
 for(const f of pendingFocus){const node=n(f.name);if(node)node.highlight=0;}
 for(const node of (r.nodes||[])){if(node.highlight>0)node.highlight=0;}
}
function showInfo(def,always=false){
 if(!infoPanel) return;
 const info=noteFor(def);if(!info)return;
 if(!always && visitedInfo.has(def.id))return;
 if(!always)visitedInfo.add(def.id);
 infoTitle.textContent=info.title;infoText.textContent=info.text;
 infoPanel.hidden=false;clearTimeout(inspectorTimer);
 inspectorTimer=setTimeout(()=>closeInfo(),9000);
 if(always)SFX.play('inspect');
 announce(info.title+'. '+info.text);
}
function hushHintsUntilIdle(now){
 const inactive=!S.started || !dialog.hidden || (infoPanel && !infoPanel.hidden) || now-lastVisitorInteraction<IDLE_GLIMMER_DELAY_MS;
 if(inactive){
  if(attentionShown){FX.suspend?.();attentionShown=false;lastCueSignature='';}
  for(const node of (r.nodes||[])) if(node.highlight>0) node.highlight=0;
  return false;
 }
 const extras=[];
 if(!tutorial.active && EXPLORATION_FOCUS_IDS.length){
  const i=Math.floor((now-lastVisitorInteraction-IDLE_GLIMMER_DELAY_MS)/6500)%EXPLORATION_FOCUS_IDS.length;
  explorationCycleIndex=i;
  const id=EXPLORATION_FOCUS_IDS[i];const def=definitions.find(d=>d.id===id);
  if(def && n(def.name)) extras.push({name:def.name,color:'#b5d4da',radius:21});
 }
 const visibleFocus=[...pendingFocus.slice(0,3),...extras];
 const sig=visibleFocus.map(x=>x.name).join('|');
 if(!attentionShown||sig!==lastCueSignature){
  FX.setFocus(visibleFocus);attentionShown=true;lastCueSignature=sig;
  for(const node of (r.nodes||[])) if(node.highlight>0)node.highlight=0;
  for(const f of visibleFocus){const node=n(f.name);if(node)node.highlight=.83;}
 }
 return true;
}
const reedNames=['Reed frame','Reed frame.001','Reed edge','Reed edge.001','Reed edge.002','Reed edge.003'];
const shuttleNames=['Shuttle body','Shuttle bobbin'];
function announce(str){$('#announcer').textContent=str;}
function toastMsg(str,force=false){if(tutorial.completed&&!tutorial.active&&!force)return;toast.textContent=str;toast.classList.add('visible');clearTimeout(toastMsg.t);toastMsg.t=setTimeout(()=>toast.classList.remove('visible'),1050);}
function anim(dur,onMove,onDone=()=>{}){S.anim.push({duration:dur,age:0,onMove,onDone});}
function ease(t){return t*t*(3-2*t)}
function nextTutorialStage(expected){
 if(!tutorial.active||TUTORIAL_STEPS[tutorial.step]?.kind!==expected)return;
 tutorial.step=Math.min(5,tutorial.step+1);
}
function completeTutorial(){
 if(!tutorial.active||tutorial.step!==4)return;
 tutorial.step=5;tutorial.active=false;tutorial.completed=true;
 try{window.localStorage?.setItem(TUTORIAL_KEY,'1')}catch(_){}
 applyGuidancePresentation();
 r.resetView?.();announce('Guided tutorial complete. You have woven your first pick. Continue weaving freely; glimmers wait seven seconds.');
 // Attention is deliberately delayed after every visitor interaction.
}
function replayTutorial(){
 markVisitorInteraction();closeInfo();closePopup();S.started=true;tutorial.active=true;tutorial.step=0;tutorial.completed=false;
 applyGuidancePresentation();
 resetSample(false);S.phase='choose';updateTargets();
 announce('Tutorial restarted. Step one: choose a weaving pattern from the three framed samples.');
}
function shaderColor(index){return PALETTE[index].hex}
function indexOfShed(){const w=WEAVES[S.pattern];return w.sequence[S.pick%w.sequence.length]}
function currentLiftMask(){const w=WEAVES[S.pattern];return w.lifts[indexOfShed()].reduce((m,i)=>m|(1<<i),0)}
function rowWarpUp(col,row){
 const w=WEAVES[S.pattern],select=w.sequence[row % w.sequence.length];
 const shaft=S.pattern==='basket' ? (Math.floor(col/2)%2) : col%4;
 return w.lifts[select].includes(shaft);
}
function drawFabric(ctx,pattern,rows){
 // This one rasterization function drives the 3D cloth, live dock, saved preview,
 // and exported PNG. It prevents inconsistent weave/color representations.
 const w=ctx.canvas?.width||colorCanvas.width,h=ctx.canvas?.height||colorCanvas.height;
 const xN=48,yN=16,cellX=w/xN,cellY=h/yN;
 ctx.fillStyle='#f0e7d5';ctx.fillRect(0,0,w,h);
 for(let x=0;x<xN;x++){
  ctx.fillStyle=x%4===0?'#cdbca4':'#e8dfce';ctx.fillRect(x*cellX,0,cellX+1,h);
 }
 const weave=WEAVES[pattern];
 for(let row=0;row<rows.length;row++){
  const shade=PALETTE[rows[row]].hex,shadeHi=PALETTE[rows[row]].light;
  const yy=h-(row+1)*cellY,select=weave.sequence[row%weave.sequence.length];
  for(let col=0;col<xN;col++){
   const xx=col*cellX,shaft=pattern==='basket'?Math.floor(col/2)%2:col%4;
   const up=weave.lifts[select].includes(shaft);
   if(up){
    ctx.fillStyle=col%4===0?'#d0bfa8':'#ece3d5';ctx.fillRect(xx,yy,cellX+1,cellY+1);
    ctx.fillStyle='#c4b39a';ctx.fillRect(xx+cellX*.32,yy,cellX*.25,cellY+1);
   }else{
    ctx.fillStyle=shade;ctx.fillRect(xx,yy,cellX+1,cellY+1);
    ctx.fillStyle=shadeHi;ctx.fillRect(xx,yy+cellY*.28,cellX+1,cellY*.22);
   }
  }
 }
 ctx.strokeStyle='rgba(102,75,48,.3)';ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
}
function swatchDataURL(pattern,rows){
 const c=document.createElement('canvas');c.width=384;c.height=256;
 const ctx=c.getContext('2d',{alpha:false});drawFabric(ctx,pattern,rows);
 return c.toDataURL('image/png');
}
function repaintCloth(){
 drawFabric(clothCtx,S.pattern,S.rows);
 r.updateCloth();
 updateSwatchDock();
}
function updateSwatchDock(){
 if(!swatchDock)return;
 const hasCurrent=S.rows.length>0;
 const key=hasCurrent?S.pattern:lastCompletedPattern;
 const rows=hasCurrent?S.rows:completedSwatches[key]?.rows;
 if(!rows || previewDismissed){swatchDock.hidden=true;return;}
 const complete=!hasCurrent||S.pick===16;
 swatchDock.hidden=false;
 swatchThumbnail.src=hasCurrent?colorCanvas.toDataURL('image/png'):swatchDataURL(key,rows);
 swatchThumbnail.alt=WEAVES[key].name+' fabric woven with '+rows.length+' weft picks';
 swatchName.textContent=WEAVES[key].name;
 swatchProgress.textContent=complete?'Finished swatch · 16 picks':`Growing cloth · ${rows.length} / 16 picks`;
 swatchDock.dataset.pattern=key;
}
function presentSwatch(pattern,rows,finished){
 const data=swatchDataURL(pattern,rows),weave=WEAVES[pattern];
 const colors=[...new Set(rows.map(i=>PALETTE[i].name))].join(', ');
 const titleText=finished?'Your finished '+weave.name:'Your growing '+weave.name;
 const descriptive=finished?`Completed 16 picks. ${weave.description}`:`${rows.length} of 16 picks woven. Each colored row is preserved exactly as placed.`;
 popup(titleText,`<figure class="swatchFigure"><img src="${data}" alt="Woven ${weave.name} textile preview" width="384" height="256"><figcaption>${finished?'Finished fabric':'Live sample'} · ${rows.length} picks</figcaption></figure><p>${descriptive}</p><p><strong>Weft yarn:</strong> ${colors||'No yarn yet'}</p><p class="subtext">This enlarged preview uses the same weave calculation and yarn colors as the fabric on the loom.</p>`,[
  {label:'Back to the loom',fn:closePopup},
  ...(finished?[{label:'Weave another',secondary:true,fn:()=>{closePopup();resetSample(false);}}]:[]),
  {label:'Save sample PNG',secondary:true,fn:()=>downloadSwatch(pattern,rows)},
  {label:'Explore the pattern',secondary:true,fn:()=>{closePopup();const id='sample_'+pattern;const def=definitions.find(d=>d.id===id);if(def)showInfo(def,true);}}
 ]);
}
function downloadSwatch(pattern,rows){
 const data=swatchDataURL(pattern,rows);const a=document.createElement('a');a.href=data;a.download=`Woven-${pattern}-${rows.length}-picks.png`;a.click();
}
function openCompletedSwatch(pattern){
 const sample=completedSwatches[pattern];if(!sample)return false;
 markVisitorInteraction();SFX.play('inspect');presentSwatch(pattern,sample.rows,true);return true;
}
function openLiveSwatch(){
 markVisitorInteraction();
 if(S.rows.length){presentSwatch(S.pattern,S.rows,S.pick===16);return;}
 if(lastCompletedPattern){openCompletedSwatch(lastCompletedPattern);return;}
 const def=definitions.find(d=>d.id==='cloth');if(def)showInfo(def,true);
}
const marks=new Map();
function createPatternMarks(){
 if(!marksLayer)return;
 for(const key of Object.keys(WEAVES)){
  const button=document.createElement('button');button.type='button';
  button.className='patternCheck';button.dataset.pattern=key;
  button.setAttribute('aria-label','View finished '+WEAVES[key].name+' cloth');
  button.setAttribute('title','View your finished '+WEAVES[key].name+' cloth');
  button.innerHTML='<span aria-hidden="true">✓</span>';
  button.addEventListener('click',()=>openCompletedSwatch(key));
  marksLayer.append(button);marks.set(key,button);
 }
 updatePatternMarks();
}
function updatePatternMarks(){
 for(const [key,button] of marks)button.hidden=!completedSwatches[key];
}
function layOutPatternMarks(){
 for(const [key,button] of marks){
  if(!completedSwatches[key]){button.hidden=true;continue;}
  const point=r.center('Sample frame'+(WEAVES[key].index?'.'+String(WEAVES[key].index).padStart(3,'0'):''));
  if(!point){button.hidden=true;continue;}
  const p=r.project([point[0]+.62,point[1]+.29,point[2]+.08]);
  button.hidden=!p||p.z>1||p.z< -1||p.x<0||p.x>canvas.clientWidth||p.y<0||p.y>canvas.clientHeight;
  if(!button.hidden){button.style.left=p.x+'px';button.style.top=p.y+'px';}
 }
}

function popup(heading,text,buttons){
 closeInfo();markVisitorInteraction();
 title.textContent=heading;body.innerHTML=text;actions.replaceChildren();
 for(const cfg of buttons){const b=document.createElement('button');b.textContent=cfg.label;if(cfg.secondary)b.classList.add('secondary');b.addEventListener('click',cfg.fn);actions.append(b);}
 dialog.hidden=false;dialog.setAttribute('aria-hidden','false');
}
function closePopup(){dialog.hidden=true;dialog.setAttribute('aria-hidden','true');markVisitorInteraction();}
function savePNG(){downloadSwatch(S.pattern,S.rows);}
function resetTreadles(){for(let i=0;i<4;i++){move([nameForTreadle(i)],'rx',0);move(['Treadle pin'+(i?'.'+String(i).padStart(3,'0'):'')],'dy',0);}}
function resetSample(keepColor=true){resetTreadles();S.pick=0;S.rows=[];S.liftMask=0;S.shedAmount=0;S.anim=[];move(reedNames,'dy',0);move(reedNames,'dz',0);
 move(shuttleNames,'dx',S.direction===1?0:2.7);
 previewDismissed=false;
 S.phase=keepColor&&S.started?'treadle':'choose';repaintCloth();updateTargets();}
function changePattern(value){markVisitorInteraction();if(!WEAVES[value])return;
 if(tutorial.active&&tutorial.step!==0){toastMsg('Finish this pick, or open the paper to explore.');return;}
 S.pattern=value;S.patternIndex=WEAVES[value].index;resetSample(!tutorial.active);
 SFX.play('pattern');
 if(tutorial.active){S.phase='choose';nextTutorialStage('pattern');updateTargets();}
 toastMsg(WEAVES[value].name+' selected');announce('Selected '+WEAVES[value].name+'; new fabric ready.');}
function chooseYarn(value){
 markVisitorInteraction();if(value<0||value>=PALETTE.length)return;
 if(tutorial.active && tutorial.step!==1){toastMsg('Choose a pattern first');return;}
 S.selected=value;S.started=true;
 if(S.phase==='complete')resetSample(true);
 else if(S.phase==='choose')S.phase='treadle';
 SFX.play('yarn');
 nextTutorialStage('yarn');
 toastMsg(PALETTE[value].name+' yarn');
 announce(PALETTE[value].name+' selected. Press the highlighted treadle.');
 updateTargets();
}
function pressTreadle(value){
 markVisitorInteraction();if(tutorial.active&&tutorial.step!==2)return;
 if(S.phase!=='treadle'){toastMsg('Follow the glowing action');return;}
 if(value!==indexOfShed()){toastMsg('Use the glowing treadle');return;}
 resetTreadles();
 const name='Foot treadle'+(value?'.'+String(value).padStart(3,'0'):'');
 const pin='Treadle pin'+(value?'.'+String(value).padStart(3,'0'):'');
 S.liftMask=currentLiftMask();S.shedAmount=0;
 anim(.36,t=>{let p=Math.sin(Math.PI*t);move([name],'rx',-.16*p);move([pin],'dy',-.04*p);S.shedAmount=ease(t);},()=>{move([name],'rx',-.10);move([pin],'dy',-.04);S.shedAmount=1;});
 S.phase='shuttle';SFX.play('treadle');nextTutorialStage('treadle');toastMsg('Shed opened');announce('Shed opened. Throw the shuttle through the warp threads.');updateTargets();
}
function throwShuttle(){
 markVisitorInteraction();if(tutorial.active&&tutorial.step!==3)return;
 if(S.phase!=='shuttle'){toastMsg('Open the shed first');return;}
 const start=S.direction===1?0:2.7,finish=S.direction===1?2.7:0;
 anim(.66,t=>{const x=start+(finish-start)*ease(t);move(shuttleNames,'dx',x);move(shuttleNames,'dy',.03*Math.sin(t*Math.PI));},()=>{move(shuttleNames,'dx',finish);move(shuttleNames,'dy',0);S.direction*=-1;});
 S.phase='beat';SFX.play('shuttle');nextTutorialStage('shuttle');toastMsg('Shuttle passed');announce('Shuttle crossed the shed. Beat the weft against the woven edge.');updateTargets();
}
function beat(){
 markVisitorInteraction();if(tutorial.active&&tutorial.step!==4)return;
 if(S.phase!=='beat'){toastMsg('Throw the shuttle first');return;}
 anim(.44,t=>{const p=Math.sin(Math.PI*t);move(reedNames,'dz',.3*p);move(reedNames,'dy',-.10*p);S.shedAmount=1-t;},()=>{move(reedNames,'dy',0);move(reedNames,'dz',0);S.shedAmount=0;S.liftMask=0;resetTreadles();});
 S.rows.push(S.selected);S.pick=S.rows.length;repaintCloth();
 SFX.play('beater');
 if(S.pick>=16){S.phase='complete';recordCompletedSwatch();const finishedPattern=S.pattern;setTimeout(()=>{if(S.phase==='complete'&&S.pick===16&&S.pattern===finishedPattern)finishSample();},470);}
 else{S.phase='treadle';toastMsg(`Pick ${S.pick} woven`);}
 // No forced visual celebration; all glimmer cues wait seven seconds.
 announce('Pick '+S.pick+' woven. '+(S.pick>=16?'Your sample is complete.':'Now choose the next treadle.'));
 completeTutorial();updateTargets();
}
function finishSample(){
 SFX.play('complete');
 // Showcase the actual 16-pick cloth. The sample is already stored and checked.
 const saved=completedSwatches[S.pattern];
 if(saved)presentSwatch(S.pattern,saved.rows,true);
}

function exitGuidedMode(){
 markVisitorInteraction();tutorial.active=false;tutorial.completed=true;
 try{window.localStorage?.setItem(TUTORIAL_KEY,'1')}catch(_){}
 applyGuidancePresentation();closePopup();S.started=true;
 updateTargets();
 announce('Explore freely. The next helpful glimmer appears after seven seconds without interaction.');
}
function showHelp(){
 markVisitorInteraction();SFX.play('inspect');
 const muteLabel=SFX.muted?'Turn loom sounds on':'Mute loom sounds';
 const buttons=[
  {label:S.started?'Return to the loom':'Begin weaving',fn:()=>{S.started=true;closePopup();updateTargets();}},
  {label:'Inspect freely',secondary:true,fn:exitGuidedMode},
  {label:'Replay the guided pick',secondary:true,fn:replayTutorial},
  {label:muteLabel,secondary:true,fn:()=>{SFX.toggleMuted();showHelp();}}
 ];
 popup('Explore the loom',`<p>Click <strong>any physical part</strong> to read its museum note. When that part is ready, a click also operates it. The first guided pick is optional, and exploration never forces you to weave a particular pattern.</p><ol><li>Choose a pattern and yarn.</li><li>Press the indicated treadle to open a shed.</li><li>Pass the shuttle through the warp.</li><li>Beat the weft into the cloth.</li></ol><p>After <strong>seven seconds without interaction</strong>, shimmering yarn-like glints gently reveal the next action and another part worth investigating. They disappear as soon as you interact.</p><p>Use <strong>M</strong> to mute, <strong>F</strong> for fullscreen, <strong>drag empty space</strong> to look around and <strong>scroll</strong> to zoom. Double-click the background to reset the view. Right-click a part to reopen its explanation. A small live cloth preview grows with each pick. Completed patterns keep a check mark beside their framed sample, and your woven designs can be revisited later. The experience works locally without internet access.</p><p class="subtext">This is an educational handloom interpretation, not a specific museum loom reconstruction.</p>`,buttons);
}
function nameForYarn(i){return 'Yarn bobbin'+(i?'.'+String(i).padStart(3,'0'):'');}
function nameForTreadle(i){return 'Foot treadle'+(i?'.'+String(i).padStart(3,'0'):'');}
const definitions=[];
for(let i=0;i<6;i++)definitions.push({id:'yarn'+i,name:nameForYarn(i),label:'Use '+PALETTE[i].name,kind:'yarn',action:()=>chooseYarn(i)});
for(let i=0;i<4;i++)definitions.push({id:'treadle'+i,name:nameForTreadle(i),label:'Press treadle '+(i+1),kind:'treadle',action:()=>pressTreadle(i)});
definitions.push({id:'shuttle',name:'Shuttle body',label:'Pass the shuttle',kind:'shuttle',action:throwShuttle});
definitions.push({id:'beater',name:'Reed frame.001',label:'Beat the weft',kind:'beater',action:beat});
definitions.push({id:'sample_plain',name:'Sample frame',label:'Try plain weave',kind:'pattern',action:()=>changePattern('plain')});
definitions.push({id:'sample_twill',name:'Sample frame.001',label:'Try 2/2 twill',kind:'pattern',action:()=>changePattern('twill')});
definitions.push({id:'sample_basket',name:'Sample frame.002',label:'Try basket weave',kind:'pattern',action:()=>changePattern('basket')});
definitions.push({id:'help',name:'Pinned paper',label:'How to weave',kind:'help',action:showHelp});
// Discovery targets remain readable even when they are not the current weaving action.
for(const [id,name,label,topic] of [
 ['warp','91 individually spaced warp threads','Inspect the warp','warp'],
 ['cloth','Partly woven cloth','Inspect the growing cloth','cloth'],
 ['basket','Willow basket','Inspect the yarn basket','basket'],
 ['frame','Loom upright','Inspect the wooden loom frame','frame'],
 ['roller','Crown roller','Inspect the loom roller','roller'],
 ['ratchet','Brass ratchet wheel','Inspect the ratchet','ratchet'],
 ['reed','Reed threads','Inspect the reed threads','reed'],
 ['paper','Notes board','Inspect the workshop notes','paper'],
 ['mill','Far factory block','Learn about Manchester mills','mill']
 ])definitions.push({id,name,label,kind:'explore',topic});

function addTargets(){
 for(const def of definitions){
  const button=document.createElement('button');button.type='button';
  button.className='target '+(def.kind==='explore'?'explore':def.kind);
  button.dataset.action=def.id;
  button.innerHTML=`<span class="halo"></span><span class="tip">${def.label}</span>`;
  button.setAttribute('aria-label',def.label);
  button.onclick=()=>{
   markVisitorInteraction();
   if(def.kind==='help'){showHelp();return;}
   if(def.id==='cloth'&&!tutorial.active){openLiveSwatch();return;}
   if(!S.started){S.started=true;closePopup();}
   const canAct=allowedTarget(def);
   if(def.kind==='explore'||!canAct){showInfo(def,true);return;}
   // A finished pattern's frame is an invitation to inspect it again; the
   // adjacent check mark can open it even while weaving a different pattern.
   if(def.kind==='pattern'&&!tutorial.active&&S.pattern===def.id.slice(7)&&S.phase==='complete'&&completedSwatches[S.pattern]){
     openCompletedSwatch(S.pattern);return;
   }
   // Inspecting a sample should never destroy work in progress without notice.
   if(def.kind==='pattern'&&!tutorial.active&&S.pick>0&&S.pick<16){
     const newKey=def.id.replace('sample_','');
     if(newKey===S.pattern){showInfo(def,true);return;}
     const note=noteFor(def);
     popup('Try '+note.title+'?',`<p>${note.text}</p><p><strong>Switching will restart your current ${S.pick}-pick sample.</strong> You can keep weaving instead.</p>`,[
      {label:'Keep my current cloth',fn:closePopup},
      {label:'Start new pattern',secondary:true,fn:()=>{closePopup();def.action();showInfo(def,true);}}
     ]);
     return;
   }
   // Working objects perform their action immediately; the first encounter also
   // supplies a non-blocking object note. There is no forced read-next gate.
   const wasGuided=tutorial.active;def.action();
   if(!wasGuided)showInfo(def,false);
   button.classList.remove('clicked');void button.offsetWidth;button.classList.add('clicked');
  };
  button.addEventListener('contextmenu',e=>{e?.preventDefault?.();markVisitorInteraction();showInfo(def,true);});
  overlay.append(button);els.set(def.id,button);
 }
}
const allowedTarget=def=>{
 if(def.kind==='help'||def.kind==='explore')return true;
 if(tutorial.active){
   const step=TUTORIAL_STEPS[tutorial.step];
   if(!step)return false;
   if(step.kind==='pattern')return def.kind==='pattern';
   if(step.kind==='yarn')return def.kind==='yarn';
   if(step.kind==='treadle')return def.kind==='treadle' && S.phase==='treadle' && +def.id.slice(7)===indexOfShed();
   return def.kind===step.kind;
 }
 if(def.kind==='pattern')return true;
 if(def.kind==='yarn')return true;
 if(def.kind==='treadle')return S.phase==='treadle' && +def.id.slice(7)===indexOfShed();
 if(def.kind==='shuttle')return S.phase==='shuttle';
 if(def.kind==='beater')return S.phase==='beat';
 return false;
};
function updateTargets(){
 const focus=[];
 for(const def of definitions){
  const button=els.get(def.id);if(!button)continue;
  const valid=allowedTarget(def);
  const tutorialAccent=tutorial.active && valid && def.kind!=='help' && def.kind!=='explore';
  const normalAccent=!tutorial.active&&(def.kind==='yarn'&&(S.phase==='choose'||S.phase==='complete')||def.kind==='pattern'&&S.phase==='complete'||def.kind==='treadle'&&valid||def.kind==='shuttle'&&valid||def.kind==='beater'&&valid);
  const highlight=tutorialAccent || normalAccent;
  button.classList.toggle('active',!!highlight);button.classList.toggle('dim',!valid);
  button.classList.toggle('selected',def.kind==='pattern'&&def.id==='sample_'+S.pattern||def.kind==='yarn'&&def.id==='yarn'+S.selected);
  button.disabled=false; // every physical hotspot can open an information note
  const node=n(def.name);
  if(node){node.highlight=0;node.dim=tutorial.active&&!valid?.78:1;}
  if(highlight && node)focus.push({name:def.name,color:def.kind==='yarn'?'#f5d3ab':def.kind==='pattern'?'#b6d9ed':'#ffe6a7',radius:def.kind==='pattern'?38:26});
 }
 // The material shimmer and canvas motes follow the same state as pointer events.
 pendingFocus=focus;
 FX.suspend?.();attentionShown=false;lastCueSignature='';
 let target=null;
 if(tutorial.active){const step=TUTORIAL_STEPS[tutorial.step];
  target=step?.anchor==='treadle'?'Foot treadle'+(indexOfShed()?'.'+String(indexOfShed()).padStart(3,'0'):''):definitions.find(d=>d.id===step?.anchor)?.name;
 }else{
  const main=definitions.find(d=>d.kind!=='yarn'&&els.get(d.id).classList.contains('active'))||definitions.find(d=>d.id==='yarn1'&&S.phase==='choose');
  target=main?.name;
 }
 if(target && tutorial.active)r.focusOn?.(target);
 $('#status').textContent=tutorial.active ? `Tutorial step ${tutorial.step+1} of 5` : S.phase==='choose'?'Choose yarn':S.phase==='treadle'?'Press treadle':S.phase==='shuttle'?'Pass the shuttle':S.phase==='beat'?'Beat the weft':'Sample complete';
 if(tutorial.active){
   const step=TUTORIAL_STEPS[tutorial.step];
   bubble.innerHTML=`<span class="tutStep">Tutorial · ${tutorial.step+1} / 5</span><strong>${step.title}</strong> — ${step.instruction}`;
 } else bubble.textContent='';
 $('#pickCount').textContent=String(S.pick).padStart(2,'0');
}
function layOut(){for(const def of definitions){const obj=n(def.name),button=els.get(def.id);if(!obj){button.hidden=true;continue;}
 const anchor=r.center(def.name); if(!anchor){button.hidden=true;continue;}
 if(def.kind==='treadle')anchor[1]+=.025;
 if(def.kind==='help')anchor[2]+=.05;
 if(def.kind==='explore'){
  if(def.id==='warp'){anchor[0]+=.83;anchor[1]+=.27;}
  if(def.id==='cloth'){anchor[0]+=.72;anchor[1]-=.12;}
  if(def.id==='reed'){anchor[0]-=.52;anchor[1]+=.1;}
  if(def.id==='frame'){anchor[1]+=.4;}
 }
 const s=r.project(anchor);if(!s||s.z>1||s.z< -1){button.hidden=true;continue;}
 button.hidden=false;button.style.left=s.x+'px';button.style.top=s.y+'px';}
 // Anchor the small instructional hint near the active physical part; no permanent HUD.
 let active=tutorial.active?definitions.find(d=>d.id===TUTORIAL_STEPS[tutorial.step]?.anchor):definitions.find(d=>els.get(d.id).classList.contains('active'));
 if(tutorial.active && TUTORIAL_STEPS[tutorial.step]?.anchor==='treadle')active=definitions.find(d=>d.id==='treadle'+indexOfShed());
 const p=active?r.project(r.center(active.name)):null;
 if(p){const half=Math.min(155,innerWidth*.32);bubble.style.left=Math.max(half,Math.min(innerWidth-half,p.x))+'px';bubble.style.top=Math.max(88,p.y-69)+'px';}
 bubble.hidden=!S.started||!tutorial.active||S.phase==='complete';
 layOutPatternMarks();
}
let initialized=false;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-tick)/1000));tick=now;
 const cuesReady=hushHintsUntilIdle(now);
 for(let i=S.anim.length-1;i>=0;i--){const a=S.anim[i];a.age+=dt;let t=Math.min(1,a.age/a.duration);a.onMove(t);if(t>=1){a.onDone();S.anim.splice(i,1);}}
 // Ghosted demonstrations appear only after the same seven-second inactivity gate.
 // Actual user-triggered animations take precedence over idle motion hints.
 if(S.anim.length===0){
   for(let i=0;i<6;i++){
     const obj=n(nameForYarn(i));
     if(obj)obj.transform.dy=cuesReady&&S.phase==='choose' ? Math.sin(now*.0025+i*.65)*.009 : 0;
   }
   for(let i=0;i<4;i++){
     const obj=n(nameForTreadle(i));
     if(obj && S.phase==='treadle')obj.transform.rx=cuesReady&&i===indexOfShed()?(-.025-.025*Math.sin(now*.004)):0;
   }
   if(cuesReady&&S.phase==='shuttle')move(shuttleNames,'dy',Math.sin(now*.004)*.018);
   else move(shuttleNames,'dy',0);
   if(cuesReady&&S.phase==='beat')move(reedNames,'dz',.035+.035*Math.sin(now*.004));
   else move(reedNames,'dz',0);
 }
 const cloth=n('Partly woven cloth');if(cloth?.highlight>0)cloth.highlight=Math.max(0,cloth.highlight-dt*1.65);
 r.render(dt);layOut();FX.update(dt);totalFrames++;
 requestAnimationFrame(frame);
}
function assertScene(){
 const required=['Shuttle body','Shuttle bobbin','Reed frame.001','Partly woven cloth','Foot treadle','Yarn bobbin','Sample frame.002','91 individually spaced warp threads'];
 const missing=required.filter(k=>!n(k));if(missing.length)throw Error('The selected GLB lacks interaction nodes: '+missing.join(', '));
}
function init(){
 const stats=r.load(window.LOOM_MODEL_GLB_BASE64);assertScene();
 r.setClothCanvas(colorCanvas);repaintCloth();S.patternIndex=WEAVES[S.pattern].index;
 addTargets();createPatternMarks();applyGuidancePresentation();updateTargets();updateSwatchDock();
 $('#modelMeta').textContent=`Source: Millyard_Loom_Reference_Yarn.glb · ${stats.nodes} scene objects`;
 $('#loading').hidden=true;
 if(tutorial.active){
  popup('Learn the loom in one pick',`<p>Follow the outlined parts through <strong>one complete weaving cycle</strong>. Begin by choosing a cloth pattern on the right, then choose yarn, open the shed, pass the shuttle, and beat the weft.</p><p>The words and outline rings retire after the first woven pick. Only after seven seconds of inactivity will glimmers gently suggest another action. You can also freely click other parts for museum notes.</p><p class="subtext">An educational interpretation of a handloom; not a reconstruction of an Amoskeag industrial loom.</p>`,[
  {label:'Start guided tutorial',fn:()=>{S.started=true;closePopup();updateTargets();announce('Step one of five: choose a weaving pattern.');}},
  {label:'Explore freely instead',secondary:true,fn:exitGuidedMode}
  ]);
 }else{S.started=true;closePopup();updateTargets();}
 initialized=true;
 requestAnimationFrame(t=>{tick=t;frame(t);});
 window.__woven={ready:true,model:stats,state:S,tutorial,selectYarn:chooseYarn,pressTreadle,throwShuttle,beat,changePattern,replayTutorial,renderer:r,effects:FX,sounds:SFX,inspect:(id)=>{const def=definitions.find(d=>d.id===id);if(def){markVisitorInteraction();showInfo(def,true);}},getHintState:()=>({lastVisitorInteraction,attentionShown,delay:IDLE_GLIMMER_DELAY_MS,focusCount:pendingFocus.length}),advanceHintClock:hushHintsUntilIdle,savePNG,completedSwatches,openCompletedSwatch,openLiveSwatch,getSwatchImage:(key)=>completedSwatches[key]?swatchDataURL(key,completedSwatches[key].rows):null};
}
function fail(err){console.error(err);$('#loading').hidden=true;$('#fatal').hidden=false;$('#fatal').textContent='Unable to start the 3D loom: '+err.message;}
window.addEventListener('resize',()=>{r.resize();layOut();});
window.addEventListener('keydown',e=>{
 if(e.key.toLowerCase()==='f'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){
   const app=$('#app');
   if(document.fullscreenElement) document.exitFullscreen?.().catch?.(()=>{});
   else app?.requestFullscreen?.().catch?.(()=>{});
   return;
 }
 if(e.key==='Escape'&&!dialog.hidden){closePopup();return;}
 if(e.key==='Escape'&&infoPanel&&!infoPanel.hidden){markVisitorInteraction();closeInfo();return;}
 if(e.key.toLowerCase()==='m'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){markVisitorInteraction();SFX.toggleMuted();toastMsg(SFX.muted?'Loom sounds muted':'Loom sounds on',true);return;}
 if(e.key==='?'||e.key.toLowerCase()==='h'){showHelp();return;}
 if(!dialog.hidden)return;
 if(/^[1-6]$/.test(e.key))chooseYarn(+e.key-1);
 if(['q','w','e','r'].includes(e.key.toLowerCase()))pressTreadle(['q','w','e','r'].indexOf(e.key.toLowerCase()));
 if(e.code==='Space'){e.preventDefault();if(S.phase==='shuttle')throwShuttle();else if(S.phase==='beat')beat();}
});
helpBtn.addEventListener('click',showHelp);
// Free exploration camera; drag only the bare scene, not physical-object targets.
let drag=null;
canvas.addEventListener?.('pointerdown',e=>{
 if(!dialog.hidden)return;
 drag={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
 canvas.setPointerCapture?.(e.pointerId);markVisitorInteraction();closeInfo();
});
canvas.addEventListener?.('pointermove',e=>{
 if(!drag || e.pointerId!==drag.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 drag.x=e.clientX;drag.y=e.clientY;r.panPixels?.(dx,dy);markVisitorInteraction();
});
canvas.addEventListener?.('pointerup',()=>{drag=null;});
canvas.addEventListener?.('pointercancel',()=>{drag=null;});
canvas.addEventListener?.('wheel',e=>{
 if(!dialog.hidden)return;
 e.preventDefault?.();r.zoomBy?.(e.deltaY);markVisitorInteraction();
},{passive:false});
canvas.addEventListener?.('dblclick',()=>{r.resetView?.();markVisitorInteraction();});
infoClose?.addEventListener?.('click',()=>{markVisitorInteraction();closeInfo();});
swatchOpen?.addEventListener?.('click',()=>openLiveSwatch());
swatchHide?.addEventListener?.('click',()=>{previewDismissed=true;updateSwatchDock();markVisitorInteraction();});
// Exploration clicks/keystrokes suppress all automatic glimmers for seven seconds.
document.addEventListener?.('pointerdown',()=>markVisitorInteraction(),{passive:true});
document.addEventListener?.('wheel',()=>markVisitorInteraction(),{passive:true});

try{init();}catch(err){fail(err);}
})();
