import { Element } from "../Element";
import { getCanvasConfig } from "../../config";

/**
 * SceneElement is a top-level element that represents a complete scene or composition.
 * It extends Element to manage child elements and track duration/timing.
 * SceneElements are the primary unit managed by SceneManager.
 */
export abstract class SceneElement extends Element {
  constructor() {
    super();
  }

  // Convenience accessors for canvas dimensions
  get W(): number {
    return getCanvasConfig().W;
  }

  get H(): number {
    return getCanvasConfig().H;
  }
}
