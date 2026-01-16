import type { WsMessage } from "../server/ws-types";

type ConnectionState = "connecting" | "connected" | "disconnected";

export interface WebSocketClientOptions {
  reconnectInitialDelay?: number;
  reconnectMaxDelay?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private state: ConnectionState = "disconnected";
  private reconnectDelay: number;
  private readonly reconnectInitialDelay: number;
  private readonly reconnectMaxDelay: number;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private messageHandlers: ((msg: WsMessage) => void)[] = [];
  private connectedHandlers: (() => void)[] = [];
  private disconnectedHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url;
    this.reconnectInitialDelay = options.reconnectInitialDelay ?? 500;
    this.reconnectMaxDelay = options.reconnectMaxDelay ?? 10000;
    this.reconnectDelay = this.reconnectInitialDelay;
  }

  connect(): void {
    if (this.state !== "disconnected") {
      return;
    }

    this.state = "connecting";

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.state = "connected";
        this.reconnectDelay = this.reconnectInitialDelay;
        this.connectedHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as WsMessage;
          this.messageHandlers.forEach((handler) => handler(msg));
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.errorHandlers.forEach((handler) => handler(error));
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.state = "disconnected";
        this.disconnectedHandlers.forEach((handler) => handler());

        // Attempt reconnect
        this.reconnectTimeout = setTimeout(
          () => this.connect(),
          this.reconnectDelay
        );
        this.reconnectDelay = Math.min(
          this.reconnectMaxDelay,
          this.reconnectDelay * 2
        );
      };

      this.ws.onerror = (event: Event) => {
        const error = new Error("WebSocket error");
        this.errorHandlers.forEach((handler) => handler(error));
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorHandlers.forEach((handler) => handler(error));
      this.state = "disconnected";
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state = "disconnected";
  }

  destroy(): void {
    this.disconnect();
    this.messageHandlers = [];
    this.connectedHandlers = [];
    this.disconnectedHandlers = [];
    this.errorHandlers = [];
  }

  send(msg: WsMessage): void {
    if (!this.isConnected()) {
      const error = new Error("WebSocket not connected");
      this.errorHandlers.forEach((handler) => handler(error));
      return;
    }

    try {
      this.ws!.send(JSON.stringify(msg));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorHandlers.forEach((handler) => handler(error));
    }
  }

  isConnected(): boolean {
    return this.state === "connected" && this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  onMessage(handler: (msg: WsMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onConnected(handler: () => void): void {
    this.connectedHandlers.push(handler);
  }

  onDisconnected(handler: () => void): void {
    this.disconnectedHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }
}
