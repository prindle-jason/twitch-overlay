import { EffectManager } from "./core/EffectManager.js";
import { connectWS } from "./utils/wsUtil.js";

const W = 1920,
  H = 1080;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = W;
canvas.height = H;

const effectManager = new EffectManager({ W, H });

function startApp() {
  connectWS();

  window.addEventListener("overlay-ws-event", (ev) => {
    const msg = ev.detail;
    if (!msg.type) return;
    console.log("[overlay] event:", msg);
    spawn(msg.type, msg);
  });

  requestAnimationFrame(loop);
}

function spawn(type, opts) {
  effectManager.spawn(type, opts);
}

let lastFrame = performance.now();
function loop() {
  const now = performance.now();
  const deltaTime = now - lastFrame;
  lastFrame = now;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, W, H);
  effectManager.update(deltaTime);
  effectManager.draw(ctx);

  requestAnimationFrame(loop);
}

// Start the app on window load
window.addEventListener("load", startApp);
