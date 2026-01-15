import { connectWS, getWS } from "./utils/wsUtil";
import { Health } from "./utils/health";
import { SceneManager } from "./core/SceneManager";
import { canvasConfig } from "./config";
import { OverlaySettings } from "./core/OverlaySettings";
import { setOverlayContainer } from "./utils/overlayContainer";
import { logger } from "./utils/logger";
import type {
  WsMessage,
  StatsResponseMessage,
  SceneEventMessage,
  SetSettingsMessage,
} from "./server/ws-types";

const canvasWidth = canvasConfig.W;
const canvasHeight = canvasConfig.H;

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}
const overlayContainer = document.getElementById(
  "overlay-container"
) as HTMLElement | null;
if (!overlayContainer) {
  throw new Error("Overlay container not found");
}
setOverlayContainer(overlayContainer);

const ctx = canvas.getContext("2d")!; // Assert non-null 2D context
canvas.width = canvasConfig.W;
canvas.height = canvasConfig.H;

const sceneManager = new SceneManager();
const health = new Health();

function startApp() {
  logger.info("[overlay] startApp invoked", {
    time: new Date().toISOString(),
    url: window.location.href,
  });

  connectWS();

  window.addEventListener("beforeunload", () => {
    logger.debug("[overlay] beforeunload fired");
  });

  window.addEventListener("visibilitychange", () => {
    logger.debug("[overlay] visibilitychange", document.visibilityState);
  });

  window.addEventListener("pagehide", (ev) => {
    logger.debug("[overlay] pagehide", {
      persisted: (ev as PageTransitionEvent).persisted,
    });
  });

  window.addEventListener("overlay-ws-event", (ev: Event) => {
    const custom = ev as CustomEvent<any>;
    const msg = custom.detail;
    if (!msg?.type) return;

    if (msg.type === "get-stats") {
      const ws = getWS();

      if (ws && ws.readyState === WebSocket.OPEN) {
        const counts = sceneManager.getCounts();
        const stats = health.snapshot({
          effectsLoading: counts.loading,
          effectsPlaying: counts.playing,
          wsReadyState: ws.readyState,
        });
        const response: StatsResponseMessage = {
          type: "stats-response",
          stats,
        };
        ws.send(JSON.stringify(response));
      } else {
        logger.warn("[overlay] ws not ready or not open");
      }
    }

    if (msg.type === "scene-event") {
      const sceneMsg = msg as SceneEventMessage;
      logger.info(
        "[overlay] handling scene event:",
        sceneMsg.sceneType,
        sceneMsg.payload
      );

      // Create and add scenes through manager
      sceneManager.handleEvent(sceneMsg.sceneType as any, sceneMsg.payload);
    }

    if (msg.type === "set-settings") {
      const settingsMsg = msg as SetSettingsMessage;
      sceneManager.applySettings(settingsMsg.settings as OverlaySettings);
    }

    if (msg.type === "clear-scenes") {
      logger.info("[overlay] clearing all scenes");
      sceneManager.clearAll();
    }
  });

  requestAnimationFrame(loop);
}

let lastFrame = performance.now();
function loop() {
  const now = performance.now();
  const deltaTime = now - lastFrame;
  lastFrame = now;

  health.recordFrame(deltaTime);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  sceneManager.update(ctx, deltaTime);

  requestAnimationFrame(loop);
}

window.addEventListener("load", startApp);
