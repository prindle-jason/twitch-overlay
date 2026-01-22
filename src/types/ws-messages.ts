import type { PoolType, SceneType } from "./SceneTypes";
import type { Settings } from "./settings";

/**
 * WebSocket message types form a discriminated union using `type` as the discriminator.
 * TypeScript will automatically narrow the message type based on the `type` field value.
 */

// Connection handshake messages
export interface HelloMessage {
  type: "hello";
  role: "overlay" | "dashboard";
}

export interface HelloAckMessage {
  type: "hello-ack";
  role: "overlay" | "dashboard";
  ts?: number;
}

// Heartbeat messages
export interface PingMessage {
  type: "ping";
}

export interface PongMessage {
  type: "pong";
  ts?: number;
}

// Stats messages
export interface GetStatsMessage {
  type: "get-stats";
}

export interface StatsResponseMessage {
  type: "stats-response";
  stats: {
    fps: number;
    frameMsAvg: number;
    activeScenes: number;
    wsReadyState: number | null;
    timestamp: number;
    memory: {
      totalCreated: number;
      totalFinished: number;
      active: number;
      byClass: Record<string, number>;
    };
  };
}

// Scene event message
export interface SceneEventMessage {
  type: "scene-event";
  sceneType: SceneType;
  payload?: Record<string, unknown>;
}

export interface PoolEventMessage {
  type: "pool-event";
  poolType: PoolType;
  payload?: Record<string, unknown>;
}

// Settings message - settings is a discriminated union with target as the discriminator
export interface SetSettingsMessage {
  type: "set-settings";
  settings: Settings;
}

// Clear scenes message
export interface ClearScenesMessage {
  type: "clear-scenes";
}

// Discriminated union of all message types
export type WsMessage =
  | HelloMessage
  | HelloAckMessage
  | PingMessage
  | PongMessage
  | GetStatsMessage
  | StatsResponseMessage
  | SceneEventMessage
  | PoolEventMessage
  | SetSettingsMessage
  | ClearScenesMessage;

/**
 * Union of all valid message type literals, derived from WsMessage.
 * This ensures type safety - you cannot create a message interface with a type
 * that isn't included in WsMessage, and vice versa.
 */
export type WsMessageType = WsMessage["type"];
