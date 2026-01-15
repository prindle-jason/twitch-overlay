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

/**
 * TriggerableSceneElement is a scene that persists and handles multiple trigger events.
 * Instead of creating a new instance on each trigger, triggerable scenes receive
 * the event and decide how to respond (e.g., add to queue, toggle off, etc).
 */
export abstract class TriggerableSceneElement extends SceneElement {
  static isTriggerable = true;

  /**
   * Handle a trigger event while this scene is already active.
   * Subclasses override to define their specific behavior.
   * @param payload Optional event payload
   */
  abstract handleTrigger(payload?: unknown): void;
}
