import { SceneElement } from "../SceneElement";
import { ChatMessageElement } from "../../composites/ChatMessageElement";
import { FakeChatProvider } from "../../../utils/chat/FakeChatProvider";

/**
 * Simple test scene with 20 manually positioned chat messages
 */
export class ChatMessageTestScene extends SceneElement {
  readonly type = "chatMessageTest" as const;
  private chatProvider: FakeChatProvider;

  constructor() {
    super();
    this.chatProvider = new FakeChatProvider();
  }

  override async init(): Promise<void> {
    const messages = this.chatProvider.generateMessages(5);
    const startX = 100;
    const startY = 50;
    const messageGap = 35;

    for (let i = 0; i < messages.length; i++) {
      const chatMsg = new ChatMessageElement(messages[i], {
        fontSize: 18,
        emoteHeight: 40,
        badgeHeight: 16,
        gap: 4,
        badgeGap: 6,
      });
      chatMsg.x = startX;
      chatMsg.y = startY + i * messageGap;

      console.debug(
        `[ChatMessageTestScene] Message ${i} at (${chatMsg.x}, ${chatMsg.y}): ${messages[i].username}: ${messages[i].message}`,
      );

      this.addChild(chatMsg);
    }

    await super.init();
  }
}
