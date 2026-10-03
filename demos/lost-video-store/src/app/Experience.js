import { STATES } from './ExperienceState.js';
import { createProgression } from './Progression.js';
import { loadProgress, saveProgress, clearProgress } from './Persistence.js';
import { artifacts } from '../artifacts/index.js';

export class Experience {
  constructor() {
    this.ids = Object.keys(artifacts);
    this.progression = createProgression(this.ids, loadProgress());
    this.state = STATES.INTRO;
    this.activeArtifact = null;
  }
  begin() { this.state = STATES.EXPLORING; }
  open(id) { if (!artifacts[id]) throw new Error('Unknown artifact'); this.activeArtifact = id; this.state = STATES.ARTIFACT_OPEN; }
  reveal() { this.progression.inspect(this.activeArtifact); this.state = STATES.CLUE_REVEALED; this.persist(); }
  collect() { this.progression.collect(this.activeArtifact); this.state = this.progression.isFinaleUnlocked() ? STATES.FINALE_UNLOCKED : STATES.ARTIFACT_COLLECTED; this.persist(); }
  complete() { if (!this.progression.isFinaleUnlocked()) throw new Error('Finale locked'); this.state = STATES.COMPLETE; }
  reset() { this.progression.reset(); this.activeArtifact = null; this.state = STATES.INTRO; clearProgress(); }
  persist() { saveProgress(this.progression.state); }
}
