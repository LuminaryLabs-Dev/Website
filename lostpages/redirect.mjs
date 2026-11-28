// Transitional link only: maps new canonical addresses onto the already-existing public application.
// The Nexus edition is NOT published by this module. No new game assets are included.
export const SLUGS=Object.freeze(['sleeping-gallery','frame-that-breathes','lost-childs-sketchbook','curators-warning','tiny-platformer-diorama','in-between-exhibit','monster-behind-canvas','secret-portal-room']);
export function legacyDestination(value){
 const input=new URL(value,'https://luminarylabs.dev/lostpages/');
 const path=input.pathname.match(/\/lostpages\/ar\/([^/]+)\/?$/);
 const page=input.searchParams.get('page')??path?.[1]??null;
 let slug=null;if(page!==null){const n=/^page0([1-8])$/.exec(page);slug=n?SLUGS[Number(n[1])-1]:SLUGS.includes(page)?page:null;if(!slug)return {ok:false,href:'/apps/lost-pages/',reason:'Unknown exhibit link'};}
 const dest=new URL(slug?`/apps/lost-pages/ar/${slug}/`:'/apps/lost-pages/',input.origin);dest.search=input.search;dest.searchParams.delete('page');dest.hash=input.hash;
 return {ok:true,href:dest.pathname+dest.search+dest.hash,slug};
}

const result=legacyDestination(location.href);document.querySelector('#continue').href=result.href;if(result.ok){location.replace(result.href)}else{document.querySelector('#status').textContent='Unknown exhibit link. Choose an existing Lost Pages exhibit below.';}
