import { SceneElement } from "./SceneElement";
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
export class HypeChatScene extends SceneElement {
  private chatProvider: FakeChatProvider;
  private scrollingQueue!: ScrollingQueueElement;

  constructor() {
    super();
    this.chatProvider = new FakeChatProvider();
  }

  override async init(): Promise<void> {
    // Create scrolling queue for chat messages
    this.scrollingQueue = new ScrollingQueueElement({
      direction: ScrollDirection.UP,
      maxItems: 15,
      itemGap: 4,
      baseSpeed: 60, // pixels per second
      urgencyFactor: 1.2,
      fadeInDistance: 0.2,
      fadeOutDuration: 300,
    });

    this.scrollingQueue.x = 100;
    this.scrollingQueue.y = 700;
    //this.scrollingQueue.setWidth(1000);
    //this.scrollingQueue.setHeight(600);
    this.addChild(this.scrollingQueue);

    // Add a few initial messages for debugging
    const initialMessages = this.chatProvider.generateMessages(3);
    for (const message of initialMessages) {
      const chatMsg = new ChatMessageElement(message, {
        fontSize: 18,
        emoteHeight: 22,
        badgeHeight: 16,
        gap: 4,
        badgeGap: 6,
      });
      console.debug(
        `[HypeChatScene] Initial message from ${message.username}: ${message.message}`
      );
      this.scrollingQueue.addItem(chatMsg);
    }

    // Create scheduler to add messages every 3 seconds
    const messageScheduler = new SchedulerElement({
      interval: 3000,
      onTick: () => {
        const messages = this.chatProvider.generateMessages(1);
        const chatMsg = new ChatMessageElement(messages[0], {
          fontSize: 18,
          emoteHeight: 22,
          badgeHeight: 16,
          gap: 4,
          badgeGap: 6,
        });

        console.debug(
          `[HypeChatScene] Generated message from ${messages[0].username}: ${messages[0].message}`
        );
        this.scrollingQueue.addItem(chatMsg);
      },
    });

    this.addChild(messageScheduler);

    await super.init();
  }
}
