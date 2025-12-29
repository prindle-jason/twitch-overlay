import { WebSocketServer, WebSocket } from "ws";
import http from "http";

export type ClientRole = "overlay" | "dashboard";

export interface ClientSession {
  id: number;
  ws: WebSocket;
  role?: ClientRole;
}

export interface WsMessage {
  type: string;
  role?: ClientRole;
  payload?: Record<string, unknown>;
  ts?: number;
}

export class WsHub {
  private wss: WebSocketServer;
  private clients = new Map<number, ClientSession>();
  private clientIdSeq = 0;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/overlay-ws" });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
  }

  private handleConnection(ws: WebSocket, req: any) {
    const id = ++this.clientIdSeq;
    const session: ClientSession = { id, ws };
    this.clients.set(id, session);
    console.log(
      `[WS] Client #${id} connected from ${req.socket.remoteAddress}`
    );

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        this.handleClientMessage(session, msg);
      } catch (err) {
        console.error(`[WS] Client #${id} message parse error:`, err);
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      const roleLabel = session.role ? ` (${session.role})` : "";
      console.log(
        `[WS] Client #${id}${roleLabel} disconnected: code=${code} reason="${reason.toString()}"`
      );
      this.clients.delete(id);
    });

    ws.on("error", (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[WS] Client #${id} error:`, errMsg);
    });
  }

  private handleClientMessage(session: ClientSession, msg: WsMessage) {
    console.log(`[WS] Client #${session.id} message:`, msg);

    switch (msg.type) {
      case "hello":
        session.role = msg.role ?? "overlay";
        console.log(
          `[WS] Client #${session.id} identified as "${session.role}"`
        );
        // Acknowledge the hello
        this.sendToClient(session, {
          type: "hello-ack",
          role: session.role,
          ts: Date.now(),
        });
        break;

      case "ping":
        console.log(`[WS] Client #${session.id} sent ping`);
        this.sendToClient(session, { type: "pong", ts: Date.now() });
        break;

      case "get-stats":
        // Route from dashboard to overlay clients
        console.log(
          `[WS] Client #${session.id} with role ${session.role} requested stats`
        );
        if (session.role === "dashboard") {
          console.log(
            `[WS] Client #${session.id} (dashboard) requesting stats`
          );
          this.broadcast({ type: "get-stats" }, "overlay");
        }
        break;

      case "stats-response":
        // Route from overlay back to dashboard clients
        if (session.role === "overlay") {
          console.log(
            `[WS] Client #${session.id} (overlay) sending stats response`
          );
          this.broadcast(
            { type: "stats-response", payload: msg.payload },
            "dashboard"
          );
        }
        break;

      case "spawn-effect":
        // Route to overlay clients (from dashboard WS or Streamer.bot REST)
        console.log(`[WS] Client #${session.id} spawning effect:`, msg.payload);
        this.broadcast(
          { type: "spawn-effect", payload: msg.payload },
          "overlay"
        );
        break;

      default:
        console.log(
          `[WS] Client #${session.id} sent unhandled message type: ${msg.type}`
        );
    }
  }

  private sendToClient(session: ClientSession, msg: WsMessage) {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(msg));
    }
  }

  broadcast(payload: WsMessage, targetRole?: ClientRole) {
    const msgStr = JSON.stringify(payload);
    let sent = 0;

    for (const session of this.clients.values()) {
      if (
        session.ws.readyState === WebSocket.OPEN &&
        (!targetRole || session.role === targetRole)
      ) {
        session.ws.send(msgStr);
        sent++;
      }
    }

    const targetLabel = targetRole ? ` to ${targetRole}` : " to all";
    console.log(
      `[BROADCAST] sent to ${sent} client(s)${targetLabel}:`,
      payload
    );
  }

  getStats() {
    const overlayCount = Array.from(this.clients.values()).filter(
      (s) => s.role === "overlay"
    ).length;
    const dashboardCount = Array.from(this.clients.values()).filter(
      (s) => s.role === "dashboard"
    ).length;
    return {
      total: this.clients.size,
      overlay: overlayCount,
      dashboard: dashboardCount,
    };
  }
}
