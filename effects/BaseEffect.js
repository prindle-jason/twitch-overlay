// effects/BaseEffect.js
export class BaseEffect {
  constructor({ W, H, duration = 3000 } = {}) {
    this.state = "Loading";
    this.duration = duration;
    this.elapsed = 0;
    this.W = W;
    this.H = H;
    this.elements = [];
  }

  /**
   * Add an element to this effect
   * @param {BaseElement} element
   */
  addElement(element) {
    element.setEffect(this);
    this.elements.push(element);
    return this; // For chaining
  }

  /**
   * Remove an element from this effect
   * @param {BaseElement} element
   */
  removeElement(element) {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      element.setEffect(null);
    }
    return this;
  }

  /**
   * Initialize the effect (maintains compatibility with existing BaseEffect)
   */
  async init() {
    this.elapsed = 0;
    // Wait for all elements to be ready (images loaded, etc.)
    await Promise.all(this.elements.map((e) => e.ready()));
    this.state = "Playing";
  }

  /**
   * Called when the effect starts
   */
  onPlay() {
    // Trigger onPlay for all elements
    this.elements.forEach((element) => element.onPlay());
  }

  /**
   * Update the effect and all its elements
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    this.elapsed += deltaTime;

    // Update all elements
    this.elements.forEach((element) => element.update(deltaTime));

    // Check if effect should finish
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      this.state = "Finished";
      this.elements.forEach((element) => element.onFinish());
    }
  }

  /**
   * Draw all elements
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    this.elements.forEach((element) => element.draw(ctx));
  }

  /**
   * Called when the effect finishes (compatibility with existing BaseEffect)
   */
  onFinish() {
    // Trigger onFinish for all elements
    this.elements.forEach((element) => element.onFinish());
  }

  /**
   * Get the current state (compatibility with existing BaseEffect)
   */
  getState() {
    return this.state;
  }

  /**
   * Get the current progress (0-1)
   */
  getProgress() {
    return this.duration > 0 ? Math.min(1, this.elapsed / this.duration) : 0;
  }
}
