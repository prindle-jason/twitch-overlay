import { ImageElement } from "./ImageElement";
import type { ImageKey } from "../core/resources";

/* Duration should be a base element item, but for now this will do */
export class TimedImageElement extends ImageElement {
  duration: number;
  elapsed = 0;
  expired = false;

  constructor(imageKey: ImageKey, duration: number) {
    super(imageKey);
    this.duration = duration;
  }

  override getProgress(): number {
    return this.duration > 0 ? Math.min(this.elapsed / this.duration, 1) : 1;
  }

  override update(deltaTime: number): void {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration) {
      this.expired = true;
    }

    super.update(deltaTime);
  }
}
