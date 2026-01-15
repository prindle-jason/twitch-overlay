import type {
  ClientRole,
  ClientSession,
  HelloMessage,
  PingMessage,
  GetStatsMessage,
  StatsResponseMessage,
  SceneEventMessage,
  SetSettingsMessage,
  ClearScenesMessage,
  WsMessage,
} from "./ws-types";
import { logger } from "../utils/logger.js";

// Handler result types - what should happen after processing a message
export type HandlerResult =
  | { action: "broadcast"; message: WsMessage; targetRole?: ClientRole }
  | { action: "reply"; message: WsMessage }
  | { action: "role-assigned"; role: ClientRole; message: WsMessage }
  | { action: "none" };

export type MessageHandler<T extends WsMessage = WsMessage> = (
  session: ClientSession,
  msg: T
) => HandlerResult;

export class WsMessageRouter {
  private readonly handlers = {
    hello: (session: ClientSession, msg: HelloMessage): HandlerResult => {
      const role = msg.role ?? "overlay";
      session.role = role;
      logger.info(`[WS] Client #${session.id} identified as "${role}"`);
      return {
        action: "role-assigned",
        role,
        message: {
          type: "hello-ack",
          role,
          ts: Date.now(),
        },
      };
    },

    "hello-ack": (session: ClientSession, _msg: WsMessage): HandlerResult => {
      return { action: "none" };
    },

    ping: (session: ClientSession, _msg: PingMessage): HandlerResult => {
      return {
        action: "reply",
        message: { type: "pong", ts: Date.now() },
      };
    },

    pong: (session: ClientSession, _msg: WsMessage): HandlerResult => {
      return { action: "none" };
    },

    "get-stats": (
      session: ClientSession,
      _msg: GetStatsMessage
    ): HandlerResult => {
      if (session.role === "dashboard") {
        return {
          action: "broadcast",
          message: { type: "get-stats" },
          targetRole: "overlay",
        };
      }
      return { action: "none" };
    },

    "stats-response": (
      session: ClientSession,
      msg: StatsResponseMessage
    ): HandlerResult => {
      if (session.role === "overlay") {
        return {
          action: "broadcast",
          message: msg,
          targetRole: "dashboard",
        };
      }
      return { action: "none" };
    },

    "scene-event": (
      session: ClientSession,
      msg: SceneEventMessage
    ): HandlerResult => {
      logger.info(
        `[WS] Client #${session.id} spawning effect: ${msg.sceneType}`,
        msg.payload
      );
      return {
        action: "broadcast",
        message: msg,
        targetRole: "overlay",
      };
    },

    "set-settings": (
      session: ClientSession,
      msg: SetSettingsMessage
    ): HandlerResult => {
      logger.info(`[WS] Client #${session.id} set settings:`, msg.settings);
      return {
        action: "broadcast",
        message: msg,
        targetRole: "overlay",
      };
    },

    "clear-scenes": (
      session: ClientSession,
      msg: ClearScenesMessage
    ): HandlerResult => {
      logger.info(`[WS] Client #${session.id} clearing scenes`);
      return {
        action: "broadcast",
        message: msg,
        targetRole: "overlay",
      };
    },
  };

  handle(session: ClientSession, msg: WsMessage): HandlerResult {
    const handler = this.handlers[msg.type];
    if (!handler) {
      logger.warn(
        `[WS] Client #${session.id} sent unhandled message type: ${msg.type}`
      );
      return { action: "none" };
    }

    return handler(session, msg as any);
  }
}
