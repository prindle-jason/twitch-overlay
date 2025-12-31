//import { EffectManager } from "../core/EffectManager.ts";
import { connectWS, getWS } from "./utils/wsUtil";
import { Health } from "./utils/health";
import { EffectManager } from "./core/EffectManager";
import { canvasConfig } from "./config";
import { OverlaySettings } from "./core/OverlaySettings";

const canvasWidth = canvasConfig.W;
const canvasHeight = canvasConfig.H;

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}
const ctx = canvas.getContext("2d")!; // Assert non-null 2D context
canvas.width = canvasConfig.W;
canvas.height = canvasConfig.H;

const effectManager = new EffectManager();
const health = new Health();

function startApp() {
  console.log("[overlay] startApp invoked", {
    time: new Date().toISOString(),
    url: window.location.href,
  });

  connectWS();

  window.addEventListener("beforeunload", () => {
    console.log("[overlay] beforeunload fired");
  });

  window.addEventListener("visibilitychange", () => {
    console.log("[overlay] visibilitychange", document.visibilityState);
  });

  window.addEventListener("pagehide", (ev) => {
    console.log("[overlay] pagehide", {
      persisted: (ev as PageTransitionEvent).persisted,
    });
  });

  window.addEventListener("overlay-ws-event", (ev: Event) => {
    const custom = ev as CustomEvent<any>;
    const msg = custom.detail;
    if (!msg?.type) return;
    //console.log("[overlay] received WS event:", msg);

    if (msg.type === "get-stats") {
      //console.log("[overlay] responding to get-stats request");
      const ws = getWS();
      // console.log(
      //   "[overlay] ws:",
      //   ws,
      //   "readyState:",
      //   ws?.readyState,
      //   "OPEN:",
      //   WebSocket.OPEN
      // );
      if (ws && ws.readyState === WebSocket.OPEN) {
        //console.log("[overlay] sending stats-response");
        const counts = effectManager.getCounts();
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
        console.log("[overlay] ws not ready or not open");
      }
    }

    if (msg.type === "spawn-effect") {
      const effectType = msg.payload?.effectType as string;
      console.log("[overlay] spawning effect:", effectType, msg.payload);
      effectManager.spawn(effectType, msg.payload);
    }

    if (msg.type === "set-settings") {
      effectManager.applySettings((msg.payload || {}) as OverlaySettings);
      // console.log("[overlay] settings updated", {
      //   paused: effectManager.isPaused(),
      // });
    }

    if (msg.type === "clear-effects") {
      console.log("[overlay] clearing all effects");
      effectManager.clearAll();
    }
  });

  requestAnimationFrame(loop);
}

// function spawn(type: string, opts: unknown) {
//   effectManager.spawn(type, opts as any);
// }

let lastFrame = performance.now();
function loop() {
  const now = performance.now();
  const deltaTime = now - lastFrame;
  lastFrame = now;

  health.recordFrame(deltaTime);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  //ctx.fillStyle = "green";
  //ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  effectManager.update(deltaTime);
  effectManager.draw(ctx);
  //effectManager.draw(ctx);

  requestAnimationFrame(loop);
}

window.addEventListener("load", startApp);
