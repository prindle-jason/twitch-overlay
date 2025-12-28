import type { Element } from "../elements/Element";
import { getCanvasConfig } from "../config";
import type { LifecycleState } from "../types";

export abstract class Effect {
  state: LifecycleState = "NEW";
  duration: number;
  elapsed = 0;
  elements: Element[] = [];

  get W(): number {
    return getCanvasConfig().W;
  }

  get H(): number {
    return getCanvasConfig().H;
  }

  constructor({ duration = 3000 }: { duration?: number } = {}) {
    this.duration = duration ?? 3000;
  }

  addElement(element: Element) {
    element.setEffect(this);
    this.elements.push(element);
    element.init();
    return this;
  }

  removeElement(element: Element) {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      element.setEffect(null);
    }
    return this;
  }

  async init(): Promise<void> {
    this.elapsed = 0;
    await Promise.all(this.elements.map((e) => e.ready()));
    this.state = "READY";
  }

  onPlay(): void {
    this.state = "PLAYING";
    this.elements.forEach((element) => {
      element.setState("PLAYING");
      element.onPlay();
    });
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    this.elements.forEach((element) => element.update(deltaTime));
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      this.state = "FINISHED";
      this.elements.forEach((element) => {
        element.setState("FINISHED");
        element.onFinish();
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.elements.forEach((element) => element.draw(ctx));
  }

  onFinish(): void {
    this.elements.forEach((element) => element.onFinish());
  }

  getState(): string {
    return this.state;
  }

  getProgress(): number {
    return this.duration > 0 ? Math.min(1, this.elapsed / this.duration) : 0;
  }
}
