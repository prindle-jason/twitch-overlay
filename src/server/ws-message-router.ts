import type { ClientRole, ClientSession, WsMessage } from "./ws-types";
import { logger } from "../utils/logger.js";

export type MessageHandler = (
  session: ClientSession,
  msg: WsMessage,
  broadcast: (payload: WsMessage, targetRole?: ClientRole) => void,
  sendToClient: (session: ClientSession, msg: WsMessage) => void,
  onRoleAssigned?: () => void
) => void;

export class WsMessageRouter {
  private readonly handlers: Record<string, MessageHandler> = {
    hello: (session, msg, broadcast, sendToClient, onRoleAssigned) => {
      session.role = msg.role ?? "overlay";
      logger.info(`[WS] Client #${session.id} identified as "${session.role}"`);
      if (onRoleAssigned) onRoleAssigned();
      sendToClient(session, {
        type: "hello-ack",
        role: session.role,
        ts: Date.now(),
      });
    },

    ping: (session, msg, broadcast, sendToClient) => {
      sendToClient(session, { type: "pong", ts: Date.now() });
    },

    "get-stats": (session, msg, broadcast, sendToClient) => {
      if (session.role === "dashboard") {
        broadcast({ type: "get-stats" }, "overlay");
      }
    },

    "stats-response": (session, msg, broadcast, sendToClient) => {
      if (session.role === "overlay") {
        broadcast(
          { type: "stats-response", payload: msg.payload },
          "dashboard"
        );
      }
    },

    "effect-event": (session, msg, broadcast, sendToClient) => {
      logger.info(`[WS] Client #${session.id} spawning effect:`, msg.payload);
      broadcast({ type: "effect-event", payload: msg.payload }, "overlay");
    },

    "set-settings": (session, msg, broadcast, sendToClient) => {
      logger.info(`[WS] Client #${session.id} set settings:`, msg.payload);
      broadcast({ type: "set-settings", payload: msg.payload }, "overlay");
    },

    "clear-effects": (session, msg, broadcast, sendToClient) => {
      logger.info(`[WS] Client #${session.id} clearing effects`);
      broadcast({ type: "clear-effects" }, "overlay");
    },
  };

  handle(
    session: ClientSession,
    msg: WsMessage,
    broadcast: (payload: WsMessage, targetRole?: ClientRole) => void,
    sendToClient: (session: ClientSession, msg: WsMessage) => void,
    onRoleAssigned?: () => void
  ) {
    const handler = this.handlers[msg.type];
    if (handler) {
      handler(session, msg, broadcast, sendToClient, onRoleAssigned);
    } else {
      logger.warn(
        `[WS] Client #${session.id} sent unhandled message type: ${msg.type}`
      );
    }
  }
}
