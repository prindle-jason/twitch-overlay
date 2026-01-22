import { WebSocket } from "ws";

export type ClientRole = "overlay" | "dashboard";

export interface ClientSession {
  id: number;
  ws: WebSocket;
  role?: ClientRole;
}
