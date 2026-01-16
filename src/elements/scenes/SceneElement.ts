import { Element } from "../Element";
import { configProps } from "../../core/configProps";
import type { SceneType } from "../../utils/types";
import type { Settings } from "../../server/ws-types";

/**
 * SceneElement is a top-level element that represents a complete scene or composition.
 * It extends Element to manage child elements and track duration/timing.
 * SceneElements are the primary unit managed by SceneManager.
 */
export abstract class SceneElement extends Element {
  /**
   * Type identifier for this scene - must match SceneType union
   * Subclasses MUST implement this getter
   */
  abstract get type(): SceneType;

  constructor() {
    super();
  }

  // Convenience accessors for canvas dimensions
  get W(): number {
    return configProps.canvas.W;
  }

  get H(): number {
    return configProps.canvas.H;
  }

  /**
   * Handle scene-specific configuration updates.
   * Scene config is not cascaded to children - it applies only to the scene.
   * Subclasses can override to handle their specific config settings.
   */
  onSceneConfig(config: Settings): void {
    // Default: do nothing. Subclasses override as needed.
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
