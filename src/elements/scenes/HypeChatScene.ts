import { TriggerableSceneElement } from "./SceneElement";
import { ChatMessageElement } from "../ChatMessageElement";
import {
  ScrollingQueueElement,
  ScrollDirection,
} from "../ScrollingQueueElement";
import { SchedulerElement } from "../SchedulerElement";
import { FakeChatProvider } from "../../utils/chat/FakeChatProvider";
import type { HypeChatSettings } from "../../server/ws-types";
import { Range, getRandomInRange } from "../../utils/random";

/**
 * Scene that displays a stream of chat messages using ScrollingQueueElement
 */
export class HypeChatScene extends TriggerableSceneElement {
  readonly type = "hypeChat" as const;
  private chatProvider: FakeChatProvider;
  private scrollQueue!: ScrollingQueueElement;
  private messageScheduler!: SchedulerElement;

  // Configurable settings
  private minMessageRate: number = 1500; // ms
  private maxMessageRate: number = 2500; // ms
  private lerpFactor: number = 0.5;
  private minBurstCount: number = 1;
  private maxBurstCount: number = 3;

  constructor(payload?: Record<string, unknown>) {
    super();
    this.chatProvider = new FakeChatProvider();

    // Apply settings from payload if provided
    if (payload && typeof payload === "object") {
      const config = payload as Partial<HypeChatSettings>;
      if (config.minMessageRate !== undefined)
        this.minMessageRate = config.minMessageRate;
      if (config.maxMessageRate !== undefined)
        this.maxMessageRate = config.maxMessageRate;
      if (config.lerpFactor !== undefined) this.lerpFactor = config.lerpFactor;
      if (config.minBurstCount !== undefined)
        this.minBurstCount = config.minBurstCount;
      if (config.maxBurstCount !== undefined)
        this.maxBurstCount = config.maxBurstCount;
    }
  }

  override async init(): Promise<void> {
    const queue = new ScrollingQueueElement({
      direction: ScrollDirection.UP,
      maxItems: 25,
      itemGap: 8,
      lerpFactor: this.lerpFactor,
    });
    queue.x = this.W - 500;
    queue.y = this.H - 50;
    this.scrollQueue = queue;
    this.addChild(this.scrollQueue);

    // const initialMessages = this.chatProvider.generateMessages(2);
    // for (const message of initialMessages) {
    //   const chatMsg = new ChatMessageElement(message, {
    //     fontSize: 18,
    //     emoteHeight: 22,
    //     badgeHeight: 16,
    //     gap: 4,
    //     badgeGap: 6,
    //   });
    //   console.debug(
    //     `[HypeChatScene] Initial UP message from ${message.username}: ${message.message}`
    //   );
    //   this.scrollingQueueUp.addItem(chatMsg);
    // }

    // Create scheduler to add messages at configurable rate to all active queues
    this.messageScheduler = new SchedulerElement({
      interval: this.calculateInterval(),
      onTick: () => {
        // Randomly pick burst count and spawn that many messages
        const burstCount = Math.round(
          getRandomInRange({
            min: this.minBurstCount,
            max: this.maxBurstCount,
          }),
        );

        for (let i = 0; i < burstCount; i++) {
          const message = this.chatProvider.generateMessage();

          const chatMsg = new ChatMessageElement(message, {
            fontSize: 24,
            font: "'Inter', 'Segoe UI', sans-serif",
            emoteHeight: 28,
            badgeHeight: 22,
            gap: 6,
          });
          this.scrollQueue.addItem(chatMsg);
        }
      },
    });

    this.addChild(this.messageScheduler);

    await super.init();
  }

  /**
   * Calculate interval based on min/max rates and lerpFactor.
   * lerpFactor interpolates between min and max: 0 = max rate, 1 = min rate
   */
  private calculateInterval(): number {
    return (
      this.maxMessageRate -
      (this.maxMessageRate - this.minMessageRate) * this.lerpFactor
    );
  }

  handleTrigger(payload?: unknown): void {
    //Finish
    this.finish();
  }

  override onSceneConfig(config: HypeChatSettings): void {
    if (config.minMessageRate !== undefined)
      this.minMessageRate = config.minMessageRate;
    if (config.maxMessageRate !== undefined)
      this.maxMessageRate = config.maxMessageRate;
    if (config.lerpFactor !== undefined) {
      this.lerpFactor = config.lerpFactor;
      this.scrollQueue.setLerpFactor(this.lerpFactor);
    }
    if (config.minBurstCount !== undefined)
      this.minBurstCount = config.minBurstCount;
    if (config.maxBurstCount !== undefined)
      this.maxBurstCount = config.maxBurstCount;

    if (
      config.minMessageRate !== undefined ||
      config.maxMessageRate !== undefined
    ) {
      // Recalculate interval (all three affect it anyway)
      this.messageScheduler.setInterval({
        min: this.minMessageRate,
        max: this.maxMessageRate,
      });
    }
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.scrollQueue = null as any;
    this.messageScheduler = null as any;
  }
}
