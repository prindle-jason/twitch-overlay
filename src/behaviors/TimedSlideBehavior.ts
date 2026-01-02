import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface TimedSlideConfig {
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  duration?: number;
}

export class TimedSlideBehavior extends Behavior {
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private duration: number;
  private elapsedTime = 0;
  private isStarted = false;

  constructor(config: TimedSlideConfig = {}) {
    super();
    this.startX = config.startX ?? 0;
    this.startY = config.startY ?? 0;
    this.endX = config.endX ?? 0;
    this.endY = config.endY ?? 0;
    this.duration = config.duration ?? 1000;
  }

  play(element: TransformElement): void {
    element.x = this.startX;
    element.y = this.startY;
    this.elapsedTime = 0;
    this.isStarted = true;
  }

  update(element: TransformElement, deltaTime: number): void {
    if (!this.isStarted) return;

    this.elapsedTime += deltaTime;
    const progress = Math.min(this.elapsedTime / this.duration, 1);

    element.x = this.startX + (this.endX - this.startX) * progress;
    element.y = this.startY + (this.endY - this.startY) * progress;
  }

  isComplete(): boolean {
    return this.isStarted && this.elapsedTime >= this.duration;
  }
}
