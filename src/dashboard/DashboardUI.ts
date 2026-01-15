import type { StatsResponseMessage } from "../server/ws-types";

type ButtonCallback = () => void;
type SliderCallback = (value: number) => void;

export class DashboardUI {
  private statusEl: HTMLElement;
  private statusPillEl: HTMLElement;
  private statsEl: HTMLElement;
  private logEl: HTMLElement;
  private volumeSliderEl: HTMLInputElement;
  private volumeValueEl: HTMLElement;
  private stabilitySliderEl: HTMLInputElement;
  private stabilityValueEl: HTMLElement;
  private logLevelSelectEl: HTMLSelectElement;

  private buttonCallbacks = new Map<string, ButtonCallback>();
  private sliderCallbacks = new Map<string, SliderCallback>();

  constructor() {
    this.statusEl = this.getEl("status");
    this.statusPillEl = this.getEl("statusPill");
    this.statsEl = this.getEl("stats");
    this.logEl = this.getEl("log");
    this.volumeSliderEl = this.getEl("volumeSlider") as HTMLInputElement;
    this.volumeValueEl = this.getEl("volumeValue");
    this.stabilitySliderEl = this.getEl("stabilitySlider") as HTMLInputElement;
    this.stabilityValueEl = this.getEl("stabilityValue");
    this.logLevelSelectEl = this.getEl("logLevelSelect") as HTMLSelectElement;

    this.initializeSliders();
    this.initializeLogLevel();
  }

  private getEl(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
  }

  private initializeSliders(): void {
    this.volumeSliderEl.addEventListener("input", () => {
      const value = Number(this.volumeSliderEl.value);
      this.volumeValueEl.textContent = `${value}%`;
      const callback = this.sliderCallbacks.get("volume");
      if (callback) callback(value);
    });

    this.stabilitySliderEl.addEventListener("input", () => {
      const value = Number(this.stabilitySliderEl.value);
      this.stabilityValueEl.textContent = `${value}%`;
      const callback = this.sliderCallbacks.get("stability");
      if (callback) callback(value);
    });
  }

  private initializeLogLevel(): void {
    // TODO: Implement server log level syncing
    // For now, disabled - client and server have separate logger instances
    this.logLevelSelectEl.disabled = true;
    this.logLevelSelectEl.title =
      "Log level control disabled - client and server loggers are separate";
  }

  log(msg: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logEl.textContent += `${timestamp} ${msg}\n`;
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  setConnected(connected: boolean): void {
    this.statusEl.textContent = connected ? "Connected" : "Disconnected";
    this.statusPillEl.classList.toggle("connected", connected);

    // Enable/disable all registered buttons
    for (const buttonId of this.buttonCallbacks.keys()) {
      const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
      if (btn) btn.disabled = !connected;
    }

    if (!connected) {
      this.statsEl.textContent = "No stats (disconnected)";
    }
  }

  updateStats(stats: StatsResponseMessage["stats"]): void {
    const fps = stats.fps;
    const frameMs = stats.frameMsAvg;
    const loading = stats.effectsLoading;
    const playing = stats.effectsPlaying;
    const wsState = stats.wsReadyState;
    const ts = stats.timestamp;

    const lines = [
      `FPS: ${Number.isFinite(fps) ? fps.toFixed(1) : "-"}`,
      `Frame ms (EMA): ${Number.isFinite(frameMs) ? frameMs.toFixed(2) : "-"}`,
      `Effects loading/playing: ${loading ?? "-"}/${playing ?? "-"}`,
      `Overlay WS state: ${wsState ?? "-"}`,
      `Sampled at: ${ts ? new Date(ts).toLocaleTimeString() : "-"}`,
    ];

    this.statsEl.textContent = lines.join("\n");
  }

  onButtonClick(buttonId: string, handler: ButtonCallback): void {
    this.buttonCallbacks.set(buttonId, handler);
    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener("click", handler);
    }
  }

  onSliderChange(
    sliderId: "volume" | "stability",
    handler: SliderCallback
  ): void {
    this.sliderCallbacks.set(sliderId, handler);
  }

  getTickerInput(): string {
    const input = document.getElementById(
      "tickerInput"
    ) as HTMLInputElement | null;
    return input?.value.trim() || "";
  }
}
