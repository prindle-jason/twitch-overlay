// behaviors/TextScrollBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class TextScrollBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.screenWidth = config.screenWidth || 1920;
    this.scrollSpeed = config.scrollSpeed || 200; // pixels per second
    this.startDelay = config.startDelay || 0; // delay before scrolling starts (in seconds)
    this.endDelay = config.endDelay || 1; // delay after scrolling ends (in seconds)
    
    // Internal state
    this.textWidth = 0;
    this.totalScrollDistance = 0;
    this.scrollStartTime = 0;
    this.scrollDuration = 0;
    this.isInitialized = false;
    this.effectStartTime = 0;
  }
  
  onPlay(element) {
    // Get a temporary canvas context to measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Measure the text width (works for both TextElement and RichTextElement)
    this.textWidth = element.getTextWidth(ctx);
    
    // Calculate total distance text needs to travel
    // From right edge of screen to completely off left edge
    this.totalScrollDistance = this.screenWidth + this.textWidth;
    
    // Calculate how long the scroll should take
    this.scrollDuration = this.totalScrollDistance / this.scrollSpeed;
    
    // Position text off-screen to the right initially
    element.x = this.screenWidth;
    
    // Record when the effect started
    this.effectStartTime = Date.now() / 1000; // Convert to seconds
    this.isInitialized = true;
  }
  
  update(element, deltaTime) {
    if (!this.isInitialized) return;
    
    const currentTime = Date.now() / 1000; // Convert to seconds
    const elapsedTime = currentTime - this.effectStartTime;
    
    // Check if we're still in the start delay period
    if (elapsedTime < this.startDelay) {
      // Keep text off-screen to the right
      element.x = this.screenWidth;
      return;
    }
    
    // Calculate scroll progress (0 to 1)
    const scrollElapsed = elapsedTime - this.startDelay;
    const scrollProgress = Math.min(scrollElapsed / this.scrollDuration, 1);
    
    // Update text position based on scroll progress
    const startX = this.screenWidth;
    const endX = -this.textWidth;
    element.x = startX + (endX - startX) * scrollProgress;
  }
  
  /**
   * Check if the text has finished scrolling completely
   * @returns {boolean}
   */
  isScrollComplete() {
    if (!this.isInitialized) return false;
    
    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - this.effectStartTime;
    
    return elapsedTime >= (this.startDelay + this.scrollDuration + this.endDelay);
  }
  
  /**
   * Get the total duration this behavior needs (including delays)
   * @returns {number} Duration in seconds
   */
  getTotalDuration() {
    return this.startDelay + this.scrollDuration + this.endDelay;
  }
}