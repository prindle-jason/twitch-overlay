import type { Element } from "../elements/Element";

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
  | "global-volume-changed";

/**
 * All known event types in the system.
 */
export type EventType = LifecycleEventType | SettingsEventType;

/**
 * Event detail payloads for each event type.
 */
export interface EventDetailMap {
  "element-created": { ctor: string; instance: Element };
  "element-finished": { ctor: string; instance: Element };
  "global-paused": { paused: true };
  "global-resumed": { paused: false };
  "global-volume-changed": { masterVolume: number };
}

/**
 * Generic event structure emitted via EventBus.
 */
export interface BusEvent<T extends EventType = EventType> {
  type: T;
  detail: EventDetailMap[T];
}
