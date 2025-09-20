import BaseBehavior from './BaseBehavior.js';

/**
 * Behavior entity that adds a time limit to its parent.
 * When duration expires, finishes the parent entity.
 */
export default class FinishAfterDurationBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    this.duration = config.duration;
    this.elapsed = 0; // TimedBehavior manages its own time
  }
  
  /**
   * Check if duration has elapsed and finish parent
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration && this.parent) {
      this.parent.finish();
    }
  }
  
  /**
   * This behavior finishes when parent finishes
   */
  shouldFinish() {
    return this.parent && this.parent.state === 'finished';
  }

  getTimeRemaining() {
    //console.log(`TimedBehavior: duration=${this.duration}, elapsed=${this.elapsed}`);
    return Math.max(0, this.duration - this.elapsed);
  }
}