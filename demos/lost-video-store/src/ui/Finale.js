export function showFinale(overlay, visible){ overlay.setAttribute('aria-hidden', String(!visible)); overlay.classList.toggle('visible', visible); }
