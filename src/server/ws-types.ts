import { WebSocket } from "ws";
import type { PoolType, SceneType } from "../utils/types";

export type ClientRole = "overlay" | "dashboard";

export interface ClientSession {
  id: number;
  ws: WebSocket;
  role?: ClientRole;
}

export type WsMessageType =
  | "hello"
  | "hello-ack"
  | "ping"
  | "pong"
  | "get-stats"
  | "stats-response"
  | "scene-event"
  | "pool-event"
  | "set-settings"
  | "clear-scenes";

// Base message interface (not used directly)
interface BaseWsMessage {
  type: WsMessageType;
  ts?: number;
}

// Settings types - base interface and implementations
export interface Settings {
  target: "global" | SceneType;
}

export interface GlobalSettings extends Settings {
  target: "global";
  masterVolume?: number;
  stability?: number;
  togglePause?: boolean;
}

export interface HypeChatSettings extends Settings {
  target: "hypeChat";
  minMessageRate?: number;
  maxMessageRate?: number;
  lerpFactor?: number;
}

// Connection handshake messages
export interface HelloMessage extends BaseWsMessage {
  type: "hello";
  role: ClientRole;
}

export interface HelloAckMessage extends BaseWsMessage {
  type: "hello-ack";
  role: ClientRole;
}

// Heartbeat messages
export interface PingMessage extends BaseWsMessage {
  type: "ping";
}

export interface PongMessage extends BaseWsMessage {
  type: "pong";
}

// Stats messages
export interface GetStatsMessage extends BaseWsMessage {
  type: "get-stats";
}

export interface StatsResponseMessage extends BaseWsMessage {
  type: "stats-response";
  stats: {
    fps: number;
    frameMsAvg: number;
    effectsLoading: number;
    effectsPlaying: number;
    wsReadyState: number | null;
    timestamp: number;
  };
}

// Scene event message
export interface SceneEventMessage extends BaseWsMessage {
  type: "scene-event";
  sceneType: SceneType;
  payload?: Record<string, unknown>; // Scene-specific data
}

export interface PoolEventMessage extends BaseWsMessage {
  type: "pool-event";
  poolType: PoolType;
  payload?: Record<string, unknown>;
}

// Settings message - target is now part of settings
export interface SetSettingsMessage extends BaseWsMessage {
  type: "set-settings";
  settings: Settings; // Includes target and all settings
}

// Clear scenes message
export interface ClearScenesMessage extends BaseWsMessage {
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
