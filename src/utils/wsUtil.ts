import { logger } from "./logger";

let globalWs: WebSocket | null = null;

export function connectWS() {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const WS_URL =
    (import.meta as any).env?.VITE_WS_URL ??
    `${scheme}://${location.host}/overlay-ws`;

  function connect() {
    logger.info(`[overlay] WS connecting to ${WS_URL}`);
    globalWs = new WebSocket(WS_URL);

    globalWs.addEventListener("open", () => {
      logger.info("[overlay] WS connected");
      // Identify as overlay client
      globalWs!.send(JSON.stringify({ type: "hello", role: "overlay" }));
    });

    globalWs.addEventListener("message", (ev: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.type) return;
        window.dispatchEvent(
          new CustomEvent("overlay-ws-event", { detail: msg })
        );
      } catch (err) {
        logger.warn("Bad WS message:", err);
      }
    });

    globalWs.addEventListener("close", (ev: CloseEvent) => {
      logger.info(
        `[overlay] WS disconnected (code: ${ev.code}, reason: ${
          ev.reason || "none"
        }, clean: ${ev.wasClean})`
      );
      globalWs = null;
      // Reconnect after 1 second
      setTimeout(() => {
        logger.info(`[overlay] Attempting to reconnect to ${WS_URL}`);
        connect();
      }, 1000);
    });

    globalWs.addEventListener("error", (err: Event) => {
      logger.warn("[overlay] WS error:", err);
      if (globalWs) {
        logger.warn(`[overlay] WS readyState: ${globalWs.readyState}`);
      }
    });
  }

  connect();
}

export function getWS(): WebSocket | null {
  return globalWs;
}
