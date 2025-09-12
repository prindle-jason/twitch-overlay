// behaviors/BaseBehavior.js
export class BaseBehavior {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Called when the effect starts playing
   * @param {BaseElement} element - The element this behavior is attached to
   */
  onPlay(element) {
    // Override in subclasses
  }

  /**
   * Called every frame to update the element
   * @param {BaseElement} element - The element this behavior is attached to
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(element, deltaTime) {
    // Override in subclasses
  }

  /**
   * Called when the effect finishes
   * @param {BaseElement} element - The element this behavior is attached to
   */
  onFinish(element) {
    // Override in subclasses
  }
}
