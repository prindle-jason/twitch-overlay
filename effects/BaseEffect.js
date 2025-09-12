// effects/BaseEffect.js
export class BaseEffect {
  constructor({ W, H, duration = 3000 } = {}) {
    this.state = "Loading";
    this.duration = duration;
    this.elapsed = 0;
    this.W = W;
    this.H = H;
  }

  async init() {
  this.elapsed = 0;
  this.state = "Playing";
  }

  play() {

  }

  update(deltaTime) {
    if (this.state !== "Playing") return;
    this.elapsed += deltaTime;
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      this.state = "Finished";
    }
  }

  draw(ctx) {
    // To be overridden by subclasses
  }

  done() {
    return this.state === "Finished";
  }

  getState() {
    return this.state;
  }
}
