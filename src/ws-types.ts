export type ClientRole = "overlay" | "dashboard";

export interface WsMessage {
  type: string;
  role?: ClientRole;
  payload?: Record<string, unknown>;
  ts?: number;
}
