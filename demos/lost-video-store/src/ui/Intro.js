export function showIntro(intro, experience, visible){ intro.hidden = !visible; experience.setAttribute('aria-hidden', String(visible)); }
