import { WebSocketServer, WebSocket } from "ws";
import http, { IncomingMessage } from "http";
import type { ClientRole, ClientSession } from "./ClientSession.js";
import type { WsMessage } from "../types/ws-messages.js";
import { WsMessageRouter, HandlerResult } from "./WsMessageRouter.js";
import { logger } from "../utils/logger.js";

/**
 * Manages WebSocket connections, client roles, and message broadcasting.
 *
 * Responsibilities:
 * - Accept and track WebSocket connections with role assignment (overlay/dashboard)
 * - Parse incoming messages and dispatch to {@link WsMessageRouter}
 * - Execute handler results (broadcast, reply, role assignment)
 * - Handle connection lifecycle events (connect, disconnect, error)
 * - Broadcast messages to specific client roles or all clients
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private overlayClients = new Map<number, ClientSession>();
  private dashboardClients = new Map<number, ClientSession>();
  private clientIdSeq = 0;

  /**
   * Creates a WebSocket server on the provided HTTP server.
   * @param server - HTTP server to attach the WebSocket server to
   */
  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/overlay-ws" });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const id = ++this.clientIdSeq;
    const session: ClientSession = { id, ws };
    logger.info(
      `[WS] Client #${id} connected from ${req.socket.remoteAddress}`,
    );

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        const result = WsMessageRouter.handle(session, msg);
        this.executeHandlerResult(result, session);
      } catch (err) {
        logger.error(`[WS] Client #${id} message parse error:`, err);
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      const roleLabel = session.role ? ` (${session.role})` : "";
      logger.info(
        `[WS] Client #${id}${roleLabel} disconnected: code=${code} reason="${reason.toString()}"`,
      );
      this.removeClientFromRole(session);
    });

    ws.on("error", (err: Error) => {
      logger.error(`[WS] Client #${id} error:`, err.message);
    });
  }

  private addClientToRole(session: ClientSession, role: ClientRole) {
    session.role = role;
    if (role === "overlay") {
      this.overlayClients.set(session.id, session);
    } else if (role === "dashboard") {
      this.dashboardClients.set(session.id, session);
    }
  }

  private removeClientFromRole(session: ClientSession) {
    if (session.role === "overlay") {
      this.overlayClients.delete(session.id);
    } else if (session.role === "dashboard") {
      this.dashboardClients.delete(session.id);
    }
  }

  private sendToClient(session: ClientSession, msg: WsMessage) {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(msg));
    }
  }

  private executeHandlerResult(result: HandlerResult, session: ClientSession) {
    switch (result.action) {
      case "broadcast":
        this.broadcast(result.message, result.targetRole);
        break;

      case "reply":
        this.sendToClient(session, result.message);
        break;

      case "role-assignment":
        this.addClientToRole(session, result.role);
        this.sendToClient(session, result.message);
        break;

      case "none":
        // Do nothing
        break;
    }
  }

  private getClientsByRole(role?: ClientRole): ClientSession[] {
    if (role === "overlay") {
      return Array.from(this.overlayClients.values());
    }
    if (role === "dashboard") {
      return Array.from(this.dashboardClients.values());
    }
    // No role specified - return all clients
    return [...this.overlayClients.values(), ...this.dashboardClients.values()];
  }

  /**
   * Broadcasts a message to connected clients, optionally filtered by role.
   * Includes error handling per client to prevent partial broadcast failures.
   *
   * @param payload - Message to broadcast
   * @param targetRole - Optional role filter ("overlay" or "dashboard"). If omitted, broadcasts to all clients.
   */
  broadcast(payload: WsMessage, targetRole?: ClientRole) {
    const msgStr = JSON.stringify(payload);
    const clients = this.getClientsByRole(targetRole);

    let sent = 0;
    let failed = 0;
    for (const session of clients) {
      if (session.ws.readyState === WebSocket.OPEN) {
        try {
          session.ws.send(msgStr);
          sent++;
        } catch (err) {
          failed++;
          logger.warn(
            `[BROADCAST] Failed to send to client #${session.id} (${session.role || "unknown"}):`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }

    // Log non-stats messages to avoid spam
    if (payload.type !== "stats-response" && payload.type !== "get-stats") {
      const targetLabel = targetRole ? ` to ${targetRole}` : " to all";
      const failedLabel = failed > 0 ? `, ${failed} failed` : "";
      logger.debug(
        `[BROADCAST] sent to ${sent} client(s)${targetLabel}${failedLabel}:`,
        payload,
      );
    }
  }

  /**
   * Returns current connection statistics.
   * @returns Object with total, overlay, and dashboard client counts
   */
  getStats() {
    return {
      total: this.overlayClients.size + this.dashboardClients.size,
      overlay: this.overlayClients.size,
      dashboard: this.dashboardClients.size,
    };
  }
}
