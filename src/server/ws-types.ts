import { WebSocket } from "ws";

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
  | "effect-event"
  | "set-settings"
  | "clear-effects";

export interface WsMessage {
  type: WsMessageType;
  role?: ClientRole;
  payload?: Record<string, unknown>;
  ts?: number;
}
