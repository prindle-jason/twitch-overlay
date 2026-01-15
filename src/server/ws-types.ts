import { WebSocket } from "ws";

export type ClientRole = "overlay" | "dashboard";

export interface ClientSession {
  id: number;
  ws: WebSocket;
  role?: ClientRole;
}

// Base message interface (not used directly)
interface BaseWsMessage {
  type: string;
  ts?: number;
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
  sceneType: string;
  payload?: Record<string, unknown>; // Scene-specific data
}

// Settings message
export interface SetSettingsMessage extends BaseWsMessage {
  type: "set-settings";
  settings: {
    masterVolume?: number;
    stability?: number;
    togglePause?: boolean;
  };
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
  | SetSettingsMessage
  | ClearScenesMessage;

// Type guard helper
export function isMessageType<T extends WsMessage["type"]>(
  msg: WsMessage,
  type: T
): msg is Extract<WsMessage, { type: T }> {
  return msg.type === type;
}
