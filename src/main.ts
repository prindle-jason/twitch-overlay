import { connectWS, getWS } from "./utils/wsUtil";
import { Health } from "./utils/health";
import { SceneManager } from "./core/SceneManager";
import { SceneFactory } from "./core/SceneFactory";
import { canvasConfig } from "./config";
import { OverlaySettings } from "./core/OverlaySettings";
import { setOverlayContainer } from "./utils/overlayContainer";
import { logger } from "./utils/logger";

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
const sceneFactory = new SceneFactory();
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
        ws.send(
          JSON.stringify({
            type: "stats-response",
            payload: stats,
          })
        );
      } else {
        logger.warn("[overlay] ws not ready or not open");
      }
    }

    if (msg.type === "effect-event") {
      const effectType = msg.payload?.effectType as string;
      logger.info("[overlay] handling effect event:", effectType, msg.payload);

      // Handle persistent effects separately
      if (effectType === "dvdBounce") {
        sceneManager.handleEvent(effectType, msg.payload);
      } else {
        // Create and add other effects through factory
        const scene = sceneFactory.create(effectType, msg.payload);
        if (scene) {
          sceneManager.addScene(scene);
        }
      }
    }

    if (msg.type === "set-settings") {
      sceneManager.applySettings((msg.payload || {}) as OverlaySettings);
    }

    if (msg.type === "clear-effects") {
      logger.info("[overlay] clearing all effects");
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
