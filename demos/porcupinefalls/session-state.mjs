/** Single transition owner: target loss never hides an already spawned model. */
export function transition(state,event){
 if(event==='close')return 'closed';
 if(state==='closed')return state;
 if(event==='error')return 'error';
 if(state==='loading'&&event==='ready')return 'scanning';
 if((state==='scanning'&&event==='found')||(state==='loading'&&event==='preview'))return 'viewing';
 return state;
}
