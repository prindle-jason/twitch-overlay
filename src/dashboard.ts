import type { WsMessage, ClientRole } from "./ws-types";

export class DashboardClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 500;
  private readonly maxDelay = 10000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private statusEl: HTMLElement;
  private logEl: HTMLElement;
  private tickerInputEl: HTMLInputElement;
  private allButtons: HTMLButtonElement[];

  constructor() {
    this.statusEl = this.getEl("status");
    this.logEl = this.getEl("log");
    this.tickerInputEl = this.getEl("tickerInput") as HTMLInputElement;

    const buttonIds = [
      "testBtn",
      "statsBtn",
      "bamSuccessBtn",
      "bamUhOhBtn",
      "ssbmSuccessBtn",
      "ssbmFailBtn",
      "headbladeBtn",
      "watermarkBtn",
      "confettiBtn",
      "dvdBounceBtn",
      "xJasonBtn",
      "tickerBtn",
    ];
    this.allButtons = buttonIds
      .map((id) => this.getEl(id) as HTMLButtonElement)
      .filter(Boolean);
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
    this.statusEl.style.color = connected ? "green" : "red";
    this.allButtons.forEach((b) => (b.disabled = !connected));
  }

  private send(type: string, payload?: Record<string, unknown>): void {
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

  private connect(): void {
    this.ws = new WebSocket(`ws://${window.location.host}/overlay-ws`);

    this.ws.onopen = () => {
      this.setConnected(true);
      this.reconnectDelay = 500;
      this.send("hello");
      this.log("WS connected");
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        this.log(`Received: ${msg.type}`);
      } catch (err) {
        this.log(
          `Parse error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };

    this.ws.onclose = () => {
      this.setConnected(false);
      this.log(`WS closed; reconnecting in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.maxDelay, this.reconnectDelay * 2);
    };

    this.ws.onerror = () => {
      this.log("WS error");
    };
  }

  private hookButtons(): void {
    const testBtn = this.allButtons[0];
    const statsBtn = this.allButtons[1];
    const bamSuccessBtn = this.allButtons[2];
    const bamUhOhBtn = this.allButtons[3];
    const ssbmSuccessBtn = this.allButtons[4];
    const ssbmFailBtn = this.allButtons[5];
    const headbladeBtn = this.allButtons[6];
    const watermarkBtn = this.allButtons[7];
    const confettiBtn = this.allButtons[8];
    const dvdBounceBtn = this.allButtons[9];
    const xJasonBtn = this.allButtons[10];
    const tickerBtn = this.allButtons[11];

    if (testBtn) testBtn.addEventListener("click", () => this.send("ping"));
    if (statsBtn)
      statsBtn.addEventListener("click", () => this.send("get-stats"));
    if (bamSuccessBtn)
      bamSuccessBtn.addEventListener("click", () => this.spawn("bamSuccess"));
    if (bamUhOhBtn)
      bamUhOhBtn.addEventListener("click", () => this.spawn("bamUhOh"));
    if (ssbmSuccessBtn)
      ssbmSuccessBtn.addEventListener("click", () => this.spawn("ssbmSuccess"));
    if (ssbmFailBtn)
      ssbmFailBtn.addEventListener("click", () => this.spawn("ssbmFail"));
    if (headbladeBtn)
      headbladeBtn.addEventListener("click", () => this.spawn("headblade"));
    if (watermarkBtn)
      watermarkBtn.addEventListener("click", () => this.spawn("watermark"));
    if (confettiBtn)
      confettiBtn.addEventListener("click", () => this.spawn("confetti"));
    if (dvdBounceBtn)
      dvdBounceBtn.addEventListener("click", () => this.spawn("dvdBounce"));
    if (xJasonBtn)
      xJasonBtn.addEventListener("click", () => this.spawn("xJason"));
    if (tickerBtn)
      tickerBtn.addEventListener("click", () => {
        const message = this.tickerInputEl.value.trim();
        this.spawn("ticker", message ? { message } : {});
      });
  }

  start(): void {
    this.setConnected(false);
    this.hookButtons();
    this.connect();
    this.heartbeatInterval = setInterval(() => this.send("ping"), 30000);
  }

  stop(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.ws) this.ws.close();
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const client = new DashboardClient();
  client.start();
});
