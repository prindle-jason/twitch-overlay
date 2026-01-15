import type { WebSocketClient } from "../client/WebSocketClient";
import type { DashboardUI } from "./DashboardUI";
import type { PoolId } from "../utils/types";
import type {
  SceneEventMessage,
  SetSettingsMessage,
  WsMessage,
} from "../server/ws-types";

export class DashboardController {
  private settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private wsClient: WebSocketClient) {}

  hookAll(ui: DashboardUI): void {
    this.hookSceneButtons(ui);
    this.hookUtilityButtons(ui);
    this.hookSliders(ui);
  }

  private hookSceneButtons(ui: DashboardUI): void {
    ui.onButtonClick("successBtn", () => this.dispatchScene("success"));
    ui.onButtonClick("failureBtn", () => this.dispatchScene("failure"));
    ui.onButtonClick("bamSuccessBtn", () => this.dispatchScene("bamSuccess"));
    ui.onButtonClick("bamUhOhBtn", () => this.dispatchScene("bamUhOh"));
    ui.onButtonClick("ssbmSuccessBtn", () => this.dispatchScene("ssbmSuccess"));
    ui.onButtonClick("ssbmFailBtn", () => this.dispatchScene("ssbmFail"));
    ui.onButtonClick("headbladeBtn", () => this.dispatchScene("headblade"));
    ui.onButtonClick("watermarkBtn", () => this.dispatchScene("watermark"));
    ui.onButtonClick("confettiBtn", () => this.dispatchScene("confetti"));
    ui.onButtonClick("dvdBounceBtn", () => this.dispatchScene("dvdBounce"));
    ui.onButtonClick("xJasonBtn", () => this.dispatchScene("xJason"));
    ui.onButtonClick("richTextTestBtn", () =>
      this.dispatchScene("richTextTest")
    );
    ui.onButtonClick("hypeChatToggleBtn", () => this.dispatchScene("hypeChat"));
    ui.onButtonClick("chatMessageTextBtn", () =>
      this.dispatchScene("chatMessageTest")
    );
    ui.onButtonClick("newImageTestBtn", () =>
      this.dispatchScene("newImageTest")
    );
    ui.onButtonClick("tickerBtn", () => {
      const message = ui.getTickerInput();
      this.dispatchScene("ticker", message ? { message } : {});
    });
    ui.onButtonClick("tickerEmoteTestBtn", () => {
      this.dispatchScene("ticker", {
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
      this.sendMessage({ type: "clear-scenes" })
    );
  }

  private hookSliders(ui: DashboardUI): void {
    ui.onSliderChange("volume", () => this.debouncedSendSettings());
    ui.onSliderChange("stability", () => this.debouncedSendSettings());
  }

  private dispatchScene(
    sceneType: PoolId,
    payload?: Record<string, unknown>
  ): void {
    const msg: SceneEventMessage = {
      type: "scene-event",
      sceneType,
      ...(payload && { payload }),
    };
    this.wsClient.send(msg);
  }

  private sendMessage(msg: WsMessage): void {
    this.wsClient.send(msg);
  }

  private togglePause(): void {
    const msg: SetSettingsMessage = {
      type: "set-settings",
      settings: { togglePause: true },
    };
    this.sendMessage(msg);
  }

  private debouncedSendSettings(): void {
    if (this.settingsDebounceTimer) {
      clearTimeout(this.settingsDebounceTimer);
    }
    this.settingsDebounceTimer = setTimeout(() => {
      const volumeSlider = document.getElementById(
        "volumeSlider"
      ) as HTMLInputElement;
      const stabilitySlider = document.getElementById(
        "stabilitySlider"
      ) as HTMLInputElement;
      const masterVolume = Number(volumeSlider.value) / 100;
      const stability = Number(stabilitySlider.value);
      const msg: SetSettingsMessage = {
        type: "set-settings",
        settings: { masterVolume, stability },
      };
      this.sendMessage(msg);
    }, 200);
  }
}
