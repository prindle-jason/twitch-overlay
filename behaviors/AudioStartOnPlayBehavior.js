import BaseBehavior from './BaseBehavior.js';

/**
 * Behavior that starts audio playback when the parent entity starts playing.
 * Add this as a child to an AudioEntity to control when it plays.
 */
export default class AudioStartOnPlayBehavior extends BaseBehavior {
  constructor(config = {}, parent) {
    super(config, parent);
    
    this.elapsed = 0;
    this.hasTriggered = false;
  }
  
  /**
   * When this behavior starts, trigger parent audio after delay
   */
  onPlay() {
    if (this.parent && this.parent.playAudio && !this.hasTriggered) {
      console.log(`AudioStartOnPlayBehavior: triggering parent audio '${this.parent.name}'`);
      this.parent.playAudio();
      this.hasTriggered = true;
    }
  }
  
  /**
   * This behavior finishes when it has triggered the audio
   */
  shouldFinish() {
    return this.hasTriggered;
  }
}