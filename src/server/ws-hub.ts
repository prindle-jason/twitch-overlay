import { WebSocketServer, WebSocket } from "ws";
import http, { IncomingMessage } from "http";
import type { ClientRole, ClientSession, WsMessage } from "./ws-types.js";
import { WsMessageRouter } from "./ws-message-router.js";
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
        this.router.handle(
          session,
          msg,
          this.broadcast.bind(this),
          this.sendToClient.bind(this),
          () => this.addClientToRole(session)
        );
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

  broadcast(payload: WsMessage, targetRole?: ClientRole) {
    const msgStr = JSON.stringify(payload);
    const targetMap =
      targetRole === "overlay"
        ? this.overlayClients
        : targetRole === "dashboard"
        ? this.dashboardClients
        : null;

    let sent = 0;

    if (targetMap) {
      for (const session of targetMap.values()) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(msgStr);
          sent++;
        }
      }
    } else {
      // Send to all
      for (const session of this.overlayClients.values()) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(msgStr);
          sent++;
        }
      }
      for (const session of this.dashboardClients.values()) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(msgStr);
          sent++;
        }
      }
    }

    const targetLabel = targetRole ? ` to ${targetRole}` : " to all";
    if (payload.type !== "stats-response" && payload.type !== "get-stats") {
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
