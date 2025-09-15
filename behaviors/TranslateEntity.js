import Entity from '../entities/Entity.js';
import { getEaseInProgress, getEaseOutProgress, getEaseInOutProgress, EaseCurve } from '../utils/progressUtils.js';

/**
 * Behavior entity that translates the parent by a specified amount from its current position.
 * Uses configurable easing for smooth animation.
 */
class TranslateEntity extends Entity {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.parent = parent; // Store parent reference
    this.deltaX = config.deltaX !== undefined ? config.deltaX : 0;
    this.deltaY = config.deltaY !== undefined ? config.deltaY : 0;
    this.duration = config.duration || 4000; // Default 4 second slide
    
    // Progress/easing configuration
    this.progressFunc = config.progressFunc || getEaseInOutProgress; // Direct function reference
    this.easeCurve = config.easeCurve || EaseCurve.QUADRATIC; // For easeIn/easeOut
    this.easeTime = config.easeTime || 0.25; // For easeInOut only
    
    this.elapsed = 0; // Track elapsed time
    this.startX = 0; // Will be set in onPlay()
    this.startY = 0; // Will be set in onPlay()
  }
  
  /**
   * Capture the parent's current position as the starting point
   */
  onPlay() {
    if (this.parent) {
      this.startX = this.parent.x;
      this.startY = this.parent.y;
    }
  }
  
  /**
   * Update slide position based on elapsed time
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (!this.parent) return;
    
    this.elapsed += deltaTime; // Track elapsed time
    
    // Calculate progress (0 to 1)
    const progress = Math.min(this.elapsed / this.duration, 1);
    
    // Apply configurable easing using direct function reference
    const easedProgress = this.progressFunc(progress, this.easeTime);
    
    // Interpolate position from start to start+delta
    this.parent.x = this.startX + this.deltaX * easedProgress;
    this.parent.y = this.startY + this.deltaY * easedProgress;
  }
  
  /**
   * Check if translate animation should finish
   */
  shouldFinish() {
    return this.elapsed >= this.duration;
  }
}

export default TranslateEntity;