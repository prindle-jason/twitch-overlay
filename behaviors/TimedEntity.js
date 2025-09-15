import Entity from '../entities/Entity.js';

/**
 * Behavior entity that adds a time limit to its parent.
 * When duration expires, finishes the parent entity.
 */
export default class TimedEntity extends Entity {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.parent = parent; // Store parent reference since we need it
    this.duration = config.duration;
    this.elapsed = 0; // TimedEntity manages its own time
  }
  
  /**
   * Check if duration has elapsed and finish parent
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration && this.parent) {
      // Finish the parent entity
      this.parent.finish();
    }
  }
  
  /**
   * This behavior finishes when parent finishes
   */
  shouldFinish() {
    return this.parent && this.parent.state === 'finished';
  }
}