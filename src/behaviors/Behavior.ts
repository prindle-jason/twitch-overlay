import type { Element } from "../elements/Element";

export abstract class Behavior {
  constructor(public config: Record<string, unknown> = {}) {}

  play(element: Element): void {}
  update(element: Element, deltaTime: number): void {}
  finish(element: Element): void {}
}
