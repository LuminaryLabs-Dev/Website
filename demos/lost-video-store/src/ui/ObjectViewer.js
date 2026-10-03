export function renderObjectViewer({ artifact, visual, eyebrow, title, description, interactionHost, clueReveal, collectButton }){
  visual.className = `viewer-visual visual-${artifact.visual}`;
  visual.innerHTML = '<div class="object-model"><span></span></div>';
  eyebrow.textContent = artifact.subtitle; title.textContent = artifact.name; description.textContent = artifact.description;
  interactionHost.innerHTML = `<button class="interaction-action">${artifact.actionLabel}</button>`;
  clueReveal.textContent = ''; collectButton.disabled = true; collectButton.textContent='Add to case file';
}
