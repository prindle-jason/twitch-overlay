import type { ClientRole, ClientSession, WsMessage } from "./ws-types";

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
      console.log(`[WS] Client #${session.id} identified as "${session.role}"`);
      if (onRoleAssigned) onRoleAssigned();
      sendToClient(session, {
        type: "hello-ack",
        role: session.role,
        ts: Date.now(),
      });
    },

    ping: (session, msg, broadcast, sendToClient) => {
      //console.log(`[WS] Client #${session.id} sent ping`);
      sendToClient(session, { type: "pong", ts: Date.now() });
    },

    "get-stats": (session, msg, broadcast, sendToClient) => {
      //   console.log(
      //     `[WS] Client #${session.id} with role ${session.role} requested stats`
      //   );
      if (session.role === "dashboard") {
        //console.log(`[WS] Client #${session.id} (dashboard) requesting stats`);
        broadcast({ type: "get-stats" }, "overlay");
      }
    },

    "stats-response": (session, msg, broadcast, sendToClient) => {
      if (session.role === "overlay") {
        // console.log(
        //   `[WS] Client #${session.id} (overlay) sending stats response`
        // );
        broadcast(
          { type: "stats-response", payload: msg.payload },
          "dashboard"
        );
      }
    },

    "spawn-effect": (session, msg, broadcast, sendToClient) => {
      console.log(`[WS] Client #${session.id} spawning effect:`, msg.payload);
      broadcast({ type: "spawn-effect", payload: msg.payload }, "overlay");
    },

    "set-settings": (session, msg, broadcast, sendToClient) => {
      console.log(`[WS] Client #${session.id} set settings:`, msg.payload);
      broadcast({ type: "set-settings", payload: msg.payload }, "overlay");
    },

    "clear-effects": (session, msg, broadcast, sendToClient) => {
      console.log(`[WS] Client #${session.id} clearing effects`);
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
    //console.log(`[WS] Client #${session.id} message:`, msg);

    const handler = this.handlers[msg.type];
    if (handler) {
      handler(session, msg, broadcast, sendToClient, onRoleAssigned);
    } else {
      console.log(
        `[WS] Client #${session.id} sent unhandled message type: ${msg.type}`
      );
    }
  }
}
