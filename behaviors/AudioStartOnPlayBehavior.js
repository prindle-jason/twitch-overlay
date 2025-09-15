import Entity from '../entities/Entity.js';

/**
 * Behavior that starts audio playback when the parent entity starts playing.
 * Add this as a child to an AudioEntity to control when it plays.
 */
export default class AudioStartOnPlayBehavior extends Entity {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.parent = parent; // Store parent reference to control audio
    this.delay = config.delay || 0; // Optional delay before starting audio
    this.elapsed = 0;
    this.hasTriggered = false;
  }
  
  /**
   * When this behavior starts, trigger parent audio after delay
   */
  onPlay() {
    if (this.delay === 0) {
      this.triggerParentAudio();
    }
    // If delay > 0, wait for onUpdate to handle timing
  }
  
  /**
   * Handle delayed audio start
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (this.delay > 0 && !this.hasTriggered) {
      this.elapsed += deltaTime;
      if (this.elapsed >= this.delay) {
        this.triggerParentAudio();
      }
    }
  }
  
  /**
   * Start the parent audio entity's playback
   */
  triggerParentAudio() {
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