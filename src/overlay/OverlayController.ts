import { SceneManager } from "./SceneManager";
import { InstabilityManager } from "./InstabilityManager";
import { Health } from "../utils/health";
import { WebSocketClient } from "../core/WebSocketClient";
import { EventBus } from "../core/EventBus";
import { logger } from "../utils/logger";
import { globalSettings } from "./GlobalSettingsStore";
import type {
  WsMessage,
  StatsResponseMessage,
  SceneEventMessage,
  SetSettingsMessage,
  PoolEventMessage,
} from "../types/ws-messages";

export class OverlayController {
  private wsClient: WebSocketClient | null = null;

  constructor(
    private sceneManager: SceneManager,
    private health: Health,
    private instabilityManager: InstabilityManager,
  ) {
    // Expose active elements to console for debugging
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "activeElements", {
        get: () => health.getActiveElements(),
        enumerable: true,
      });
    }

    // Wire up instability system event handlers
    this.setupInstabilityEventListeners();
  }

  /**
   * Set up event listeners for instability system.
   */
  private setupInstabilityEventListeners(): void {
    // When instability toggle is changed
    EventBus.on("instability-toggled", (data) => {
      if (data.instabilityEnabled) {
        this.instabilityManager.enable();
      } else {
        this.instabilityManager.disable();
      }
    });

    // When stability changes, rescale pending event timing
    EventBus.on("global-stability-changed", (data) => {
      this.instabilityManager.onStabilityChanged(data.stability);
    });

    // When instability state meaningfully changes (toggle, reschedule, rescale)
    EventBus.on("instability-state-changed", () => {
      this.sendInstabilityBroadcast();
    });
  }

  handleMessage(msg: WsMessage, wsClient: WebSocketClient): void {
    this.wsClient = wsClient;
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

    if (msg.type === "instability-request") {
      this.handleInstabilityRequest();
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
    if (this.wsClient) {
      this.wsClient.send(response);
    }
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
      const changed = globalSettings.applySettings(msg.settings);

      // Only broadcast if clamped settings differ from previous values
      if (changed) {
        const broadcast = {
          type: "settings-broadcast" as const,
          settings: globalSettings.getSettings(),
        };
        if (this.wsClient) {
          this.wsClient.send(broadcast);
        }
      }
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

  private handleInstabilityRequest(): void {
    this.sendInstabilityBroadcast();
  }

  private sendInstabilityBroadcast(): void {
    if (!this.wsClient) return;
    const message = {
      type: "instability-broadcast" as const,
      enabled: this.instabilityManager.isEnabled(),
      timeUntilNextEventMs: this.instabilityManager.getTimeUntilNextEvent(),
    };
    this.wsClient.send(message);
  }
}
