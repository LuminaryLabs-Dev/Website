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
let r;
try { r=new Renderer(canvas); } catch(err) {
 console.error(err); $('#loading').hidden=true; dialog.hidden=true;
 const fatal=$('#fatal');fatal.hidden=false;fatal.textContent='The 3D loom could not start. WebGL 2 is required for this view. Try a current desktop browser with graphics acceleration enabled.';
 const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.addEventListener('click',()=>window.location.reload());fatal.append(retry);retry.focus?.();return;
}
const FX=window.WovenAttention ? new window.WovenAttention.Attention($('#glimmer'),r):{setFocus(){},burst(){},update(){},resize(){},suspend(){}};
const SFX=window.WovenSound ? new window.WovenSound.SoundBank() : {play(){return false},muted:false,toggleMuted(){this.muted=!this.muted;return this.muted}};
const infoPanel=$('#infoPanel'),infoTitle=$('#infoTitle'),infoText=$('#infoText'),infoClose=$('#infoClose');
const swatchDock=$('#swatchDock'),swatchThumbnail=$('#swatchThumbnail'),swatchName=$('#swatchName'),swatchProgress=$('#swatchProgress'),swatchOpen=$('#swatchOpen'),swatchHide=$('#swatchHide'),marksLayer=$('#patternMarks');
const actionDock=$('#actionDock'),nextAction=$('#nextAction'),actionContext=$('#actionContext'),actionHint=$('#actionHint');
const IDLE_GLIMMER_DELAY_MS=7000;
const workshopBtn=$('#workshopBtn'),orderDock=$('#orderDock'),orderName=$('#orderName'),orderProgress=$('#orderProgress'),orderGoal=$('#orderGoal'),orderRhythm=$('#orderRhythm'),orderBands=$('#orderBands'),orderYarns=$('#orderYarns'),orderYarnLabel=$('#orderYarnLabel'),repeatBand=$('#repeatBand'),pedalControls=$('#pedalControls');
const ORDERS={
 plain:{name:'A place at the table',object:'table runner sample',intro:'A family is setting a new table. Create a balanced striped sample with two yarns of your choice.',lesson:'Plain weave alternates the two sheds. The frequent interlacing forms a balanced fabric.',recipe:'Four bands: A · B · A · B',rhythm:'Alternate the two treadles.',layout:[0,1,0,1],milestones:['Alternating threads lock the first stripe.','Contrasting yarn reveals the stripe boundary.','The first color returns to establish a rhythm.']},
 twill:{name:'The maker’s apron',object:'apron fabric sample',intro:'A maker wants a diagonal pattern for an apron. Experiment with four different yarns.',lesson:'In 2/2 twill, the raised pair shifts each pick. Look for diagonal ribs and longer thread floats.',recipe:'Four bands: A · B · C · D',rhythm:'Cycle through all four treadles in order.',layout:[0,1,2,3],milestones:['The raised pair shifts into a diagonal.','The diagonal continues across a new yarn color.','Longer floats remain visible across the bands.']},
 basket:{name:'The market basket',object:'basket-weave cloth sample',intro:'A market stall needs a cloth with a paired structure. Design a mirrored sample using two yarns.',lesson:'In basket weave, pairs of threads act together. Two consecutive picks use the same shed before switching.',recipe:'Four bands: A · B · B · A',rhythm:'Use each of the first two treadles twice before switching.',layout:[0,1,1,0],milestones:['Paired crossings form larger woven blocks.','The contrasting band makes the paired structure easier to see.','The middle bands match; return to your first color for symmetry.']}
};
const ORDER_KEY='woven-loom-v13-workshop-orders';
const orderJournal={};let order=null;
const orderYarnButtons=[],orderPedals=[],orderBandMarks=[];
function orderRunning(){return !!order && S.pick<16;}
function orderBand(){return Math.min(3,Math.floor(S.pick/4));}
function validOrderRows(key,rows){
 if(!ORDERS[key]||!cleanRows(rows))return false;
 const chosen={};for(let band=0;band<4;band++){
  const col=rows[band*4],slot=ORDERS[key].layout[band];
  if(rows.slice(band*4,band*4+4).some(c=>c!==col))return false;
  if(slot in chosen){if(chosen[slot]!==col)return false;}
  else {if(Object.values(chosen).includes(col))return false;chosen[slot]=col;}
 }return true;
}
function restoreOrders(){try{const data=JSON.parse(window.localStorage?.getItem(ORDER_KEY)||'null');if(data?.version!==1)return;
 for(const key of Object.keys(ORDERS)){const item=data.orders?.[key];if(!item||!validOrderRows(key,item.rows))continue;
  const counts=[item.independent,item.assisted,item.repeated];if(!counts.every(n=>Number.isInteger(n)&&n>=0&&n<=16)||counts.reduce((a,b)=>a+b,0)!==16)continue;
  orderJournal[key]={rows:item.rows.slice(),independent:counts[0],assisted:counts[1],repeated:counts[2]};}
 }catch(_){} }
restoreOrders();
function saveOrders(){try{window.localStorage?.setItem(ORDER_KEY,JSON.stringify({version:1,orders:orderJournal}));}catch(_){} }
function orderRule(){
 const band=orderBand(),slot=ORDERS[order.key].layout[band],past={};
 for(let i=0;i<band;i++)past[ORDERS[order.key].layout[i]]=S.rows[i*4];
 if(S.pick%4!==0){const c=S.rows[band*4];return {colors:[c],text:'Keep '+PALETTE[c].name+' for this band.'};}
 if(slot in past){const c=past[slot];return {colors:[c],text:'Return to '+PALETTE[c].name+' to complete your design.'};}
 const colors=PALETTE.map((_,i)=>i).filter(i=>!Object.values(past).includes(i));
 return {colors,text:band===0?'Choose your first yarn.':'Choose a new, contrasting yarn.'};
}
function orderColorReady(){return !orderRunning() || (order.chosenBand===orderBand() && orderRule().colors.includes(S.selected));}
function orderColorPrompt(){const msg=orderRule().text;toastMsg(msg);announce(msg);}
function initOrderControls(){
 for(let i=0;i<4;i++){const b=document.createElement('span');b.className='orderBand';orderBands.append(b);orderBandMarks.push(b);
  const pedal=document.createElement('button');pedal.type='button';pedal.textContent=String(i+1);pedal.setAttribute('title','Keyboard '+['Q','W','E','R'][i]);pedal.setAttribute('aria-label','Press treadle '+(i+1));pedal.addEventListener('click',()=>{if(dialog.hidden){closeInfo();pressTreadle(i);}});pedalControls.append(pedal);orderPedals.push(pedal);}
 for(let i=0;i<PALETTE.length;i++){const b=document.createElement('button');b.type='button';b.className='orderYarn';b.style.background=PALETTE[i].hex;b.setAttribute('title',PALETTE[i].name);b.setAttribute('aria-label','Select '+PALETTE[i].name);b.addEventListener('click',()=>{if(dialog.hidden)chooseYarn(i);});orderYarns.append(b);orderYarnButtons.push(b);}
}
function canRepeat(){return orderRunning()&&!order.repeatEnd&&!S.anim.length&&S.phase==='treadle'&&S.pick%4!==0&&S.pick>=WEAVES[order.key].sequence.length&&orderColorReady();}
function updateOrderDock(){
 const active=orderRunning(),show=active&&S.started&&dialog.hidden,busy=S.anim.length>0;
 workshopBtn.hidden=!dialog.hidden;workshopBtn.textContent=active?'Order journal':'Workshop orders';
 orderDock.hidden=!show;pedalControls.hidden=!show||S.phase!=='treadle'||busy||!!order?.repeatEnd;
 if(!active){repeatBand.hidden=true;return;}
 const band=orderBand(),rule=orderRule();
 orderName.textContent=ORDERS[order.key].name;orderProgress.textContent=`Band ${band+1} of 4 · ${S.pick}/16 picks`;
 orderGoal.textContent=rule.text;orderRhythm.textContent=WEAVES[order.key].name+' · '+ORDERS[order.key].rhythm+(S.pick<WEAVES[order.key].sequence.length?' Complete one full rhythm to unlock repeat.':'');orderYarnLabel.textContent=order.chosenBand===band?'Selected: '+PALETTE[S.selected].name:'Select a yarn to begin this band.';
 orderBandMarks.forEach((b,i)=>{b.textContent=String(i+1);b.classList.toggle('done',S.pick>=(i+1)*4);b.classList.toggle('current',i===band);const c=S.rows[i*4];b.style.background=Number.isInteger(c)?PALETTE[c].hex:'';});
 orderYarnButtons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(order.chosenBand===band&&S.selected===i));b.disabled=busy||S.phase!=='treadle'||!!order.repeatEnd;});
 orderPedals.forEach((b,i)=>{b.disabled=busy||!!order.repeatEnd;b.classList.toggle('clued',order.hint&&i===indexOfShed());});
 repeatBand.hidden=!order.repeatEnd&&!canRepeat();repeatBand.textContent=order.repeatEnd?(order.stopRepeat?'Stopping after this pick…':'Stop after this pick'):`Finish band · ${4-S.pick%4} more picks`;
 repeatBand.disabled=!!order.stopRepeat;
}
function showOrders(){
 if(S.anim.length){recoverAction();return;}
 const cards=Object.entries(ORDERS).map(([key,b])=>`<div class="orderCard"><strong>${b.name}</strong><span>${WEAVES[key].name} · ${b.recipe}</span><p>${b.intro}</p><p>${b.rhythm}</p>${orderJournal[key]?'<span class="orderSeal">Order fulfilled</span>':''}</div>`).join('');
 popup('The workshop ledger',`<p>You are the weaver in a fictional small workshop. Choose an order, design four bands of yarn, and learn the pattern by operating the loom. Demonstrate a complete treadle rhythm to unlock faster repeats. No timer or penalty for asking for help.</p><div class="orderCards">${cards}</div><p class="subtext">${Object.keys(orderJournal).length} of 3 workshop seals earned on this device. Finished orders and your unfinished cloth are saved on this device when browser storage is available.</p>`,[
  ...(S.started?[{label:orderRunning()?'Resume current order':'Return to the loom',fn:closePopup}]:[]),
  ...Object.entries(ORDERS).map(([key,b])=>({label:(orderJournal[key]?'Weave again: ':'Take order: ')+b.name,fn:()=>confirmOrder(key)})),
  {label:'Finished orders',secondary:true,fn:showOrderJournal},
  {label:'Free weaving',secondary:true,fn:()=>confirmOrder(null)},
  ...(!S.started?[{label:'Start guided tutorial',secondary:true,fn:()=>{order=null;startLoom();}}]:[])
 ]);
}
function confirmOrder(key){
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'){closePopup();recoverAction();return;}
 if(orderRunning()&&key===order.key){closePopup();return;}
 if(S.pick>0&&S.pick<16||orderRunning()){
  popup('Start a different project?',`<p>This will discard the unfinished ${S.pick}-pick sample. Finished samples and workshop seals stay saved.</p>`,[{label:'Keep current cloth',fn:closePopup},{label:key?'Start new order':'Switch to free weaving',secondary:true,fn:()=>beginOrder(key)}]);return;
 }
 beginOrder(key);
}
function beginOrder(key){
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'||(key!==null&&!ORDERS[key]))return;
 order=null;tutorial.active=false;controlsVisible=true;applyGuidancePresentation();S.started=true;
 if(key){S.pattern=key;S.patternIndex=WEAVES[key].index;order={key,chosenBand:-1,hint:false,independent:0,assisted:0,repeated:0,kind:'independent',repeatEnd:0,stopRepeat:false};}
 resetSample(true);startLoom();
 if(order){toastMsg('New order: '+ORDERS[key].name);announce(ORDERS[key].intro+' '+ORDERS[key].recipe+'. Choose yarn for band one.');}
}
function revealOrderClue(){
 if(!orderRunning()||S.phase!=='treadle'||S.anim.length)return;
 if(!orderColorReady()){orderColorPrompt();return;}
 order.hint=true;const msg=ORDERS[order.key].rhythm+' Next: treadle '+(indexOfShed()+1)+'.';toastMsg(msg);announce(msg);updateTargets();
}
function repeatCurrentBand(){
 if(order?.repeatEnd){order.stopRepeat=true;updateOrderDock();return;}
 if(!canRepeat())return;
 order.repeatEnd=Math.min(16,4*(orderBand()+1));order.stopRepeat=false;toastMsg('Repeating the remaining picks in this band.');driveRepeat();
}
function driveRepeat(){
 if(!order?.repeatEnd||S.anim.length)return false;
 if(S.phase==='complete'||S.phase==='treadle'&&(S.pick>=order.repeatEnd||order.stopRepeat)){
  order.repeatEnd=0;order.stopRepeat=false;updateTargets();return false;
 }
 if(S.phase==='treadle')pressTreadle(indexOfShed(),true);else if(S.phase==='shuttle')throwShuttle();else if(S.phase==='beat')beat();
 return true;
}
function recordOrderPick(){
 if(!order)return;
 order[order.kind]++;order.hint=false;
 if(S.pick===16&&validOrderRows(order.key,S.rows)){
  orderJournal[order.key]={rows:S.rows.slice(),independent:order.independent,assisted:order.assisted,repeated:order.repeated};saveOrders();
 }
}
function presentOrder(key,sample){
 const b=ORDERS[key],data=swatchDataURL(key,sample.rows),colors=[...new Set(sample.rows.map(i=>PALETTE[i].name))].join(', ');
 popup('Order fulfilled — '+b.name,`<p class="orderSeal">WORKSHOP SEAL · ${Object.keys(orderJournal).length}/3</p><figure class="swatchFigure"><img src="${data}" alt="Your finished ${WEAVES[key].name} sample" width="728" height="256"><figcaption>${b.object} · ${b.recipe}</figcaption></figure><p>${b.lesson} Your yarn choices: ${colors}.</p><div class="orderStats"><span><strong>${sample.independent}</strong> independent picks</span><span><strong>${sample.assisted}</strong> with clues</span><span><strong>${sample.repeated}</strong> repeated</span></div><p class="subtext">This is a teaching sample from a fictional commission. The interlacing principle also underlies mechanized textile production, including Manchester’s mills.</p>`,[
  {label:'Choose another order',fn:showOrders},{label:'Save sample PNG',secondary:true,fn:()=>downloadSwatch(key,sample.rows)},{label:'Back to the loom',secondary:true,fn:closePopup},{label:'Manchester textile history',secondary:true,fn:showManchester}]);
}
function showOrderJournal(){const keys=Object.keys(orderJournal);
 popup('Your workshop journal',`<p>${keys.length} of 3 workshop seals earned. Compare your own patterns, or try an order again with new yarns.</p>${keys.map(key=>`<figure class="journalSwatch"><img src="${swatchDataURL(key,orderJournal[key].rows)}" alt="${WEAVES[key].name} sample"><figcaption>${ORDERS[key].name} · ${orderJournal[key].independent} independent picks</figcaption></figure>`).join('')||'<p>No finished orders yet. The first one is yours to choose.</p>'}`,[
 ...keys.map(key=>({label:'View '+ORDERS[key].name,fn:()=>presentOrder(key,orderJournal[key])})),{label:'Back to orders',secondary:true,fn:showOrders}]);
}

let controlsVisible=true,previousFocus=null;
let lastVisitorInteraction=performance.now(),attentionShown=false,lastCueSignature='',pendingFocus=[];
const visitedInfo=new Set();
let inspectorTimer=null;

const TUTORIAL_KEY='woven-loom-v7-guided-pick-complete';
let previousTutorial=false;
try{previousTutorial=window.localStorage?.getItem(TUTORIAL_KEY)==='1';}catch(_){};
const tutorial={active:!previousTutorial,step:0,completed:previousTutorial};
const TUTORIAL_STEPS=[
  {kind:'treadle',anchor:'treadle',title:'Open the shed',instruction:'Separate the warp threads.'},
  {kind:'shuttle',anchor:'shuttle',title:'Pass the shuttle',instruction:'Carry the weft across the opening.'},
  {kind:'beater',anchor:'beater',title:'Beat the weft',instruction:'Pack the new thread into the cloth.'}
];
function applyGuidancePresentation(){
 document.body?.classList?.toggle('freeWeaving', !tutorial.active);
}
const CHECKPOINT_KEY='woven-loom-v14-checkpoint';
const S={phase:'choose',pattern:'plain',selected:0,pick:0,rows:[],shedAmount:0,liftMask:0,patternIndex:0,anim:[],direction:1,started:false,heldTreadle:-1,weft:{progress:0,y:1.34,direction:1,startY:.57,color:[.5,.15,.13]}};
r.game=S;
const reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let checkpointReady=false;
function saveCheckpoint(){
 if(!checkpointReady)return;
 try{
  if(!S.started||S.pick===16){window.localStorage?.removeItem(CHECKPOINT_KEY);return;}
  const activeOrder=order?{key:order.key,chosenBand:order.chosenBand,independent:order.independent,assisted:order.assisted,repeated:order.repeated}:null;
  window.localStorage?.setItem(CHECKPOINT_KEY,JSON.stringify({version:1,pattern:S.pattern,selected:S.selected,rows:S.rows.slice(),order:activeOrder}));
 }catch(_){}
}
function restoreCheckpoint(){
 try{
  const d=JSON.parse(window.localStorage?.getItem(CHECKPOINT_KEY)||'null');
  if(d?.version!==1||!Object.hasOwn(WEAVES,d.pattern)||!Number.isInteger(d.selected)||d.selected<0||d.selected>=PALETTE.length||!Array.isArray(d.rows)||d.rows.length>=16||!d.rows.every(v=>Number.isInteger(v)&&v>=0&&v<PALETTE.length))return false;
  const counts=d.order?[d.order.independent,d.order.assisted,d.order.repeated]:[];
  if(d.order){
   if(d.order.key!==d.pattern||!Object.hasOwn(ORDERS,d.order.key)||!counts.every(v=>Number.isInteger(v)&&v>=0&&v<=16)||counts.reduce((a,b)=>a+b,0)!==d.rows.length)return false;
   const chosen={};for(let i=0;i<d.rows.length;i++){
    const slot=ORDERS[d.order.key].layout[Math.floor(i/4)],c=d.rows[i];
    if(Object.hasOwn(chosen,slot)){if(chosen[slot]!==c)return false;}
    else{if(Object.values(chosen).includes(c))return false;chosen[slot]=c;}
   }
   const band=Math.floor(d.rows.length/4);if(!Number.isInteger(d.order.chosenBand)||d.order.chosenBand< -1||d.order.chosenBand>band)return false;
   order={key:d.order.key,chosenBand:d.order.chosenBand,independent:counts[0],assisted:counts[1],repeated:counts[2],hint:false,kind:'independent',repeatEnd:0,stopRepeat:false};
  }
  S.pattern=d.pattern;S.patternIndex=WEAVES[d.pattern].index;S.selected=d.selected;S.rows=d.rows.slice();S.pick=S.rows.length;S.direction=S.pick%2?-1:1;S.started=true;S.phase='treadle';
  if(order){tutorial.active=false;const band=orderBand();if(order.chosenBand===band&&!orderRule().colors.includes(S.selected))order.chosenBand=-1;}
  else if(S.pick){tutorial.active=false;}
  return true;
 }catch(_){return false;}
}
const els=new Map();
const anchors=new Map();
const colorCanvas=document.createElement('canvas');colorCanvas.width=728;colorCanvas.height=256;
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
 treadle:{title:'Treadles and shafts',text:'The wooden pedals select groups of warp ends. In this vertical teaching loom the guide eyes separate those groups front to back while the top and cloth edge stay fixed. The simplified four-shaft control illustrates a shed, not a historical treadle linkage.'},
 shuttle:{title:'The shuttle',text:'A shuttle carries the weft from one side of the loom to the other through the opened shed. It returns on the next pick, so the cloth grows as a continuous sequence of crossings.'},
 beater:{title:'The reed and beater',text:'After a shuttle pass, the reed pushes the new weft against the growing edge of the fabric, called the fell. This packs the picks together and gives the cloth its structure.'},
 warp:{title:'Warp: the lengthwise threads',text:'The warp runs lengthwise, held under tension across the loom. Alternating raised warp groups create the openings needed to interlace a continuous weft. The threads are intentionally shown spaced apart so you can study the mechanism.'},
 cloth:{title:'Your growing cloth',text:'Each packed shuttle pass adds one pick of weft. The visible crossing order is determined by the selected weave structure and treadle sequence. Try changing yarn colors between picks and watch the fabric develop.'},
 basket:{title:'The yarn basket',text:'A working weaver keeps prepared yarn near the loom. In this activity, six original dyed or natural yarn choices let you experiment with color. Cotton, wool, and linen have different properties, though this is a simplified teaching model.'},
 frame:{title:'The loom frame',text:'The wooden frame supports the beams, reed, warp, and mechanism that keep threads aligned and tensioned. A handloom is operated directly by a person. Manchester’s large textile factories used mechanized and powered equipment.'},
 roller:{title:'Rollers and tension',text:'Loom beams store or take up yarn and cloth. Controlled tension matters: uneven warp tension can interfere with a clean shed and the regular packing of weft picks.'},
 ratchet:{title:'The ratchet mechanism',text:'Ratchet teeth can prevent a rotating beam from turning backward. Such mechanisms help hold a chosen tension as weaving progresses. This model illustrates the principle rather than reproducing a museum machine exactly.'},
 reed:{title:'The reed',text:'The reed separates and guides the warp ends. On this vertical teaching loom its complete frame and teeth travel down together, pushing the new weft toward the growing cloth edge before returning to rest.'},
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
 inspectorTimer=null; // Let visitors finish reading at their own pace.
 if(always)SFX.play('inspect');
 announce(info.title+'. '+info.text);
}
function hushHintsUntilIdle(now){
 const inactive=reducedMotion || !S.started || S.anim.length>0 || !dialog.hidden || (infoPanel && !infoPanel.hidden) || now-lastVisitorInteraction<IDLE_GLIMMER_DELAY_MS;
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
const reedNames=['Reed frame','Reed frame.001','Reed edge','Reed edge.001','Reed edge.002','Reed edge.003','Reed threads','V12 reed carriage'];
const shuttleNames=['Shuttle body','Shuttle bobbin'];
function announce(str){$('#announcer').textContent=str;}
function toastMsg(str){toast.textContent=str;toast.classList.add('visible');clearTimeout(toastMsg.t);toastMsg.t=setTimeout(()=>toast.classList.remove('visible'),2400);}
function anim(dur,onMove,onDone=()=>{}){S.anim.push({duration:reducedMotion?Math.min(.15,dur):dur,age:0,onMove,onDone});}
function ease(t){return t*t*(3-2*t)}
function nextTutorialStage(expected){
 if(!tutorial.active||TUTORIAL_STEPS[tutorial.step]?.kind!==expected)return;
 tutorial.step=Math.min(2,tutorial.step+1);
}
function completeTutorial(){
 if(!tutorial.active||tutorial.step!==2)return;
 tutorial.step=3;tutorial.active=false;tutorial.completed=true;
 try{window.localStorage?.setItem(TUTORIAL_KEY,'1')}catch(_){}
 applyGuidancePresentation();
 r.resetView?.();toastMsg('First pick complete. Keep weaving!');announce('First guided pick complete. Keep weaving with the next action, or explore the workshop.');
 // Attention is deliberately delayed after every visitor interaction.
}
function replayTutorial(){
 if(orderRunning()){closePopup();revealOrderClue();return;}
 if(S.anim.length){closePopup();recoverAction();return;}
 markVisitorInteraction();closeInfo();closePopup();S.started=true;tutorial.active=true;controlsVisible=true;
 if(S.phase==='complete'){resetSample(true);}
 if(S.phase==='choose')S.phase='treadle';
 tutorial.step=S.phase==='shuttle'?1:S.phase==='beat'?2:0;
 applyGuidancePresentation();updateTargets();
 announce('Guidance resumed. Your current cloth is preserved. '+nextActionSpec().hint);
}
function nextActionSpec(){
 if(S.phase==='complete')return {label:'View finished fabric',hint:'Your 16-pick sample is complete.',run:openLiveSwatch};
 if(orderRunning()&&S.phase==='treadle'&&!order.hint)return {label:'Reveal treadle',hint:orderColorReady()?'Choose the treadle yourself, or request a clue.':'Select a yarn for the current band first.',run:revealOrderClue};
 if(S.phase==='shuttle')return {label:'Pass the shuttle',hint:'Carry the weft through the open shed.',run:throwShuttle};
 if(S.phase==='beat')return {label:'Beat the weft',hint:'Pack the new thread into your cloth.',run:beat};
 return {label:'Open shed · Treadle '+(indexOfShed()+1),hint:'Separate the warp threads.',run:()=>pressTreadle(indexOfShed())};
}
function updateActionDock(){
 const spec=nextActionSpec(), moving=S.anim.length>0;
 actionDock.hidden=!S.started||!dialog.hidden||!controlsVisible;
 actionContext.textContent=(tutorial.active?(S.pick===0?'FIRST PICK':'GUIDED PICK')+' · '+(tutorial.step+1)+'/3':WEAVES[S.pattern].name)+' · '+PALETTE[S.selected].name;
 actionHint.textContent=moving?'Let the loom finish moving.':spec.hint;
 nextAction.textContent=moving?'Moving…':spec.label;
 nextAction.setAttribute('aria-disabled',String(moving));
 updateOrderDock();
}
function recoverAction(){
 if(S.anim.length){toastMsg('Let the loom finish moving.');return;}
 if(orderRunning()&&S.phase==='treadle'){const msg=orderColorReady()?'Try a treadle from the pattern rhythm, or reveal a clue.':orderRule().text;toastMsg(msg);announce(msg);return;}
 const spec=nextActionSpec();toastMsg('Next: '+spec.label);announce('Next: '+spec.label+'. '+spec.hint);
}
function startLoom(){S.started=true;if(S.phase==='choose')S.phase='treadle';closePopup();updateTargets();saveCheckpoint();(controlsVisible?nextAction:helpBtn).focus?.({preventScroll:true});}
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
 const xN=91,yN=16,cellX=w/xN,cellY=h/yN;
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
 const c=document.createElement('canvas');c.width=728;c.height=256;
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
 popup(titleText,`<figure class="swatchFigure"><img src="${data}" alt="Woven ${weave.name} textile preview" width="728" height="256"><figcaption>${finished?'Finished fabric':'Live sample'} · ${rows.length} picks</figcaption></figure><p>${descriptive}</p><p><strong>Weft yarn:</strong> ${colors||'No yarn yet'}</p><p class="subtext">This enlarged preview uses the same weave calculation and yarn colors as the fabric on the loom.</p>`,[
  {label:'Back to the loom',fn:closePopup},
  ...(finished && !orderRunning() && (S.phase==='complete'||S.pick===0 && S.phase==='treadle')?[{label:'Weave another',secondary:true,fn:()=>{closePopup();if(S.anim.length){recoverAction();return;}resetSample(false);}}]:[]),
  {label:'Save sample PNG',secondary:true,fn:()=>downloadSwatch(pattern,rows)},
  {label:'Explore the pattern',secondary:true,fn:()=>{closePopup();const id='sample_'+pattern;const def=definitions.find(d=>d.id===id);if(def)showInfo(def,true);}}
 ]);
}
function downloadSwatch(pattern,rows){
 const data=swatchDataURL(pattern,rows);const a=document.createElement('a');a.href=data;a.download=`Woven-${pattern}-${rows.length}-picks.png`;a.click();
}
function openCompletedSwatch(pattern){
 if(order&&S.anim.length){recoverAction();return false;}
 const sample=completedSwatches[pattern];if(!sample)return false;
 markVisitorInteraction();SFX.play('inspect');presentSwatch(pattern,sample.rows,true);return true;
}
function openLiveSwatch(){
 if(S.anim.length){recoverAction();return;}
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

function modalBackground(inert){
 for(const el of Array.from(dialog.parentElement?.children||[]))if(el!==dialog&&el.id!=='loading'&&el.id!=='fatal')el.inert=inert;
}
function popup(heading,text,buttons){
 if(dialog.hidden)previousFocus=document.activeElement;
 closeInfo();markVisitorInteraction();
 title.textContent=heading;body.innerHTML=text;actions.replaceChildren();
 for(const cfg of buttons){const b=document.createElement('button');b.textContent=cfg.label;if(cfg.secondary)b.classList.add('secondary');b.addEventListener('click',cfg.fn);actions.append(b);}
 dialog.hidden=false;dialog.setAttribute('aria-hidden','false');modalBackground(true);updateActionDock();
 actions.children[0]?.focus?.();
}
function closePopup(){dialog.hidden=true;dialog.setAttribute('aria-hidden','true');modalBackground(false);markVisitorInteraction();updateActionDock();if(previousFocus?.isConnected&&!previousFocus.hidden)previousFocus.focus?.();else if(S.started)(controlsVisible?nextAction:helpBtn).focus?.();previousFocus=null;}
function savePNG(){downloadSwatch(S.pattern,S.rows);}
// Original teaching loom has a vertical warp; all distances use its actual GLB units.
const FELL_BASE=.57,FELL_HEIGHT=.58,REED_REST=1.48,SHUTTLE_Y=1.34,SHUTTLE_X=1.74,WARP_EDGE=1.63;
const fellY=()=>FELL_BASE+FELL_HEIGHT*S.pick/16;
function pedal(index,amount){
 const name=nameForTreadle(index),pin='Treadle pin'+(index?'.'+String(index).padStart(3,'0'):'');
 const angle=.064*amount,c=Math.cos(angle),si=Math.sin(angle);
 // Rotate each linked part about the fixed rear bearing, not its mesh center.
 for(const [part,y,z] of [[name,.065,.72],[pin,.11,1.16]]){
  const a=y-.019,b=z-.20;move([part],'rx',angle);move([part],'dy',.025+a*(c-1)-b*si);move([part],'dz',a*si+b*(c-1));
 }
}
function resetTreadles(){for(let i=0;i<4;i++)pedal(i,0);S.heldTreadle=-1;}
function reedAt(lower){
 // All six frame pieces and the originally misaligned reed teeth move together.
 move(reedNames.filter(name=>name!=='Reed threads'),'dy',lower-1.16);
 move(['Reed threads'],'dy',lower-.57);move(reedNames,'dz',0);
}
function shuttleAt(x){move(shuttleNames,'dx',x+1.35);move(shuttleNames,'dy',SHUTTLE_Y-1.79);move(['Shuttle body'],'dz',.175-.36);move(['Shuttle bobbin'],'dz',.247-.44);}
function threadColor(index){const h=PALETTE[index].hex;return [1,3,5].map(i=>Math.pow(parseInt(h.slice(i,i+2),16)/255,2.2));}
function resetMechanics(){resetTreadles();S.shedAmount=0;S.liftMask=0;S.weft={progress:0,y:SHUTTLE_Y,direction:S.direction,startY:fellY(),color:threadColor(S.selected)};reedAt(REED_REST);shuttleAt(S.direction===1?-SHUTTLE_X:SHUTTLE_X);}
function resetSample(keepColor=true){S.direction=1;S.pick=0;S.rows=[];S.anim=[];resetMechanics();
 previewDismissed=false;
 S.phase=S.started?'treadle':'choose';repaintCloth();updateTargets();saveCheckpoint();}
function changePattern(value){markVisitorInteraction();if(!WEAVES[value])return;
 if(orderRunning()){toastMsg('This order uses '+WEAVES[order.key].name+'. Use the order journal to switch projects.');return;}
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'){recoverAction();return;}
 S.pattern=value;S.patternIndex=WEAVES[value].index;resetSample(true);
 SFX.play('pattern');toastMsg(WEAVES[value].name+' selected');announce('Selected '+WEAVES[value].name+'; new fabric ready.');}
function chooseYarn(value){
 markVisitorInteraction();if(!Number.isInteger(value)||value<0||value>=PALETTE.length)return;
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'){recoverAction();return;}
 S.selected=value;S.started=true;
 if(orderRunning()){order.chosenBand=orderBand();}
 if(S.phase==='complete')resetSample(true);
 else if(S.phase==='choose')S.phase='treadle';
 SFX.play('yarn');toastMsg(PALETTE[value].name+' yarn');saveCheckpoint();
 if(orderRunning()&&!orderColorReady()){orderColorPrompt();updateTargets();return;}
 announce(PALETTE[value].name+' selected. '+nextActionSpec().label+'.');updateTargets();
}
function pressTreadle(value,automatic=false){
 markVisitorInteraction();if(S.anim.length||S.phase!=='treadle'||value!==indexOfShed()||(order?.repeatEnd&&!automatic)){recoverAction();return;}
 if(orderRunning()){if(!orderColorReady()){orderColorPrompt();return;}order.kind=automatic?'repeated':order.hint?'assisted':'independent';}
 resetTreadles();S.heldTreadle=value;S.liftMask=currentLiftMask();S.shedAmount=0;
 S.weft={progress:0,y:SHUTTLE_Y,direction:S.direction,startY:fellY(),color:threadColor(S.selected)};
 anim(.40,t=>{const p=ease(t);pedal(value,p);S.shedAmount=p;},()=>{pedal(value,1);S.shedAmount=1;});
 S.phase='shuttle';SFX.play('treadle');nextTutorialStage('treadle');toastMsg('Shed opening');announce('The selected warp groups separate. Pass the shuttle when the shed is open.');updateTargets();
}
function throwShuttle(){
 markVisitorInteraction();if(S.anim.length||S.phase!=='shuttle'){recoverAction();return;}
 const direction=S.direction,start=-direction*SHUTTLE_X,finish=direction*SHUTTLE_X;
 anim(.76,t=>{const x=start+(finish-start)*ease(t);shuttleAt(x);S.weft.progress=Math.max(0,Math.min(1,(direction*x+WARP_EDGE)/(2*WARP_EDGE)));},()=>{shuttleAt(finish);S.weft.progress=1;S.direction=-direction;});
 S.phase='beat';SFX.play('shuttle');nextTutorialStage('shuttle');toastMsg('Shuttle passing');announce('The shuttle carries the selected weft through the open shed. Beat the weft against the woven edge.');updateTargets();
}
function beat(){
 markVisitorInteraction();if(S.anim.length||S.phase!=='beat'){recoverAction();return;}
 const nextFell=FELL_BASE+FELL_HEIGHT*(S.pick+1)/16,contact=nextFell+.052,held=S.heldTreadle;
 let packed=false;
 function pack(){
  if(packed)return;packed=true;
  // One logical pick, one physical contact. Update cloth and saved samples only here.
  S.rows.push(S.selected);S.pick=S.rows.length;recordOrderPick();S.weft.progress=0;S.shedAmount=0;S.liftMask=0;repaintCloth();
  SFX.play('beater');
  if(S.pick>=16){S.phase='complete';recordCompletedSwatch();}
  else{S.phase='treadle';toastMsg(order&&S.pick%4===0?`Band ${S.pick/4} complete. ${ORDERS[order.key].milestones[S.pick/4-1]}`:`Pick ${S.pick} woven`);}
  announce('Pick '+S.pick+' woven. '+(S.pick>=16?'Your sample is complete.':order&&S.pick%4===0?ORDERS[order.key].milestones[S.pick/4-1]+' Choose the next band’s yarn.':'Now choose the next treadle.'));
  completeTutorial();saveCheckpoint();updateTargets();
 }
 anim(.74,t=>{
  const approach=Math.min(1,t/.60),p=ease(approach);
  const lower=t<=.60?REED_REST+(contact-REED_REST)*p:contact+(REED_REST-contact)*ease((t-.60)/.40);
  reedAt(lower);
  if(!packed){
   S.weft.y=Math.max(nextFell,Math.min(SHUTTLE_Y,lower-.052));
   // Keep the shed open through travel; close it gradually as the pick reaches the fell.
   S.shedAmount=1-ease(Math.max(0,(approach-.20)/.80));if(held>=0)pedal(held,S.shedAmount);
   if(t>=.60)pack();
  }
 },()=>{pack();reedAt(REED_REST);resetTreadles();S.shedAmount=0;S.liftMask=0;});
 updateTargets();
}
function finishSample(){
 SFX.play('complete');
 if(order){const key=order.key,sample=orderJournal[key];order=null;updateTargets();if(sample){presentOrder(key,sample);return;}}
 // Showcase the actual 16-pick cloth. The sample is already stored and checked.
 const saved=completedSwatches[S.pattern];
 if(saved)presentSwatch(S.pattern,saved.rows,true);
}

function exitGuidedMode(){
 markVisitorInteraction();tutorial.active=false;tutorial.completed=true;
 try{window.localStorage?.setItem(TUTORIAL_KEY,'1')}catch(_){}
 applyGuidancePresentation();startLoom();
 announce('Explore freely. Use the next action whenever you are ready to weave.');
}
function selectPatternFromMenu(key){
 if(orderRunning()){closePopup();toastMsg('Finish this order or switch projects in the order journal.');return;}
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'){closePopup();recoverAction();return;}
 if(S.pattern===key&&S.pick>0&&S.pick<16){closePopup();toastMsg('Already weaving '+WEAVES[key].name);return;}
 const apply=()=>{closePopup();changePattern(key);};
 if(S.pick>0&&S.pick<16){popup('Start a new pattern?',`<p>Your current ${S.pick}-pick sample will restart.</p>`,[{label:'Keep current cloth',fn:closePopup},{label:'Start new pattern',secondary:true,fn:apply}]);}
 else apply();
}
function showChoices(){
 popup('Pattern and yarn',`<p>Choose a pattern to begin a new sample, or a yarn for your next pick. Finish any open pick before changing.</p>`,[
  ...Object.entries(WEAVES).map(([key,w])=>({label:w.name,fn:()=>selectPatternFromMenu(key)})),
  ...PALETTE.map((color,i)=>({label:color.name,secondary:true,fn:()=>{closePopup();chooseYarn(i);}})),
  {label:'Back to help',secondary:true,fn:showHelp}
 ]);
}
function showManchester(){
 popup('From hand weaving to Manchester’s mills',`<p>In this activity you operate a simplified handloom. A real loom holds the lengthwise warp under tension, creates a shed and packs each crosswise weft into the cloth.</p><p>Manchester’s Amoskeag Manufacturing Company used powered industrial machinery. The Manchester Historic Association’s company records describe power looms introduced in 1819 and preserve fabric sample books from 1893–1924.</p><p>Your fictional order demonstrates interlacing, not the speed, working conditions, or exact machinery of an Amoskeag mill. The 16 picks are a sample, not a completed full-size textile. In actual weaving, the cloth must be secured, removed and finished.</p><p><strong>Read more:</strong> <a href="https://manchesterhistoric.org/millyard-museum-2/" target="_blank" rel="noopener noreferrer">Millyard Museum</a> · <a href="https://manchesterhistoric.org/wp-content/uploads/2023/01/Amoskeag.pdf" target="_blank" rel="noopener noreferrer">Amoskeag records finding aid</a> · <a href="https://schachtspindle.com/blogs/faqs/weaving-terms" target="_blank" rel="noopener noreferrer">Weaving terms</a>.</p><p class="subtext">Independent Luminary Labs educational prototype. No museum endorsement or historical machine reconstruction is implied.</p>`,[{label:'Back to help',fn:showHelp},{label:'Return to the loom',secondary:true,fn:closePopup}]);
}
function confirmRestart(){
 if(S.anim.length||S.phase==='shuttle'||S.phase==='beat'){closePopup();recoverAction();return;}
 popup('Restart this sample?',`<p>Your current unfinished cloth will be cleared. Saved swatches and completed workshop seals remain available.</p>`,[{label:'Keep current cloth',fn:closePopup},{label:'Restart sample',secondary:true,fn:()=>{if(orderRunning())beginOrder(order.key);else{resetSample(true);startLoom();}}}]);
}
function showHelp(){
 if(order&&S.anim.length){recoverAction();return;}
 markVisitorInteraction();SFX.play('inspect');
 const muteLabel=SFX.muted?'Turn loom sounds on':'Mute loom sounds';
 const buttons=[
  {label:S.started?'Return to the loom':'Begin weaving',fn:startLoom},
  {label:orderRunning()?'Reveal next treadle':tutorial.active?'Explore freely':'Guide the next pick',secondary:true,fn:tutorial.active?exitGuidedMode:replayTutorial},
  {label:'Workshop orders',secondary:true,fn:showOrders},
  {label:'Choose pattern or yarn',secondary:true,fn:showChoices},
  {label:controlsVisible?'Hide action controls':'Show action controls',secondary:true,fn:()=>{controlsVisible=!controlsVisible;showHelp();}},
  {label:muteLabel,secondary:true,fn:()=>{SFX.toggleMuted();showHelp();}},
  {label:'Manchester textile history',secondary:true,fn:showManchester},
  {label:'Restart current sample',secondary:true,fn:confirmRestart}
 ];
 popup('Explore the loom',`${orderRunning()?'<p><strong>Workshop order:</strong> Follow the four-band recipe, use the numbered pedals or the loom objects, and request a treadle clue only when you want one. Demonstrate one full treadle rhythm to unlock repeats. In later bands, make at least one pick yourself before repeating. Use the order journal to change projects.</p>':''}<p>Weave using the physical objects, or use the <strong>next-action button</strong>. Choose a framed pattern or yarn before opening a shed.</p><ol><li>Open the shed with the indicated treadle.</li><li>Pass the shuttle through the warp.</li><li>Beat the weft into the cloth.</li></ol><p>Use <strong>Space</strong> for the next action, <strong>1–6</strong> for yarn, <strong>Q/W/E/R</strong> for the treadles, <strong>M</strong> for mute and <strong>F</strong> for fullscreen. Drag empty space to look around, scroll to zoom, and double-click to reset your view.</p><p>Click an idle object or right-click it for a workshop note. Use Help to select a pattern or yarn without finding its object. Your 16-pick samples are saved locally and can be opened using their check marks.</p><p class="subtext">An educational handloom interpretation, not a reconstruction of a specific museum machine.</p>`,buttons);
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
   if(def.kind==='explore'){showInfo(def,true);return;}
   if(!canAct){recoverAction();showInfo(def,true);return;}
   // A finished pattern's frame is an invitation to inspect it again; the
   // adjacent check mark can open it even while weaving a different pattern.
   if(def.kind==='pattern'&&!tutorial.active&&S.pattern===def.id.slice(7)&&S.phase==='complete'&&completedSwatches[S.pattern]){
     openCompletedSwatch(S.pattern);return;
   }
   // Inspecting a sample should never destroy work in progress without notice.
   if(def.kind==='pattern'&&orderRunning()){showInfo(def,true);return;}
   if(def.kind==='pattern'&&S.pick>0&&S.pick<16){
     const newKey=def.id.replace('sample_','');
     if(newKey===S.pattern){showInfo(def,true);return;}
     const note=noteFor(def);
     popup('Try '+note.title+'?',`<p>${note.text}</p><p><strong>Switching will restart your current ${S.pick}-pick sample.</strong> You can keep weaving instead.</p>`,[
      {label:'Keep my current cloth',fn:closePopup},
      {label:'Start new pattern',secondary:true,fn:()=>{closePopup();def.action();showInfo(def,true);}}
     ]);
     return;
   }
   // Working objects perform their action; workshop notes remain opt-in.
   closeInfo();def.action(); // Working parts stay unobstructed; notes are opt-in.
   button.classList.remove('clicked');void button.offsetWidth;button.classList.add('clicked');
  };
  button.addEventListener('contextmenu',e=>{e?.preventDefault?.();markVisitorInteraction();showInfo(def,true);});
  overlay.append(button);els.set(def.id,button);
 }
}
const allowedTarget=def=>{
 if(def.kind==='help'||def.kind==='explore')return true;
 if(S.anim.length)return false;
 if(def.kind==='pattern'||def.kind==='yarn')return S.phase==='choose'||S.phase==='treadle'||S.phase==='complete';
 if(def.kind==='treadle')return S.phase==='treadle' && (orderRunning() || +def.id.slice(7)===indexOfShed());
 if(def.kind==='shuttle')return S.phase==='shuttle';
 if(def.kind==='beater')return S.phase==='beat';
 return false;
};
function updateTargets(){
 const focus=[];
 for(const def of definitions){
  const button=els.get(def.id);if(!button)continue;
  const valid=allowedTarget(def);
  const highlight=valid && (def.kind==='treadle'||def.kind==='shuttle'||def.kind==='beater') && (!orderRunning()||def.kind!=='treadle'||(order.hint&&+def.id.slice(7)===indexOfShed()));
  button.classList.toggle('active',!!highlight);button.classList.toggle('dim',!valid);
  button.classList.toggle('selected',def.kind==='pattern'&&def.id==='sample_'+S.pattern||def.kind==='yarn'&&def.id==='yarn'+S.selected);
  button.disabled=false; // every physical hotspot can open an information note
  const node=n(def.name);
  if(node){node.highlight=0;node.dim=1;}
  if(highlight && node)focus.push({name:def.name,color:def.kind==='yarn'?'#f5d3ab':def.kind==='pattern'?'#b6d9ed':'#ffe6a7',radius:def.kind==='pattern'?38:26});
 }
 // The material shimmer and canvas motes follow the same state as pointer events.
 pendingFocus=focus;
 FX.suspend?.();attentionShown=false;lastCueSignature='';
 const target=definitions.find(d=>els.get(d.id)?.classList.contains('active'));
 if(target && tutorial.active && S.started)r.focusOn?.(target.name);
 $('#status').textContent=nextActionSpec().label;
 bubble.textContent='';bubble.hidden=true;
 $('#pickCount').textContent=String(S.pick).padStart(2,'0');
 updateActionDock();
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
 button.hidden=s.x<0||s.y<0||s.x>canvas.clientWidth||s.y>canvas.clientHeight;button.style.left=s.x+'px';button.style.top=s.y+'px';}
 // The compact fixed control keeps instructions readable even when the target is off-screen.
 bubble.hidden=true;
 layOutPatternMarks();
}
let initialized=false;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-tick)/1000));tick=now;
 const hadMotion=S.anim.length>0;
 for(let i=S.anim.length-1;i>=0;i--){const a=S.anim[i];a.age+=dt*(order?.repeatEnd?2.2:1);let t=Math.min(1,a.age/a.duration);a.onMove(t);if(t>=1){a.onDone();S.anim.splice(i,1);}}
 if(hadMotion&&!S.anim.length){markVisitorInteraction();if(!driveRepeat()){updateTargets();if(S.phase==='complete'&&dialog.hidden)finishSample();}}
 hushHintsUntilIdle(now);
 // Glimmer remains the idle cue. Do not actuate real mechanisms without input.
 const cloth=n('Partly woven cloth');if(cloth?.highlight>0)cloth.highlight=Math.max(0,cloth.highlight-dt*1.65);
 r.render(dt);layOut();FX.update(dt);totalFrames++;
 requestAnimationFrame(frame);
}
function assertScene(){
 const required=['Shuttle body','Shuttle bobbin','Reed frame.001','Partly woven cloth','Foot treadle','Yarn bobbin','Sample frame.002','91 individually spaced warp threads'];
 const missing=required.filter(k=>!n(k));if(missing.length)throw Error('The selected GLB lacks interaction nodes: '+missing.join(', '));
}
function init(){
 const stats=r.load(window.LOOM_MODEL_GLB_BASE64);assertScene();const resumed=restoreCheckpoint();resetMechanics();
 r.setClothCanvas(colorCanvas);repaintCloth();S.patternIndex=WEAVES[S.pattern].index;
 addTargets();createPatternMarks();initOrderControls();applyGuidancePresentation();updateTargets();updateSwatchDock();
 $('#modelMeta').textContent=`Source: Millyard_Loom_Reference_Yarn.glb · ${stats.nodes} scene objects`;
 $('#loading').hidden=true;
 if(Object.keys(orderJournal).length&&!previousTutorial){tutorial.active=false;applyGuidancePresentation();}
 checkpointReady=true;
 if(resumed){
  popup('Continue your weaving',`<p>Your ${WEAVES[S.pattern].name} sample has ${S.pick} of 16 picks. Any interrupted shuttle movement was returned to the last completed pick.</p><p class="subtext">Finished swatches and workshop seals are preserved on this device.</p>`,[{label:'Resume weaving',fn:startLoom},{label:'Restart sample',secondary:true,fn:confirmRestart}]);
 }else if(tutorial.active){
  popup('Your day in the loom room',`<p>Three fictional workshop orders are waiting. Design your own yarn bands, discover the rhythm of each pattern, and make a real woven sample.</p><p>New to weaving? A single guided pick teaches the basics, or explore the loom freely.</p><p class="subtext">An educational interpretation of a handloom, not an Amoskeag industrial loom.</p>`,[
  {label:'Take a workshop order',fn:showOrders},
  {label:'Start guided tutorial',secondary:true,fn:()=>{startLoom();announce('Step one of three: open the shed.');}},
  {label:'Explore freely instead',secondary:true,fn:exitGuidedMode}
  ]);
 }else{startLoom();}
 initialized=true;
 requestAnimationFrame(t=>{tick=t;frame(t);});
 window.__woven={ready:true,workshop:{get active(){return order;},journal:orderJournal,showOrders,beginOrder:confirmOrder,revealClue:revealOrderClue,repeatBand:repeatCurrentBand},model:stats,state:S,tutorial,selectYarn:chooseYarn,pressTreadle,throwShuttle,beat,changePattern,replayTutorial,renderer:r,effects:FX,sounds:SFX,inspect:(id)=>{const def=definitions.find(d=>d.id===id);if(def){markVisitorInteraction();showInfo(def,true);}},getHintState:()=>({lastVisitorInteraction,attentionShown,delay:IDLE_GLIMMER_DELAY_MS,focusCount:pendingFocus.length}),advanceHintClock:hushHintsUntilIdle,savePNG,completedSwatches,openCompletedSwatch,openLiveSwatch,getSwatchImage:(key)=>completedSwatches[key]?swatchDataURL(key,completedSwatches[key].rows):null};
}
function fail(err){console.error(err);$('#loading').hidden=true;dialog.hidden=true;const fatal=$('#fatal');fatal.hidden=false;fatal.textContent='The workshop could not finish loading. Check that all project files are present, then try again.';const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.addEventListener('click',()=>window.location.reload());fatal.append(retry);retry.focus?.();}
window.addEventListener('resize',()=>{r.resize();layOut();});
window.addEventListener('pagehide',saveCheckpoint);
window.addEventListener('keydown',e=>{
 if(e.key.toLowerCase()==='f'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){
   const app=$('#app');
   if(document.fullscreenElement) document.exitFullscreen?.().catch?.(()=>{});
   else app?.requestFullscreen?.().catch?.(()=>{});
   return;
 }
 if(e.key==='Escape'&&!dialog.hidden){if(!S.started)exitGuidedMode();else closePopup();return;}
 if(e.key==='Tab'&&!dialog.hidden){const items=Array.from(dialog.querySelectorAll?.('a[href],button:not([disabled]),[tabindex="0"]')||actions.children);const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last?.focus?.();}else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first?.focus?.();}return;}
 if(e.key==='Escape'&&infoPanel&&!infoPanel.hidden){markVisitorInteraction();closeInfo();return;}
 if(e.key.toLowerCase()==='m'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){markVisitorInteraction();SFX.toggleMuted();toastMsg(SFX.muted?'Loom sounds muted':'Loom sounds on',true);return;}
 if(e.key==='?'||e.key.toLowerCase()==='h'){showHelp();return;}
 if(!dialog.hidden||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
 if(/^[1-6]$/.test(e.key))chooseYarn(+e.key-1);
 if(['q','w','e','r'].includes(e.key.toLowerCase()))pressTreadle(['q','w','e','r'].indexOf(e.key.toLowerCase()));
 if(e.code==='Space'&&!e.target?.closest?.('button, input, select, textarea, a')){e.preventDefault();nextActionSpec().run();}
});
helpBtn.addEventListener('click',showHelp);
workshopBtn.addEventListener('click',showOrders);
repeatBand.addEventListener('click',()=>{if(dialog.hidden)repeatCurrentBand();});
nextAction.addEventListener('click',()=>{if(!dialog.hidden)return;if(S.anim.length){recoverAction();return;}closeInfo();nextActionSpec().run();});
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
