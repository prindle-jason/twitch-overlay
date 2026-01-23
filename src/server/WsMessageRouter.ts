import type { ClientRole, ClientSession } from "./ClientSession.js";
import type { WsMessage } from "../types/ws-messages.js";
import { logger } from "../utils/logger.js";

/**
 * Result of message handling that determines what the WebSocketManager should do next.
 *
 * - `broadcast`: Send message to clients, optionally filtered by role
 * - `reply`: Send response only to the originating client
 * - `role-assignment`: Assign role to client and send response
 * - `none`: No action (message processed, no response needed)
 */
export type HandlerResult =
  | { action: "broadcast"; message: WsMessage; targetRole?: ClientRole }
  | { action: "reply"; message: WsMessage }
  | { action: "role-assignment"; role: ClientRole; message: WsMessage }
  | { action: "none" };

/**
 * Creates a broadcast result for sending a message to clients.
 */
function broadcast(message: WsMessage, targetRole?: ClientRole): HandlerResult {
  return { action: "broadcast", message, targetRole };
}

/**
 * Creates a reply result for sending a response to the originating client.
 */
function reply(message: WsMessage): HandlerResult {
  return { action: "reply", message };
}

/**
 * Creates a role-assignment result for assigning a role and sending acknowledgment.
 */
function assignRole(role: ClientRole, message: WsMessage): HandlerResult {
  return { action: "role-assignment", role, message };
}

/**
 * Creates a no-op result for messages that require no response.
 */
function none(): HandlerResult {
  return { action: "none" };
}

/**
 * Static message router that dispatches WebSocket messages to handlers.
 *
 * Routes incoming messages based on their `type` field and returns a {@link HandlerResult}
 * describing the action the {@link WebSocketManager} should take. Pure function with no state.
 *
 * Handles:
 * - Role assignment (hello handshake)
 * - Heartbeat (ping/pong)
 * - Statistics queries
 * - Scene and pool event triggers
 * - Settings changes
 * - Scene clearing
 */
export class WsMessageRouter {
  /**
   * Handles an incoming WebSocket message and returns the appropriate action.
   *
   * @param session - The client session sending the message
   * @param msg - The message to handle
   * @returns Handler result describing what action to take next
   */
  static handle(session: ClientSession, msg: WsMessage): HandlerResult {
    switch (msg.type) {
      case "hello": {
        return assignRole(msg.role, {
          type: "hello-ack",
          role: msg.role,
          ts: Date.now(),
        });
      }

      case "ping":
        return reply({ type: "pong", ts: Date.now() });

      case "get-stats":
        if (session.role === "dashboard") {
          return broadcast({ type: "get-stats" }, "overlay");
        }
        return none();

      case "stats-response":
        if (session.role === "overlay") {
          return broadcast(msg, "dashboard");
        }
        return none();

      case "settings-broadcast":
        return broadcast(msg, "dashboard");

      case "instability-request":
        if (session.role === "dashboard") {
          return broadcast({ type: "instability-request" }, "overlay");
        }
        return none();

      case "instability-broadcast":
        if (session.role === "overlay") {
          logger.info("[router] broadcasting instability state:", msg);
          return broadcast(msg, "dashboard");
        }
        return none();

      case "clear-scenes":
      case "pool-event":
      case "scene-event":
      case "set-settings":
        return broadcast(msg, "overlay");

      case "hello-ack":
      case "pong":
      default:
        return none();
    }
  }
}
