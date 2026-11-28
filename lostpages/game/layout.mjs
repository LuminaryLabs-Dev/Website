// Lost Pages R01: authored virtual artifact counterpart; no AR or external dependencies.
export const PAGES = Object.freeze([
 ['sleeping-gallery','The Character Map'],['frame-that-breathes','The Frame That Breathes'],['lost-childs-sketchbook',"The Lost Child’s Sketchbook"],['curators-warning',"The Curator’s Warning"],['tiny-platformer-diorama','Tiny Platformer Diorama'],['in-between-exhibit','The In-Between Exhibit'],['monster-behind-canvas','The Monster Behind the Canvas'],['secret-portal-room','The Secret Portal Room']
].map(([slug,title],i)=>Object.freeze({slug,title,page:'page'+String(i+1).padStart(2,'0'),slot:i+1})));
export const HUB='museum-hub', MAP=PAGES[0].slug;
export function route(url){let u;try{u=new URL(url,'https://luminarylabs.dev/lostpages/')}catch{return {valid:false,reason:'Invalid link'}};const path=u.pathname.match(/\/ar\/([^/]+)\/?$/);const v=u.searchParams.get('page')??path?.[1]??null;if(v===null)return {valid:true,scene:HUB};const p=PAGES.find(p=>v===p.page||v===p.slug);if(!p)return {valid:false,reason:'Unknown exhibit link',scene:HUB};return {valid:true,scene:p.slot===1?MAP:HUB,unavailable:p.slot!==1,page:p};}
const C={floor:[.48,.40,.30],wood:[.29,.18,.105],cream:[.73,.67,.54],stone:[.49,.47,.40],gold:[.82,.59,.25],teal:[.10,.43,.43],blue:[.18,.29,.46],dark:[.095,.105,.115],paper:[.72,.58,.36],ink:[.22,.145,.095],accent:[.85,.36,.15],green:[.24,.58,.38],light:[.95,.82,.58]};
const items=[];const make=()=>[];
function box(a,id,x,y,z,w,h,d,c,kind='decor',extra={}){a.push({id,x,y,z,w,h,d,c,kind,...extra});}
function floor(a,id,x,z,w,d,c=C.floor){box(a,id,x,-.18,z,w,.36,d,c,'floor');}
function wall(a,id,x,z,w,d,h=3.3,c=C.cream){box(a,id,x,h/2,z,w,h,d,c,'wall');box(a,id+'-base',x,.10,z,w+.07,.2,d+.07,C.wood);box(a,id+'-trim',x,h-.10,z,w+.10,.18,d+.10,C.gold);}
function marker(a,id,x,z,color=C.gold){box(a,id,x,.015,z,.58,.025,.58,color);}
function frame(a,id,x,z,w=2.3,wallFace=1,color=C.teal){let y=2.1;box(a,id+'-panel',x,y,z,w,1.65,.10,color);for(let sign of [-1,1]){box(a,id+'-v'+sign,x+sign*w/2,y,z+.04,.10,1.86,.18,C.gold);box(a,id+'-h'+sign,x,y+sign*.865,z+.04,w+.2,.12,.18,C.gold);}box(a,id+'-inner',x,y,z+.10,w-.27,1.35,.07,C.dark);}
function portal(a,id,x,z,c=C.teal){const h=2.45;box(a,id+'-base',x,.10,z,2.0,.2,.62,C.stone);for(const s of [-1,1]){box(a,id+'-post'+s,x+s*.86,h/2,z,.22,h,.26,C.gold);box(a,id+'-cap'+s,x+s*.86,h,z,.33,.14,.36,C.cream);}box(a,id+'-top',x,h+.05,z,2.08,.18,.28,C.gold);box(a,id+'-field',x,h/2,z,1.43,h-.30,.055,c,'portal',{tag:id});}
function book(a){box(a,'book-base',0,.55,-.5,1.25,1.1,.82,C.wood,'wall');box(a,'book-stand',0,1.12,-.5,1.48,.13,.97,C.stone);box(a,'book-cover',0,1.23,-.5,1.15,.12,.72,C.blue);box(a,'book-left',-.27,1.31,-.5,.53,.10,.64,C.paper);box(a,'book-right',.27,1.31,-.5,.53,.10,.64,C.paper);for(let i=0;i<4;i++){box(a,'book-line-'+i,-.27,1.365,-.72+i*.12,.34,.015,.022,C.ink);box(a,'book-rline-'+i,.27,1.365,-.72+i*.12,.32,.015,.022,C.ink);} }
function hub(){const a=make();floor(a,'hub-floor',0,0,16,18);wall(a,'rear',0,8.8,16,.4,4.6);wall(a,'west',-7.8,0,.4,18,4.6);wall(a,'east',7.8,0,.4,18,4.6);wall(a,'front',0,-8.8,16,.4,4.6);for(const x of [-7.45,7.45])for(const z of [-6,-2,2,6]){box(a,`pillar-${x}-${z}`,x,2.05,z,.52,4.1,.60,C.stone,'wall');box(a,`pillar-top-${x}-${z}`,x,4.04,z,.8,.22,.82,C.gold);}
// P25 museum miniature, using the real downloaded model, not invented original architecture.
box(a,'museum-display-pedestal',-4.8,.43,-2.7,3.1,.86,1.8,C.wood,'wall');box(a,'museum-display-top',-4.8,.89,-2.7,3.3,.10,2,C.stone);a.push({id:'museum-miniature',kind:'asset',asset:'museum',x:-4.8,y:.94,z:-2.7,w:2.8,h:1,d:1.5,c:C.stone});
book(a);for(let z=-6;z<7;z+=.65)marker(a,'trail'+z,0,z,[.65,.48,.23]);
// The side frames are intentional placeholders for unreleased exhibit worlds.
for(let i=0;i<6;i++){const x=i<3?-6.7:6.7,z=1.4+((i%3)*2.5);box(a,'side-exhibit'+i,x,.65,z,1.0,1.3,1.28,C.wood,'wall');box(a,'side-top'+i,x,1.32,z,1.2,.12,1.44,C.stone);box(a,'side-relic'+i,x,1.65,z,.6,.54,.65,[.25+.04*i,.27,.34]);}
portal(a,'map-portal',0,7.35,C.teal);frame(a,'art-left',-4.2,8.52,2.4,1,C.blue);frame(a,'art-right',4.2,8.52,2.4,1,C.blue);
// Luminous overhead trim and carpet, all visual only.
for(let z=-7;z<=7;z+=3.5){box(a,'lamp'+z,0,4.30,z,2.0,.14,.40,C.light);}
return {id:HUB,spawn:{x:0,y:0,z:-5.7,yaw:0},boxes:a,targets:[{id:'book',x:0,z:-.5,r:1.6},{id:'map',x:0,z:7.35,r:1.7}],background:[.095,.115,.14]};}
function mapWorld(){const a=make();floor(a,'map-start',0,.9,3.2,3.8,C.paper);floor(a,'map-turn',1.95,3.4,7.1,1.2,C.paper);floor(a,'map-connector',2.325,4.6,7.85,1.2,C.paper);floor(a,'map-approach',5,6.6,2.5,2.8,C.paper);floor(a,'map-landing',5,10,2.5,1.6,C.paper);floor(a,'map-end',2.1,12,8.5,2.4,C.paper);
wall(a,'maze-wall-a',1.6,.75,.24,3.5,1.65,C.ink);wall(a,'maze-wall-b',-1.48,1.4,.23,4.9,1.05,C.ink);wall(a,'maze-wall-c',2.65,2.88,3.4,.19,1.0,C.ink);wall(a,'maze-wall-d',3.0,5.25,2.4,.2,1.25,C.ink);wall(a,'maze-wall-e',6.19,6,.18,3.9,1.0,C.ink);wall(a,'maze-wall-f',6.19,11.2,.18,3.7,1.1,C.ink);wall(a,'maze-wall-g',2.3,13.12,7.9,.20,1.2,C.ink);
for(let z=.4;z<=4.01;z+=.6)marker(a,'maptrail-a'+z,0,z,C.gold);for(let x=.6;x<=5.01;x+=.6)marker(a,'maptrail-b'+x,x,4,C.gold);for(let z=4.6;z<=7.6;z+=.6)marker(a,'maptrail-c'+z,5,z,C.gold);for(let z=9.5;z<=12;z+=.6)marker(a,'maptrail-d'+z,5,z,C.gold);for(let x=4.4;x>=-1.4;x-=.6)marker(a,'maptrail-e'+x,x,12,C.gold);
box(a,'checkpoint-pad',5,.018,6.6,1.6,.035,.7,C.green);for(let x of [4.15,5.85]){box(a,'check-post'+x,x,.6,6.6,.13,1.2,.13,C.green);box(a,'check-light'+x,x,1.22,6.6,.25,.19,.25,C.light);}
box(a,'jump-line',5,.018,7.8,2.1,.035,.17,C.accent);box(a,'landing-line',5,.018,9.34,2.1,.035,.17,C.green);
// Stylized fragment and portal; game state determines visibility/activation.
box(a,'fragment-plinth',1,.28,12.65,.78,.56,.63,C.stone,'wall');box(a,'fragment',1,1.05,12.65,.36,.54,.14,C.gold,'fragment');portal(a,'return-portal',-1.25,12.95,C.teal);
// Finite floating map platform void, non-colliding decorative lower base.
box(a,'void-horizon',2,-4,6,70,.1,70,[.105,.135,.15]);
return {id:MAP,spawn:{x:0,y:0,z:0,yaw:0},checkpoint:{x:5,y:0,z:6.6,yaw:0},boxes:a,targets:[{id:'fragment',x:1,z:12.65,r:1.35},{id:'return',x:-1.25,z:12.95,r:1.4}],background:[.075,.115,.16]};}
export const LAYOUTS=Object.freeze({[HUB]:hub(),[MAP]:mapWorld()});
export const COLORS=C;
