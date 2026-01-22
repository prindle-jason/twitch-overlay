import { SceneManager } from "./SceneManager";
import { Health } from "../utils/health";
import { WebSocketClient } from "../core/WebSocketClient";
import { logger } from "../utils/logger";
import type {
  WsMessage,
  StatsResponseMessage,
  SceneEventMessage,
  SetSettingsMessage,
  PoolEventMessage,
} from "../types/ws-messages";

export class OverlayController {
  constructor(
    private sceneManager: SceneManager,
    private health: Health,
  ) {
    // Expose active elements to console for debugging
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "activeElements", {
        get: () => health.getActiveElements(),
        enumerable: true,
      });
    }
  }

  handleMessage(msg: WsMessage, wsClient: WebSocketClient): void {
    if (!msg?.type) return;

    if (msg.type === "get-stats") {
      this.handleGetStats(wsClient);
    }

    if (msg.type === "scene-event") {
      this.handleSceneEvent(msg);
    }

    if (msg.type === "pool-event") {
      this.handlePoolEvent(msg);
    }

    if (msg.type === "set-settings") {
      this.handleSetSettings(msg);
    }

    if (msg.type === "clear-scenes") {
      this.handleClearScenes();
    }
  }

  private handleGetStats(wsClient: WebSocketClient): void {
    const activeScenes = this.sceneManager.getSceneCount();
    const stats = this.health.snapshot({
      activeScenes,
      wsReadyState: wsClient.isConnected() ? WebSocket.OPEN : WebSocket.CLOSED,
    });
    const response: StatsResponseMessage = {
      type: "stats-response",
      stats,
    };
    wsClient.send(response);
  }

  private handleSceneEvent(msg: SceneEventMessage): void {
    logger.info("[overlay] handling scene event:", msg.sceneType, msg.payload);
    this.sceneManager.handleSceneEvent(msg.sceneType, msg.payload);
  }

  private handlePoolEvent(msg: PoolEventMessage): void {
    logger.info("[overlay] handling pool event:", msg.poolType, msg.payload);
    this.sceneManager.handlePoolEvent(msg.poolType, msg.payload);
  }

  private handleSetSettings(msg: SetSettingsMessage): void {
    const target = msg.settings.target;

    if (target === "global") {
      logger.info("[overlay] applying global settings:", msg.settings);
      this.sceneManager.applySettings(msg.settings);
    } else {
      // Apply scene-specific settings
      logger.info(
        "[overlay] applying scene settings for",
        target,
        ":",
        msg.settings,
      );
      this.sceneManager.configureScene(target, msg.settings);
    }
  }

  private handleClearScenes(): void {
    logger.info("[overlay] clearing all scenes");
    this.sceneManager.clearAll();
    this.health.reset();
  }
}
