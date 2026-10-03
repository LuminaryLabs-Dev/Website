import { Experience } from './app/Experience.js';
import { artifacts } from './artifacts/index.js';
import { AudioManager } from './audio/AudioManager.js';
import { renderScene } from './scene/ExhibitScene.js';
import { showIntro } from './ui/Intro.js';
import { renderProgress } from './ui/Progress.js';
import { renderCaseFile } from './ui/CaseFile.js';
import { renderObjectViewer } from './ui/ObjectViewer.js';
import { revealClue } from './ui/StoryPanel.js';
import { showFinale } from './ui/Finale.js';
import { rotateElement } from './interactions/Rotate.js';
import { flipElement } from './interactions/Flip.js';
import { revealElement } from './interactions/Reveal.js';

const experience = new Experience();
const audio = new AudioManager();
const $ = id => document.getElementById(id);
const ui = {
  app: $('app'), intro: $('intro'), experience: $('experience'), begin: $('beginButton'), progress: $('progressText'), scene: $('roomScene'), door: $('archiveDoor'), prompt: $('scenePrompt'),
  caseFile: $('caseFile'), caseButton: $('caseFileButton'), closeCase: $('closeCaseFile'), evidence: $('evidenceList'), connections: $('connections'), reset: $('resetButton'),
  viewer: $('objectViewer'), closeViewer: $('closeViewer'), visual: $('viewerVisual'), eyebrow: $('viewerEyebrow'), title: $('viewerTitle'), description: $('viewerDescription'), interaction: $('interactionHost'), clue: $('clueReveal'), collect: $('collectButton'),
  finaleOverlay: $('finaleOverlay'), openArchive: $('openArchiveButton'), archiveReveal: $('archiveReveal'), restart: $('restartButton'), audio: $('audioButton')
};
let active = null;

function sync(){
  ui.app.dataset.state = experience.state;
  showIntro(ui.intro, ui.experience, experience.state === 'INTRO');
  renderProgress(ui.progress, experience.progression.collectedIds().length);
  renderScene(ui.scene, ui.door, experience.progression);
  renderCaseFile(ui.evidence, ui.connections, experience.progression);
  const unlocked = experience.progression.isFinaleUnlocked();
  showFinale(ui.finaleOverlay, unlocked && experience.state !== 'COMPLETE');
  ui.prompt.textContent = unlocked ? 'The store has changed. Archive B-17 is responding.' : 'Move through the store and inspect anything that looks out of place.';
}

ui.begin.addEventListener('click', ()=>{ experience.begin(); audio.play('open'); sync(); });
document.querySelectorAll('.hotspot').forEach(node => node.addEventListener('click', ()=>openArtifact(node.dataset.artifact)));
function openArtifact(id){
  active = artifacts[id]; experience.open(id);
  renderObjectViewer({artifact:active, visual:ui.visual, eyebrow:ui.eyebrow, title:ui.title, description:ui.description, interactionHost:ui.interaction, clueReveal:ui.clue, collectButton:ui.collect});
  if (experience.progression.state[id].inspected) { revealClue(ui.clue, active); ui.collect.disabled = experience.progression.state[id].collected; ui.collect.textContent = experience.progression.state[id].collected ? 'Already in case file' : 'Add to case file'; }
  const action = ui.interaction.querySelector('.interaction-action');
  action?.addEventListener('click', ()=>{
    if (active.interaction === 'rotate') rotateElement(ui.visual);
    if (active.interaction === 'flip') flipElement(ui.visual);
    if (active.interaction === 'reveal') revealElement(ui.visual);
    experience.reveal(); revealClue(ui.clue, active); ui.collect.disabled = false; ui.collect.textContent='Add to case file'; audio.play('clue'); sync();
  }, { once: true });
  ui.viewer.showModal(); audio.play('open');
}
ui.collect.addEventListener('click', ()=>{
  if (!active || experience.progression.state[active.id].collected) return;
  experience.collect(); audio.play(experience.progression.isFinaleUnlocked() ? 'finale' : 'collect'); ui.viewer.close(); sync();
});
ui.closeViewer.addEventListener('click', ()=>ui.viewer.close());
ui.viewer.addEventListener('click', e=>{ if(e.target === ui.viewer) ui.viewer.close(); });
ui.caseButton.addEventListener('click', ()=>{ ui.caseFile.classList.add('open'); ui.caseFile.setAttribute('aria-hidden','false'); });
ui.closeCase.addEventListener('click', ()=>{ ui.caseFile.classList.remove('open'); ui.caseFile.setAttribute('aria-hidden','true'); });
ui.reset.addEventListener('click', ()=>{ experience.reset(); ui.caseFile.classList.remove('open'); ui.archiveReveal.classList.remove('visible'); ui.archiveReveal.setAttribute('aria-hidden','true'); sync(); });
ui.openArchive.addEventListener('click', ()=>{ experience.complete(); ui.archiveReveal.classList.add('visible'); ui.archiveReveal.setAttribute('aria-hidden','false'); audio.play('finale'); sync(); });
ui.restart.addEventListener('click', ()=>{ experience.reset(); ui.archiveReveal.classList.remove('visible'); ui.archiveReveal.setAttribute('aria-hidden','true'); sync(); });
ui.audio.addEventListener('click', ()=>{ const enabled=audio.toggle(); ui.audio.textContent=enabled?'Sound on':'Sound off'; ui.audio.setAttribute('aria-pressed',String(enabled)); });

// Deterministic evidence mode for local automated rendering only.
if (new URLSearchParams(location.search).get('evidence') === 'complete') {
  experience.begin();
  for (const id of Object.keys(artifacts)) { experience.open(id); experience.reveal(); experience.collect(); }
  sync();
} else sync();
