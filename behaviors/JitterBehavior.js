import BaseBehavior from './BaseBehavior.js';

/**
 * Behavior entity that adds random jitter to the parent's position.
 * Continuously randomizes position around the original base position.
 */
export default class JitterBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.duration = config.duration || Infinity; // Default to infinite jitter
    this.jitterAmount = config.jitterAmount || 6;
    
    this.elapsed = 0; // Track elapsed time
    this.baseX = 0; // Will be set in onPlay()
    this.baseY = 0; // Will be set in onPlay()
  }
  
  /**
   * Capture the parent's current position as the base point for jittering
   */
  onPlay() {
    if (this.parent) {
      this.baseX = this.parent.x;
      this.baseY = this.parent.y;
    }
  }
  
  /**
   * Update jitter position based on elapsed time
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (!this.parent) return;
    
    this.elapsed += deltaTime; // Track elapsed time
    
    // Apply random jitter around the base position
    this.parent.x = this.baseX + (Math.random() - 0.5) * this.jitterAmount * 2;
    this.parent.y = this.baseY + (Math.random() - 0.5) * this.jitterAmount * 2;
  }
  
  /**
   * Check if jitter should finish
   * Usually jitters until parent finishes, but can have a duration limit
   */
  shouldFinish() {
    return this.elapsed >= this.duration;
  }
}