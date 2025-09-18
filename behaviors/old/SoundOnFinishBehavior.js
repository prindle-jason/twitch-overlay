// behaviors/SoundOnFinishBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class SoundOnFinishBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.volume = config.volume !== undefined ? config.volume : 1.0;
  }
  
  onFinish(soundElement) {
    // Trigger sound playback (assumes element has a play() method)
    if (soundElement.play && typeof soundElement.play === 'function') {
      soundElement.volume = this.volume;
      soundElement.play();
    }
  }
}
