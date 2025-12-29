import type { Element } from "../elements/Element";

export abstract class Behavior {
  constructor(public config: Record<string, unknown> = {}) {}

  onPlay(element: Element): void {}
  update(element: Element, deltaTime: number): void {}
  onFinish(element: Element): void {}
}
