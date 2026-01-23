import { WebSocketClient } from "../core/WebSocketClient";
import { DashboardUI } from "./DashboardUI";
import { DashboardController } from "./DashboardController";

export class DashboardClient {
  private wsClient: WebSocketClient;
  private ui: DashboardUI;
  private controller: DashboardController;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private readonly statsPollMs = 2000;
  private readonly heartbeatIntervalMs = 30000;

  constructor() {
    this.wsClient = new WebSocketClient(
      `ws://${window.location.host}/overlay-ws`,
    );
    this.ui = new DashboardUI();
    this.controller = new DashboardController(this.wsClient);
  }

  private startStatsPolling(): void {
    clearInterval(this.statsInterval ?? undefined);
    this.statsInterval = setInterval(
      () => this.wsClient.send({ type: "get-stats" }),
      this.statsPollMs,
    );
    this.wsClient.send({ type: "get-stats" });
  }

  private stopStatsPolling(): void {
    clearInterval(this.statsInterval ?? undefined);
    this.statsInterval = null;
  }

  private connect(): void {
    this.wsClient.onConnected(() => {
      this.ui.setConnected(true);
      this.wsClient.send({ type: "hello", role: "dashboard" });
      this.ui.log("WS connected");
      this.startStatsPolling();
      // Request current instability state on connect
      this.wsClient.send({ type: "instability-request" });
    });

    this.wsClient.onDisconnected(() => {
      this.ui.setConnected(false);
      this.stopStatsPolling();
      this.ui.log("WS disconnected; reconnecting...");
    });

    this.wsClient.onMessage((msg) => {
      if (msg.type === "stats-response") {
        this.ui.updateStats(msg.stats);
      }

      if (
        msg.type === "settings-broadcast" &&
        msg.settings.target === "global"
      ) {
        this.ui.applyGlobalSettings(msg.settings);
      }

      if (msg.type === "instability-broadcast") {
        this.ui.applyInstabilityState(msg.enabled, msg.timeUntilNextEventMs);
      }
    });

    this.wsClient.onError((error) => {
      this.ui.log(`WS error: ${error.message}`);
    });

    this.wsClient.connect();
  }

  start(): void {
    this.ui.setConnected(false);
    this.controller.hookAll(this.ui);
    this.connect();
    this.heartbeatInterval = setInterval(
      () => this.wsClient.send({ type: "ping" }),
      this.heartbeatIntervalMs,
    );
  }

  stop(): void {
    clearInterval(this.heartbeatInterval ?? undefined);
    this.stopStatsPolling();
    this.wsClient.destroy();
  }
}
