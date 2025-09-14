// elements/BaseElement.js
export class BaseElement {
  constructor(config = {}) {
    this.behaviors = [];
    this.effect = null;
    
    // Handle behaviors separately to ensure they go through addBehavior
    const { behaviors, ...otherConfig } = config;
    
    // Apply other config properties first
    Object.assign(this, otherConfig);
    
    // Add behaviors using addBehavior method (which handles onPlay if needed)
    if (behaviors) {
      behaviors.forEach(behavior => this.addBehavior(behavior));
    }
  }

  /**
   * Attach this element to an effect (gives access to effect context)
   * @param {ComposableBaseEffect} effect 
   */
  setEffect(effect) {
    this.effect = effect;
  }

  /**
   * Add a behavior to this element
   * @param {BaseBehavior} behavior 
   */
  addBehavior(behavior) {
    this.behaviors.push(behavior);
    
    // If the element is already attached to a playing effect, 
    // initialize the behavior immediately
    if (this.effect && this.effect.state === "Playing") {
      behavior.onPlay?.(this);
    }
    
    return this; // For chaining
  }

  /**
   * Remove a behavior from this element
   * @param {BaseBehavior} behavior 
   */
  removeBehavior(behavior) {
    const index = this.behaviors.indexOf(behavior);
    if (index !== -1) {
      this.behaviors.splice(index, 1);
    }
    return this;
  }

  /**
   * Called when the effect starts playing
   */
  onPlay() {
    this.behaviors.forEach(behavior => behavior.onPlay?.(this));
  }

  /**
   * Update this element (called every frame)
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    this.behaviors.forEach(behavior => behavior.update?.(this, deltaTime));
  }

  /**
   * Draw this element to the canvas (override in subclasses)
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // Override in subclasses
  }

  /**
   * Get the progress for this element (0-1)
   * Regular elements delegate to effect, timed elements use their own timing
   */
  getProgress() {
    return this.effect ? this.effect.getProgress() : 0;
  }

  /**
   * Called when the effect finishes
   */
  onFinish() {
    this.behaviors.forEach(behavior => behavior.onFinish?.(this));
  }
}
