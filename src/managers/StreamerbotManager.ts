import { StreamerbotClient } from '@streamerbot/client';

/**
 * StreamerbotManager - Manages WebSocket connection to Streamer.bot
 * 
 * Provides a clean interface for connecting to and receiving events from Streamer.bot.
 * Wraps the official @streamerbot/client with application-specific logic.
 * 
 * TODO: Future Enhancement - Integrate with EventBus system (Step 2 of refactor)
 * When EventBus is implemented, this class should emit events through the EventBus
 * instead of using callback functions. This will enable loose coupling between
 * Streamer.bot events and the rest of the application.
 */

export interface StreamerbotConnectionInfo {
  instanceId: string;
  name: string;
  version: string;
  os: string;
}

export interface StreamerbotManagerOptions {
  host?: string;
  port?: number;
  autoReconnect?: boolean;
  onConnectionChange?: (connected: boolean, info?: StreamerbotConnectionInfo) => void;
  onCommand?: (command: string, data?: any) => void;
  onError?: (error: Error) => void;
}

export class StreamerbotManager {
  private client: StreamerbotClient;
  private _connected: boolean = false;
  private options: StreamerbotManagerOptions;

  constructor(options: StreamerbotManagerOptions = {}) {
    this.options = {
      host: '127.0.0.1',
      port: 8080,
      autoReconnect: true,
      ...options
    };

    this.client = new StreamerbotClient({
      host: this.options.host,
      port: this.options.port,
      immediate: true,
      autoReconnect: this.options.autoReconnect,
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
      onError: this.handleError.bind(this)
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Subscribe to custom events from Streamer.bot
    this.client.on('General.Custom', (data) => {
      console.log('📨 Received custom event from Streamer.bot:', data);
      
      // Extract command from the event data
      if (data.data?.command) {
        this.options.onCommand?.(data.data.command, data.data);
      }
    });
  }

  private handleConnect(info: StreamerbotConnectionInfo): void {
    console.log('✅ Connected to Streamer.bot:', info);
    this._connected = true;
    this.options.onConnectionChange?.(true, info);
  }

  private handleDisconnect(): void {
    console.log('❌ Disconnected from Streamer.bot');
    this._connected = false;
    this.options.onConnectionChange?.(false);
  }

  private handleError(error: Error): void {
    console.error('❌ Streamer.bot error:', error);
    this._connected = false;
    this.options.onError?.(error);
  }

  /**
   * Get the current connection status
   */
  get connected(): boolean {
    return this._connected;
  }

  /**
   * Get the underlying Streamer.bot client for advanced usage
   */
  get streamerBotClient(): StreamerbotClient {
    return this.client;
  }

  /**
   * Manually connect to Streamer.bot (if not using immediate: true)
   */
  async connect(): Promise<void> {
    return this.client.connect();
  }

  /**
   * Disconnect from Streamer.bot
   */
  async disconnect(): Promise<void> {
    return this.client.disconnect();
  }

  /**
   * Subscribe to additional Streamer.bot events
   * @param eventName - Event name in format 'Source.EventType' (e.g., 'Twitch.ChatMessage')
   * @param callback - Function to call when event is received
   */
  async subscribe(eventName: string, callback: (data: any) => void): Promise<void> {
    return this.client.on(eventName as any, callback);
  }

  /**
   * Send a custom action to Streamer.bot (if supported by your setup)
   * @param actionName - Name of the action to trigger
   * @param args - Arguments to pass to the action
   */
  async doAction(actionName: string, args?: Record<string, any>): Promise<any> {
    return this.client.doAction(actionName, args);
  }
}