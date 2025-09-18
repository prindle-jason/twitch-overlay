import BaseBehavior from './BaseBehavior.js';
import { getEaseInProgress, getEaseOutProgress, getEaseInOutProgress, EaseCurve } from '../utils/progressUtils.js';

/**
 * Behavior entity that animates the parent's blur effect over time.
 * Uses configurable easing for smooth animation.
 * Note: This applies a CSS blur filter which may not work with Canvas rendering.
 */
export default class BlurBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.duration = config.duration;
    this.maxBlur = config.maxBlur || 16;
    
    // Progress/easing configuration
    this.progressFunc = config.progressFunc || getEaseInOutProgress; // Direct function reference
    this.easeCurve = config.easeCurve || EaseCurve.QUADRATIC; // For easeIn/easeOut
    this.easeTime = config.easeTime || 0.25; // For easeInOut only
    
    this.elapsed = 0; // Track elapsed time
  }
  
  /**
   * Update blur based on elapsed time
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (!this.parent) return;
    
    this.elapsed += deltaTime; // Track elapsed time
    
    // Calculate progress (0 to 1)
    const progress = Math.min(this.elapsed / this.duration, 1);
    
    // Apply configurable easing using direct function reference
    const easedProgress = this.progressFunc(progress, this.easeTime);
    
    // Blur fades in and out: starts blurred, becomes clear, then blurred again
    // Similar to opacity fade in/out pattern
    const blurAmount = this.maxBlur * (1 - easedProgress);
    
    // Apply blur filter
    this.parent.filter = `blur(${blurAmount}px)`;
  }
  
  /**
   * Check if blur animation should finish
   */
  shouldFinish() {
    return this.elapsed >= this.duration;
  }
}