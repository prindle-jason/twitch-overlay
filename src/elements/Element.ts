import { Effect } from "../effects/Effect";
import { Behavior } from "../behaviors/Behavior";
import type { LifecycleState } from "../types";

export abstract class Element {
  behaviors: Behavior[] = [];
  effect: Effect | null = null;
  state: LifecycleState = "NEW";

  constructor(config: Record<string, unknown> = {}) {
    Object.assign(this, config);
  }

  setState(newState: LifecycleState) {
    this.state = newState;
  }

  init(): void {
    // Override in subclasses
  }

  async ready(): Promise<void> {
    return Promise.resolve();
  }

  setEffect(effect: Effect | null) {
    this.effect = effect;
  }

  addBehavior(behavior: Behavior) {
    this.behaviors.push(behavior);
    return this;
  }

  removeBehavior(behavior: Behavior) {
    const index = this.behaviors.indexOf(behavior);
    if (index !== -1) {
      this.behaviors.splice(index, 1);
    }
    return this;
  }

  onPlay() {
    this.behaviors.forEach((behavior) => behavior.onPlay?.(this));
  }

  update(deltaTime: number) {
    this.behaviors.forEach((behavior) => behavior.update?.(this, deltaTime));
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Override in subclasses
  }

  getProgress(): number {
    return this.effect ? this.effect.getProgress() : 0;
  }

  onFinish() {
    this.behaviors.forEach((behavior) => behavior.onFinish?.(this));
  }
}
