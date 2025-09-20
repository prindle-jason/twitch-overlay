// elements/TimedImageElement.js
import { ImageElement } from './ImageElement.js';

export class TimedImageElement extends ImageElement {
  constructor(imageName, duration) {
    super(imageName);
    
    // Timing properties
    this.duration = duration;
    this.elapsed = 0;
    this.expired = false;
  }
  
  /**
   * Get the progress of this individual element (0-1)
   */
  getProgress() {
    return this.duration > 0 ? Math.min(this.elapsed / this.duration, 1) : 1;
  }
  
  /**
   * Update the element's lifetime
   */
  update(deltaTime) {
    // Update timing first
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration) {
      this.expired = true;
    }
    
    // Then update behaviors
    super.update(deltaTime);
  }
}
