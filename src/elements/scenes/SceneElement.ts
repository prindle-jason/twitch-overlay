import { Element } from "../primitives/Element";
import { configProps } from "../../core/configProps";
import type { SceneType } from "../../types/SceneTypes";
import type { Settings } from "../../types/settings";

/**
 * SceneElement represents a complete overlay scene/composition at the top of the
 * element hierarchy. It inherits the standard `Element` lifecycle and child
 * management (init → play → finish) and is the primary unit owned by
 * `SceneManager`.
 *
 * Notes:
 * - Lifecycle: follows `Element` conventions; no special scene-specific states.
 * - Identification: each scene must expose a `type` from `SceneType` for
 *   routing and diagnostics.
 * - Dimensions: use `W`/`H` getters, sourced from `configProps.canvas`.
 * - Configuration: `onSceneConfig()` receives scene-scoped settings updates and
 *   does not cascade to children.
 */
export abstract class SceneElement extends Element {
  /**
   * Identifier for this scene. Must be one of the `SceneType` union values and
   * should remain stable during the scene's lifetime. Used by `SceneManager`
   * and message routing for analytics/debugging.
   * Subclasses MUST implement this getter.
   */
  abstract get type(): SceneType;

  constructor() {
    super();
  }

  // Convenience accessors for current canvas dimensions (in pixels).
  // Values are read from `configProps.canvas` to ensure consistency across
  // scenes and behaviors.
  get W(): number {
    return configProps.canvas.W;
  }

  get H(): number {
    return configProps.canvas.H;
  }

  /**
   * Handle scene-scoped configuration updates.
   *
   * Source: typically from WebSocket `set-settings` messages (`Settings` type).
   * Scope: applies ONLY to the scene instance; does not cascade to children.
   * Guidance: update parameters that affect the scene's rendering or behavior
   * without altering lifecycle state directly. Prefer adding/removing child
   * behaviors if dynamic changes are needed.
   */
  onSceneConfig(config: Settings): void {
    // Default: do nothing. Subclasses override as needed.
  }
}

/**
 * TriggerableSceneElement describes a persistent scene that can react to
 * multiple trigger events while active (e.g., add items to a pool/queue rather
 * than creating new scene instances).
 *
 * - Discovery: `static isTriggerable = true` flags the scene as persistent for
 *   managers/factories that support in-place triggering.
 * - Behavior: implement `handleTrigger(payload?)` to define reactions (enqueue,
 *   merge, toggle, amplify, etc.).
 * - Payloads: currently `unknown` to avoid tight coupling; consult the
 *   triggering code path for expected shapes until stricter typing is added.
 */
export abstract class TriggerableSceneElement extends SceneElement {
  static isTriggerable = true;

  /**
   * React to a trigger while the scene is active.
   * Subclasses should avoid direct state mutation that violates the inherited
   * lifecycle; prefer scheduling child changes or adjusting internal queues.
   * @param payload Optional event payload
   */
  abstract handleTrigger(payload?: unknown): void;
}
