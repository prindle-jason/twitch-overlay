import type { Element } from "../elements/primitives/Element";
import type { PoolType, SceneType } from "./SceneTypes";

/**
 * Lifecycle events emitted by Element instances via EventBus.
 * Used for diagnostics, memory tracking, and debugging.
 */
export type LifecycleEventType = "element-created" | "element-finished";

/**
 * Settings events emitted when overlay configuration changes.
 * Used to propagate volume, pause state, and other global settings.
 */
export type SettingsEventType =
  | "global-paused"
  | "global-resumed"
  | "global-volume-changed"
  | "global-stability-changed"
  | "instability-toggled"
  | "instability-state-changed";

/**
 * Internal spawn requests emitted by scene translators.
 */
export type SpawnIntentDetail =
  | {
      kind: "scene";
      sceneType: SceneType;
      payload?: Record<string, unknown>;
    }
  | {
      kind: "pool";
      poolType: PoolType;
      payload?: Record<string, unknown>;
    };

export type InternalEventType = "spawn-intent";
export type DvdInternalEventType = "dvd-hit-corner";

/**
 * All known event types in the system.
 */
export type EventType =
  | LifecycleEventType
  | SettingsEventType
  | InternalEventType
  | DvdInternalEventType;

/**
 * Event detail payloads for each event type.
 */
export interface EventDetailMap {
  "element-created": { ctor: string; instance: Element };
  "element-finished": { ctor: string; instance: Element };
  "global-paused": { paused: true };
  "global-resumed": { paused: false };
  "global-volume-changed": { masterVolume: number };
  "global-stability-changed": { stability: number };
  "instability-toggled": { instabilityEnabled: boolean };
  "instability-state-changed": {
    instabilityEnabled: boolean;
    timeUntilNextEventMs: number | null;
    stability: number;
  };
  "spawn-intent": SpawnIntentDetail;
  "dvd-hit-corner": { ctor: string; instance: Element };
}

/**
 * Generic event structure emitted via EventBus.
 */
export interface BusEvent<T extends EventType = EventType> {
  type: T;
  detail: EventDetailMap[T];
}
