import BaseBehavior from './BaseBehavior.js';
import { getEaseInProgress, getEaseOutProgress, getEaseInOutProgress, EaseCurve } from '../utils/progressUtils.js';

/**
 * Behavior entity that animates the parent's opacity over time.
 * Uses configurable easing for smooth animation.
 */
export default class OpacityBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.duration = config.duration;
    
    // Progress/easing configuration
    this.progressFunc = config.progressFunc || getEaseInOutProgress; // Direct function reference
    this.easeCurve = config.easeCurve || EaseCurve.QUADRATIC; // For easeIn/easeOut
    this.easeTime = config.easeTime || 0.25; // For easeInOut only
    
    this.elapsed = 0; // Track elapsed time
    this.startOpacity = 0; // Will be set in onPlay()
  }
  
  /**
   * Update opacity based on elapsed time
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    this.elapsed += deltaTime; // Track elapsed time
    
    // Calculate progress (0 to 1)
    const progress = Math.min(this.elapsed / this.duration, 1);
    
    // Apply configurable easing using direct function reference
    const easedProgress = this.progressFunc(progress, this.easeTime);
    
    // Interpolate opacity from 0 to 1
    this.parent.opacity = easedProgress;
  }
  
  /**
   * Check if opacity animation should finish
   */
  shouldFinish() {
    return this.elapsed >= this.duration;
  }
}