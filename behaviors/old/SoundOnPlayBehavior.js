// behaviors/SoundOnPlayBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class SoundOnPlayBehavior extends BaseBehavior {
  onPlay(soundElement) {
    // Trigger sound playback (assumes element has a play() method)
    if (soundElement.play && typeof soundElement.play === 'function') {
      soundElement.play();
    }
  }
}
