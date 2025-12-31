import type { WsMessage, WsMessageType } from "./server/ws-types";

export class DashboardClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 500;
  private readonly maxDelay = 10000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private readonly statsPollMs = 2000;

  private statusEl: HTMLElement;
  private statusPillEl: HTMLElement;
  private statsEl: HTMLElement;
  private logEl: HTMLElement;
  private tickerInputEl: HTMLInputElement;
  private volumeSliderEl: HTMLInputElement;
  private volumeValueEl: HTMLElement;
  private stabilitySliderEl: HTMLInputElement;
  private stabilityValueEl: HTMLElement;

  private settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly buttonHandlers = {
    testBtn: () => this.send("ping"),
    pauseBtn: () => this.togglePause(),
    clearBtn: () => this.send("clear-effects"),
    bamSuccessBtn: () => this.spawn("bamSuccess"),
    bamUhOhBtn: () => this.spawn("bamUhOh"),
    ssbmSuccessBtn: () => this.spawn("ssbmSuccess"),
    ssbmFailBtn: () => this.spawn("ssbmFail"),
    headbladeBtn: () => this.spawn("headblade"),
    watermarkBtn: () => this.spawn("watermark"),
    confettiBtn: () => this.spawn("confetti"),
    dvdBounceBtn: () => this.spawn("dvdBounce"),
    xJasonBtn: () => this.spawn("xJason"),
    tickerBtn: () => {
      const message = this.tickerInputEl.value.trim();
      this.spawn("ticker", message ? { message } : {});
    },
  };

  constructor() {
    this.statusEl = this.getEl("status");
    this.statusPillEl = this.getEl("statusPill");
    this.statsEl = this.getEl("stats");
    this.logEl = this.getEl("log");
    this.tickerInputEl = this.getEl("tickerInput") as HTMLInputElement;
    this.volumeSliderEl = this.getEl("volumeSlider") as HTMLInputElement;
    this.volumeValueEl = this.getEl("volumeValue");
    this.stabilitySliderEl = this.getEl("stabilitySlider") as HTMLInputElement;
    this.stabilityValueEl = this.getEl("stabilityValue");
  }

  private getEl(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
  }

  private log(msg: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logEl.textContent += `${timestamp} ${msg}\n`;
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private setConnected(connected: boolean): void {
    this.statusEl.textContent = connected ? "Connected" : "Disconnected";
    this.statusPillEl.classList.toggle("connected", connected);
    for (const id of Object.keys(this.buttonHandlers)) {
      const btn = document.getElementById(id) as HTMLButtonElement | null;
      if (btn) btn.disabled = !connected;
    }
    if (!connected) {
      this.statsEl.textContent = "No stats (disconnected)";
    }
  }

  private send(type: WsMessageType, payload?: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log("Cannot send; WS not connected");
      return;
    }
    const msg: WsMessage = {
      type,
      role: "dashboard",
      ...(payload && { payload }),
    };
    this.ws.send(JSON.stringify(msg));
  }

  private spawn(effectType: string, payload?: Record<string, unknown>): void {
    this.send("spawn-effect", { effectType, ...payload });
  }

  private requestStats(): void {
    this.send("get-stats");
  }

  private startStatsPolling(): void {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(
      () => this.requestStats(),
      this.statsPollMs
    );
    this.requestStats();
  }

  private stopStatsPolling(): void {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = null;
  }

  private updateStats(payload: Record<string, unknown> | undefined): void {
    const fps = Number((payload?.fps as number) ?? NaN);
    const frameMs = Number((payload?.frameMsAvg as number) ?? NaN);
    const loading = payload?.effectsLoading as number | undefined;
    const playing = payload?.effectsPlaying as number | undefined;
    const wsState = payload?.wsReadyState as number | undefined;
    const ts = payload?.timestamp as number | undefined;

    const lines = [
      `FPS: ${Number.isFinite(fps) ? fps.toFixed(1) : "-"}`,
      `Frame ms (EMA): ${Number.isFinite(frameMs) ? frameMs.toFixed(2) : "-"}`,
      `Effects loading/playing: ${loading ?? "-"}/${playing ?? "-"}`,
      `Overlay WS state: ${wsState ?? "-"}`,
      `Sampled at: ${ts ? new Date(ts).toLocaleTimeString() : "-"}`,
    ];

    this.statsEl.textContent = lines.join("\n");
  }

  private connect(): void {
    this.ws = new WebSocket(`ws://${window.location.host}/overlay-ws`);

    this.ws.onopen = () => {
      this.setConnected(true);
      this.reconnectDelay = 500;
      this.send("hello");
      this.log("WS connected");
      this.startStatsPolling();
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        //this.log(`Received: ${msg.type}`);
        if (msg.type === "stats-response") {
          this.updateStats(msg.payload);
        }
      } catch (err) {
        this.log(
          `Parse error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };

    this.ws.onclose = () => {
      this.setConnected(false);
      this.stopStatsPolling();
      this.log(`WS closed; reconnecting in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.maxDelay, this.reconnectDelay * 2);
    };

    this.ws.onerror = () => {
      this.log("WS error");
    };
  }

  private hookButtons(): void {
    for (const [id, handler] of Object.entries(this.buttonHandlers)) {
      const btn = document.getElementById(id) as HTMLButtonElement | null;
      if (btn) btn.addEventListener("click", handler);
    }
  }

  private hookSliders(): void {
    this.volumeSliderEl.addEventListener("input", () => {
      const value = Number(this.volumeSliderEl.value);
      this.volumeValueEl.textContent = `${value}%`;
      this.debouncedSendSettings();
    });

    this.stabilitySliderEl.addEventListener("input", () => {
      const value = Number(this.stabilitySliderEl.value);
      this.stabilityValueEl.textContent = `${value}%`;
      this.debouncedSendSettings();
    });
  }

  private debouncedSendSettings(): void {
    if (this.settingsDebounceTimer) {
      clearTimeout(this.settingsDebounceTimer);
    }
    this.settingsDebounceTimer = setTimeout(() => {
      const masterVolume = Number(this.volumeSliderEl.value) / 100;
      const stability = Number(this.stabilitySliderEl.value);
      this.send("set-settings", { masterVolume, stability });
    }, 200);
  }

  private togglePause(): void {
    this.send("set-settings", { togglePause: true });
  }

  start(): void {
    this.setConnected(false);
    this.hookButtons();
    this.hookSliders();
    this.connect();
    this.heartbeatInterval = setInterval(() => this.send("ping"), 30000);
  }

  stop(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.stopStatsPolling();
    if (this.ws) this.ws.close();
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const client = new DashboardClient();
  client.start();
});
