// elements/BaseElement.js
export class BaseElement {
  constructor(config = {}) {
    this.behaviors = [];
    this.effect = null;
    this.state = "Loading"; // Loading, Playing, Finished

    // Apply any config overrides
    Object.assign(this, config);
  }

  /**
   * Set the state of this element
   * @param {string} newState - "Loading", "Playing", or "Finished"
   */
  setState(newState) {
    this.state = newState;
  }

  /**
   * Hook for element-specific readiness logic (e.g., waiting for images to load)
   * Override in subclasses that need to wait for resources
   * @returns {Promise<void>}
   */
  async ready() {
    // Default: immediately ready
    return Promise.resolve();
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
    this.behaviors.forEach((behavior) => behavior.onPlay?.(this));
  }

  /**
   * Update this element (called every frame)
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    this.behaviors.forEach((behavior) => behavior.update?.(this, deltaTime));
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
    this.behaviors.forEach((behavior) => behavior.onFinish?.(this));
  }
}
