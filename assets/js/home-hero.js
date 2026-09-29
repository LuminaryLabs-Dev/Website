/* Background gestures belong to the shared playlist; Pause remains explicit. */
(() => {
 const hero=document.querySelector('.hallway-hero');
 hero?.querySelector('.hallway-scroll')?.addEventListener('click',e=>{e.preventDefault();document.getElementById('capabilities').scrollIntoView({behavior:window.SiteMotion.reduced?'instant':'smooth',block:'start'});});
})();
