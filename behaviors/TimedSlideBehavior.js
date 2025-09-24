// behaviors/TimedSlideBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class TimedSlideBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.startX = config.startX || 0;
    this.startY = config.startY || 0;
    this.endX = config.endX || 0;
    this.endY = config.endY || 0;
    this.duration = config.duration || 1000; // duration in milliseconds
    
    // Internal timing state
    this.elapsedTime = 0;
    this.isStarted = false;
  }
  
  onPlay(element) {
    // Set initial position and start timing
    element.x = this.startX;
    element.y = this.startY;
    this.elapsedTime = 0;
    this.isStarted = true;
  }
  
  update(element, deltaTime) {
    if (!this.isStarted) return;
    
    // Accumulate elapsed time
    this.elapsedTime += deltaTime;
    
    // Calculate progress (0 to 1, clamped)
    const progress = Math.min(this.elapsedTime / this.duration, 1);
    
    // Update position linearly based on progress
    element.x = this.startX + (this.endX - this.startX) * progress;
    element.y = this.startY + (this.endY - this.startY) * progress;
  }
  
  /**
   * Check if the slide animation is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.isStarted && this.elapsedTime >= this.duration;
  }
  
  /**
   * Reset the behavior to initial state
   */
  reset() {
    this.elapsedTime = 0;
    this.isStarted = false;
  }
}