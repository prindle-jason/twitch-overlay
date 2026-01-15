import { TriggerableSceneElement } from "./SceneElement";
import { ChatMessageElement } from "../ChatMessageElement";
import {
  ScrollingQueueElement,
  ScrollDirection,
} from "../ScrollingQueueElement";
import { SchedulerElement } from "../SchedulerElement";
import { FakeChatProvider } from "../../utils/chat/FakeChatProvider";

/**
 * Scene that displays a stream of chat messages using ScrollingQueueElement
 */
export class HypeChatScene extends TriggerableSceneElement {
  private chatProvider: FakeChatProvider;
  private scrollingQueueUp!: ScrollingQueueElement;
  private scrollingQueueDown?: ScrollingQueueElement;
  private scrollingQueueLeft?: ScrollingQueueElement;
  private scrollingQueueRight?: ScrollingQueueElement;

  // Debug flags to enable/disable individual queues for testing
  private readonly ENABLE_UP = true;
  private readonly ENABLE_DOWN = false;
  private readonly ENABLE_LEFT = false;
  private readonly ENABLE_RIGHT = false;

  constructor() {
    super();
    this.chatProvider = new FakeChatProvider();
  }

  override async init(): Promise<void> {
    // Create UP queue (scrolls upward, positioned on left side, bottom area)
    if (this.ENABLE_UP) {
      const queueUp = new ScrollingQueueElement({
        direction: ScrollDirection.UP,
        maxItems: 10,
        itemGap: 4,
      });
      queueUp.x = 50;
      queueUp.y = 700;
      this.scrollingQueueUp = queueUp;
      this.addChild(this.scrollingQueueUp);
    }

    // Create DOWN queue (scrolls downward, positioned on right side, top area)
    if (this.ENABLE_DOWN) {
      this.scrollingQueueDown = new ScrollingQueueElement({
        direction: ScrollDirection.DOWN,
        maxItems: 15,
        itemGap: 4,
      });
      this.scrollingQueueDown.x = 800;
      this.scrollingQueueDown.y = 200;
      this.addChild(this.scrollingQueueDown);
    }

    // Create LEFT queue (scrolls leftward from right, lower-middle area)
    if (this.ENABLE_LEFT) {
      this.scrollingQueueLeft = new ScrollingQueueElement({
        direction: ScrollDirection.LEFT,
        maxItems: 15,
        itemGap: 4,
      });
      this.scrollingQueueLeft.x = 1750;
      this.scrollingQueueLeft.y = 800;
      this.addChild(this.scrollingQueueLeft);
    }

    // Create RIGHT queue (scrolls rightward from left, bottom area)
    if (this.ENABLE_RIGHT) {
      this.scrollingQueueRight = new ScrollingQueueElement({
        direction: ScrollDirection.RIGHT,
        maxItems: 15,
        itemGap: 4,
      });
      this.scrollingQueueRight.x = 50;
      this.scrollingQueueRight.y = 900;
      this.addChild(this.scrollingQueueRight);
    }

    // Add initial messages to UP queue (2 messages)
    if (this.ENABLE_UP && this.scrollingQueueUp) {
      const initialMessages = this.chatProvider.generateMessages(2);
      for (const message of initialMessages) {
        const chatMsg = new ChatMessageElement(message, {
          fontSize: 18,
          emoteHeight: 22,
          badgeHeight: 16,
          gap: 4,
          badgeGap: 6,
        });
        console.debug(
          `[HypeChatScene] Initial UP message from ${message.username}: ${message.message}`
        );
        this.scrollingQueueUp.addItem(chatMsg);
      }
    }

    // Add initial messages to DOWN queue if enabled (2 messages)
    if (this.ENABLE_DOWN && this.scrollingQueueDown) {
      const downMessages = this.chatProvider.generateMessages(2);
      for (const message of downMessages) {
        const chatMsg = new ChatMessageElement(message, {
          fontSize: 18,
          emoteHeight: 22,
          badgeHeight: 16,
          gap: 4,
          badgeGap: 6,
        });
        console.debug(
          `[HypeChatScene] Initial DOWN message from ${message.username}: ${message.message}`
        );
        this.scrollingQueueDown.addItem(chatMsg);
      }
    }

    // Add initial messages to LEFT queue if enabled (2 messages)
    if (this.ENABLE_LEFT && this.scrollingQueueLeft) {
      const leftMessages = this.chatProvider.generateMessages(2);
      for (const message of leftMessages) {
        const chatMsg = new ChatMessageElement(message, {
          fontSize: 18,
          emoteHeight: 22,
          badgeHeight: 16,
          gap: 4,
          badgeGap: 6,
        });
        console.debug(
          `[HypeChatScene] Initial LEFT message from ${message.username}: ${message.message}`
        );
        this.scrollingQueueLeft.addItem(chatMsg);
      }
    }

    // Add initial messages to RIGHT queue if enabled (2 messages)
    if (this.ENABLE_RIGHT && this.scrollingQueueRight) {
      const rightMessages = this.chatProvider.generateMessages(2);
      for (const message of rightMessages) {
        const chatMsg = new ChatMessageElement(message, {
          fontSize: 18,
          emoteHeight: 22,
          badgeHeight: 16,
          gap: 4,
          badgeGap: 6,
        });
        console.debug(
          `[HypeChatScene] Initial RIGHT message from ${message.username}: ${message.message}`
        );
        this.scrollingQueueRight.addItem(chatMsg);
      }
    }

    // Create scheduler to add messages every 3 seconds to all active queues
    const messageScheduler = new SchedulerElement({
      interval: 2000,
      onTick: () => {
        const messages = this.chatProvider.generateMessages(1);
        const message = messages[0];

        console.debug(
          `[HypeChatScene] Generated message from ${message.username}: ${message.message}`
        );

        // Add to UP queue if enabled
        if (this.ENABLE_UP && this.scrollingQueueUp) {
          const chatMsgUp = new ChatMessageElement(message, {
            fontSize: 18,
            emoteHeight: 22,
            badgeHeight: 16,
            gap: 4,
            badgeGap: 6,
          });
          this.scrollingQueueUp.addItem(chatMsgUp);
        }

        // Add to DOWN queue if enabled
        if (this.ENABLE_DOWN && this.scrollingQueueDown) {
          const chatMsgDown = new ChatMessageElement(message, {
            fontSize: 18,
            emoteHeight: 22,
            badgeHeight: 16,
            gap: 4,
            badgeGap: 6,
          });
          this.scrollingQueueDown.addItem(chatMsgDown);
        }

        // Add to LEFT queue if enabled
        if (this.ENABLE_LEFT && this.scrollingQueueLeft) {
          const chatMsgLeft = new ChatMessageElement(message, {
            fontSize: 18,
            emoteHeight: 22,
            badgeHeight: 16,
            gap: 4,
            badgeGap: 6,
          });
          this.scrollingQueueLeft.addItem(chatMsgLeft);
        }

        // Add to RIGHT queue if enabled
        if (this.ENABLE_RIGHT && this.scrollingQueueRight) {
          const chatMsgRight = new ChatMessageElement(message, {
            fontSize: 18,
            emoteHeight: 22,
            badgeHeight: 16,
            gap: 4,
            badgeGap: 6,
          });
          this.scrollingQueueRight.addItem(chatMsgRight);
        }
      },
    });

    this.addChild(messageScheduler);

    await super.init();
  }

  handleTrigger(payload?: unknown): void {
    //Finish
    this.finish();
  }
}
