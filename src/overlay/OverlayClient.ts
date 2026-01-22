import { WebSocketClient } from "../core/WebSocketClient";
import { Health } from "../utils/health";
import { SceneManager } from "./SceneManager";
import { logger } from "../utils/logger";
import { OverlayController } from "./OverlayController";
import { configProps } from "../core/configProps";
import type { WsMessage } from "../types/ws-messages";

export class OverlayClient {
  private wsClient: WebSocketClient;
  private sceneManager: SceneManager;
  private health: Health;
  private controller: OverlayController;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastFrame: number = performance.now();

  constructor() {
    // Initialize canvas
    const canvas = document.getElementById(
      "canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error("Canvas element not found");
    }
    this.canvas = canvas;
    this.canvas.width = configProps.canvas.W;
    this.canvas.height = configProps.canvas.H;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    // Initialize managers and client
    this.wsClient = new WebSocketClient(
      `ws://${window.location.host}/overlay-ws`,
    );
    this.sceneManager = new SceneManager();
    this.health = new Health();
    this.controller = new OverlayController(this.sceneManager, this.health);
  }

  start(): void {
    logger.info("[overlay] OverlayClient starting", {
      time: new Date().toISOString(),
      url: window.location.href,
    });

    // Set up WebSocket event handlers
    this.wsClient.onConnected(() => {
      logger.info("[overlay] WS connected");
      this.wsClient.send({ type: "hello", role: "overlay" });
    });

    this.wsClient.onDisconnected(() => {
      logger.info("[overlay] WS disconnected");
    });

    this.wsClient.onError((error: Error) => {
      logger.warn("[overlay] WS error:", error.message);
    });

    this.wsClient.onMessage((msg: WsMessage) => {
      this.controller.handleMessage(msg, this.wsClient);
    });

    // Connect and start animation loop
    this.wsClient.connect();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastFrame;
    this.lastFrame = now;

    this.health.recordFrame(deltaTime);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (configProps.debugMode) {
      this.ctx.fillStyle = "green";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.sceneManager.update(this.ctx, deltaTime);

    requestAnimationFrame(this.loop);
  };
}
