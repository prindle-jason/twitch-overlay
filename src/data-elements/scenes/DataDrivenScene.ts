import { SceneElement } from "../../elements/scenes/SceneElement";
import type { Element } from "../../elements/primitives/Element";

/**
 * DataDrivenScene wraps root elements from a data-driven JSON config.
 * All root elements are added as children, keeping them together as a cohesive unit.
 */
export class DataDrivenScene extends SceneElement {
  get type() {
    return "dataDriven" as const;
  }

  constructor(rootElements: Map<string, Element>) {
    super();
    rootElements.forEach((element) => {
      this.addChild(element);
    });
  }
}
