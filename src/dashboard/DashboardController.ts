import type { WebSocketClient } from "../core/WebSocketClient";
import type { DashboardUI } from "./DashboardUI";
import { SidebarManager, type SidebarState } from "./SidebarManager";
import type { PoolType, SceneType } from "../types/SceneTypes";
import type {
  SceneEventMessage,
  SetSettingsMessage,
  WsMessage,
  PoolEventMessage,
} from "../types/ws-messages";
import type { GlobalSettings, HypeChatSettings } from "../types/settings";
import { logger } from "../utils/logger";
import { localImages } from "../utils/assets/images";

const STORAGE_KEY = "dashboard-section-state";

// Embedded data-driven scene config for testing - simplified sound-only
const DATA_SCENE_CONFIG = {
  "type": "custom-event",
  "scene": {
    "elementType": "DataSceneElement",
    "payload": {
      "childEventListeners": [
        {
          "event": "sound-ended",
          "action": "finish"
        }
      ],
      "children": [
        {
          "elementType": "DataSoundElement",
          "id": "sound1",
          "payload": {
            "audioUrl": "/audio/friends/oh-my-god-shes-insane.mp3",
            "children": [
              {
                "elementType": "DataSoundOnPlayBehavior"
              }
            ]
          }
        }
      ]
    }
  }
};

export class DashboardController {
  private settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private hypeChatDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private wsClient: WebSocketClient,
    private sidebarManager: SidebarManager = new SidebarManager(
      DashboardController.loadSidebarState(),
    ),
  ) {}

  hookAll(ui: DashboardUI): void {
    ui.bindSidebar(this.sidebarManager);
    // Subscribe to sidebar state changes and persist to localStorage
    this.sidebarManager.onChange(() => {
      DashboardController.saveSidebarState(this.sidebarManager.getState());
    });
    this.hookSceneButtons(ui);
    this.hookUtilityButtons(ui);
    this.hookSliders(ui);
    this.hookDevButtons(ui);
    ui.onInstabilityToggle(() => this.toggleInstability());
    ui.onInstabilitySpawn(() => this.spawnInstabilityTicker());
  }

  private hookSceneButtons(ui: DashboardUI): void {
    ui.onButtonClick("successBtn", () => this.dispatchPoolEvent("success"));
    ui.onButtonClick("failureBtn", () => this.dispatchPoolEvent("failure"));
    ui.onButtonClick("bamSuccessBtn", () =>
      this.dispatchSceneEvent("bamSuccess"),
    );
    ui.onButtonClick("bamUhOhBtn", () => this.dispatchSceneEvent("bamUhOh"));
    ui.onButtonClick("ssbmSuccessBtn", () =>
      this.dispatchSceneEvent("ssbmSuccess"),
    );
    ui.onButtonClick("ssbmFailBtn", () => this.dispatchSceneEvent("ssbmFail"));
    ui.onButtonClick("headbladeBtn", () =>
      this.dispatchSceneEvent("headblade"),
    );
    ui.onButtonClick("watermarkRandomBtn", () =>
      this.dispatchSceneEvent("watermark"),
    );
    ui.onButtonClick("watermarkSelectedBtn", () => {
      const watermarkKey = ui.getSelectedWatermarkKey();
      this.dispatchSceneEvent(
        "watermark",
        watermarkKey ? { watermarkKey } : {},
      );
    });
    ui.onButtonClick("confettiBtn", () => this.dispatchSceneEvent("confetti"));
    ui.onButtonClick("dvdRandomBtn", () =>
      this.dispatchSceneEvent("dvdBounce"),
    );
    ui.onButtonClick("dvdSelectedBtn", () => {
      const dvdType = ui.getSelectedDvdType();
      this.dispatchSceneEvent("dvdBounce", dvdType ? { dvdType } : {});
    });
    ui.onButtonClick("xJasonBtn", () => this.dispatchSceneEvent("xJason"));
    ui.onButtonClick("videoRandomBtn", () => this.dispatchSceneEvent("video"));
    ui.onButtonClick("videoSelectedBtn", () => {
      const videoKey = ui.getSelectedVideoKey();
      this.dispatchSceneEvent("video", videoKey ? { videoKey } : {});
    });
    ui.onButtonClick("nyanFollowerBtn", () =>
      this.dispatchSceneEvent("nyanFollower"),
    );
    ui.onButtonClick("imageLinesBtn", () => {
      this.dispatchSceneEvent("imageLines", {
        variant: "topBottom",
        imageUrls: [
          "/images/headblade/hb1.png",
          "/images/watermarks/hypercam.png",
          "/images/dvd/ps2.png",
        ],
        speedPxPerSec: 260,
        imageHeight: 84,
        gapPx: 28,
      });
    });
    ui.onButtonClick("imageLinesTopBottomBtn", () => {
      this.dispatchSceneEvent("imageLines", {
        variant: "topBottom",
        imageUrls: [localImages.papiJam],
        speedPxPerSec: 260,
        imageHeight: 84,
        gapPx: 28,
      });
    });
    ui.onButtonClick("imageLinesMultiRowsBtn", () => {
      this.dispatchSceneEvent("imageLines", {
        variant: "multiRows",
        imageUrls: [localImages.thasixSeven],
        speedPxPerSec: 240,
        imageHeight: 72,
        gapPx: 24,
        rowCount: 6,
      });
    });
    ui.onButtonClick("imageLinesWaveBtn", () => {
      this.dispatchSceneEvent("imageWave", {
        imageUrl: localImages.duckWaddle,
        duration: 9000,
        spawnDuration: 4000,
        count: 8,
        imageHeight: 180,
        waveAmplitudePx: 5,
        wavePeriodPx: 64,
        waveRollAmountPx: 3,
        waveCrestSharpness: 0.22,
      });
    });
    ui.onButtonClick("glitchBtn", () => this.dispatchSceneEvent("glitch"));
    ui.onButtonClick("glitchRepeaterBtn", () =>
      this.dispatchSceneEvent("glitchRepeater"),
    );
    ui.onButtonClick("hypeChatToggleBtn", () => {
      const settings = ui.getHypeChatSettings();
      const { target, ...config } = settings;
      this.dispatchSceneEvent("hypeChat", config);
    });
    ui.onButtonClick("chatMessageTextBtn", () =>
      this.dispatchSceneEvent("chatMessageTest"),
    );
    ui.onButtonClick("newImageTestBtn", () =>
      this.dispatchSceneEvent("newImageTest"),
    );
    ui.onButtonClick("sideSlideBtn", () =>
      this.dispatchSceneEvent("sideSlide", {
        imageUrl: localImages.silasBlickyFlipped,
        rows: 7,
        rowDelaySec: 0.25,
        slideDurationSec: 1.5,
        rowGapPx: 8,
      }),
    );
    ui.onButtonClick("tickerBtn", () => {
      const message = ui.getTickerInput();
      this.dispatchSceneEvent("ticker", message ? { message } : {});
    });
    ui.onButtonClick("tickerEmoteTestBtn", () => {
      this.dispatchSceneEvent("ticker", {
        message: "This is a test KappaPride with emotes prndddLoading here!",
        emotes: [
          {
            name: "KappaPride",
            type: "Twitch",
            imageUrl:
              "https://static-cdn.jtvnw.net/emoticons/v2/55338/default/dark/2.0",
            startIndex: 15,
            endIndex: 24,
            id: 55338,
          },
          {
            name: "prndddLoading",
            type: "Twitch",
            imageUrl:
              "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_11fb52f3a8cc41d2bb599c22a8890c60/default/dark/2.0",
            startIndex: 38,
            endIndex: 50,
            id: "emotesv2_11fb52f3a8cc41d2bb599c22a8890c60",
          },
        ],
      });
    });
  }

  private hookUtilityButtons(ui: DashboardUI): void {
    ui.onButtonClick("testBtn", () => this.sendMessage({ type: "ping" }));
    ui.onButtonClick("pauseBtn", () => this.togglePause());
    ui.onButtonClick("clearBtn", () =>
      this.sendMessage({ type: "clear-scenes" }),
    );
  }

  private hookDevButtons(ui: DashboardUI): void {
    ui.onButtonClick("dataSceneTestBtn", () => this.loadDataScene());
  }

  private hookSliders(ui: DashboardUI): void {
    ui.onSliderChange("volume", () => this.debouncedSendSettings());
    ui.onSliderChange("stability", () => this.debouncedSendSettings());
    ui.onHypeChatChange(() => this.debouncedSendHypeChatSettings(ui));
  }

  private dispatchSceneEvent(
    sceneType: SceneType,
    payload?: Record<string, unknown>,
  ): void {
    const msg: SceneEventMessage = {
      type: "scene-event",
      sceneType: sceneType,
      ...(payload && { payload }),
    };
    this.wsClient.send(msg);
  }

  private dispatchPoolEvent(
    poolType: PoolType,
    payload?: Record<string, unknown>,
  ): void {
    const msg: PoolEventMessage = {
      type: "pool-event",
      poolType: poolType,
      ...(payload && { payload }),
    };
    this.wsClient.send(msg);
  }

  private sendMessage(msg: WsMessage): void {
    this.wsClient.send(msg);
  }

  private togglePause(): void {
    const settings: GlobalSettings = { target: "global", togglePause: true };
    const msg: SetSettingsMessage = {
      type: "set-settings",
      settings,
    };
    this.sendMessage(msg);
  }

  private toggleInstability(): void {
    const settings: GlobalSettings = {
      target: "global",
      toggleInstability: true,
    };
    const msg: SetSettingsMessage = {
      type: "set-settings",
      settings,
    };
    this.sendMessage(msg);
  }

  private spawnInstabilityTicker(): void {
    const msg: any = {
      type: "instability-event",
      event: "spawn",
      sceneType: "ticker",
    };
    this.sendMessage(msg);
  }

  private debouncedSendSettings(): void {
    if (this.settingsDebounceTimer) {
      clearTimeout(this.settingsDebounceTimer);
    }
    this.settingsDebounceTimer = setTimeout(() => {
      const volumeSlider = document.getElementById(
        "volumeSlider",
      ) as HTMLInputElement;
      const stabilitySlider = document.getElementById(
        "stabilitySlider",
      ) as HTMLInputElement;
      const masterVolume = Number(volumeSlider.value) / 100;
      const stability = Number(stabilitySlider.value);
      const settings: GlobalSettings = {
        target: "global",
        masterVolume,
        stability,
      };
      const msg: SetSettingsMessage = {
        type: "set-settings",
        settings,
      };
      this.sendMessage(msg);
    }, 200);
  }

  private debouncedSendHypeChatSettings(ui: DashboardUI): void {
    if (this.hypeChatDebounceTimer) {
      clearTimeout(this.hypeChatDebounceTimer);
    }
    this.hypeChatDebounceTimer = setTimeout(() => {
      const settings: HypeChatSettings = ui.getHypeChatSettings();
      const msg: SetSettingsMessage = {
        type: "set-settings",
        settings,
      };
      this.sendMessage(msg);
    }, 200);
  }

  private async loadDataScene(): Promise<void> {
    try {
      this.sendMessage({
        type: "custom-event",
        payload: DATA_SCENE_CONFIG,
      });
    } catch (error) {
      logger.error("[DashboardController] Error sending data scene", { error });
    }
  }

  /**
   * Load sidebar state from localStorage.
   * Returns persisted state if available, otherwise uses SidebarManager defaults.
   */
  private static loadSidebarState(): SidebarState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      logger.warn(`Failed to load sidebar state from localStorage:`, err);
    }
    // Fall back to SidebarManager defaults (handled by its defaultState)
    return {};
  }

  /**
   * Save sidebar state to localStorage.
   * Silently handles errors to avoid disrupting UI.
   */
  private static saveSidebarState(state: SidebarState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      logger.warn(`Failed to save sidebar state to localStorage:`, err);
    }
  }
}
