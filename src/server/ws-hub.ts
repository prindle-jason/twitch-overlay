import { WebSocketServer, WebSocket } from "ws";
import http, { IncomingMessage } from "http";
import type { ClientRole, ClientSession, WsMessage } from "./ws-types.js";
import { WsMessageRouter, HandlerResult } from "./ws-message-router.js";
import { logger } from "../utils/logger.js";

export class WsHub {
  private wss: WebSocketServer;
  private overlayClients = new Map<number, ClientSession>();
  private dashboardClients = new Map<number, ClientSession>();
  private clientIdSeq = 0;
  private router = new WsMessageRouter();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/overlay-ws" });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const id = ++this.clientIdSeq;
    const session: ClientSession = { id, ws };
    logger.info(
      `[WS] Client #${id} connected from ${req.socket.remoteAddress}`
    );

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        const result = this.router.handle(session, msg);
        this.executeHandlerResult(result, session);
      } catch (err) {
        logger.error(`[WS] Client #${id} message parse error:`, err);
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      const roleLabel = session.role ? ` (${session.role})` : "";
      logger.info(
        `[WS] Client #${id}${roleLabel} disconnected: code=${code} reason="${reason.toString()}"`
      );
      this.removeClientFromRole(session);
    });

    ws.on("error", (err: Error) => {
      logger.error(`[WS] Client #${id} error:`, err.message);
    });
  }

  private addClientToRole(session: ClientSession) {
    if (session.role === "overlay") {
      this.overlayClients.set(session.id, session);
    } else if (session.role === "dashboard") {
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

      case "role-assigned":
        this.addClientToRole(session);
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

  broadcast(payload: WsMessage, targetRole?: ClientRole) {
    const msgStr = JSON.stringify(payload);
    const clients = this.getClientsByRole(targetRole);

    let sent = 0;
    for (const session of clients) {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(msgStr);
        sent++;
      }
    }

    // Log non-stats messages to avoid spam
    if (payload.type !== "stats-response" && payload.type !== "get-stats") {
      const targetLabel = targetRole ? ` to ${targetRole}` : " to all";
      logger.debug(
        `[BROADCAST] sent to ${sent} client(s)${targetLabel}:`,
        payload
      );
    }
  }

  getStats() {
    return {
      total: this.overlayClients.size + this.dashboardClients.size,
      overlay: this.overlayClients.size,
      dashboard: this.dashboardClients.size,
    };
  }
}
