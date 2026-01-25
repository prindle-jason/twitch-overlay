import { TransformElement } from "../primitives/TransformElement";
import { GridLayoutElement } from "./GridLayoutElement";
import { TextElement } from "../primitives/TextElement";
import { ImageElement } from "../primitives/ImageElement";
import type { ChatMessage, Emote } from "../../utils/chat/chatTypes";
import { logger } from "../../utils/logger";

interface ChatMessageElementConfig {
  fontSize?: number;
  font?: string;
  fontWeight?: string;
  textColor?: string;
  usernameColor?: string;
  alignItems?: "start" | "center" | "end";
  emoteHeight?: number;
  badgeHeight?: number;
  gap?: number;
  badgeGap?: number;
}

/**
 * Renders a chat message (badges + username + message parts) as a single-row grid.
 */
export class ChatMessageElement extends TransformElement {
  private chat: ChatMessage;
  //private config: ChatMessageElementConfig;
  private grid: GridLayoutElement | null = null;

  private fontSize: number;
  private font: string;
  private fontWeight: string;
  private textColor: string;
  private usernameColor: string;
  private alignItems: "start" | "center" | "end";
  private emoteHeight: number;
  private badgeHeight: number;
  private gap: number;

  constructor(chat: ChatMessage, config: ChatMessageElementConfig = {}) {
    super();
    this.chat = chat;
    //this.config = config;

    // Extract config values with defaults
    this.fontSize = config.fontSize ?? 24;
    this.font = config.font ?? "Arial";
    this.fontWeight = config.fontWeight ?? "normal";
    this.textColor = config.textColor ?? "#ffffff";
    this.usernameColor = config.usernameColor ?? chat.color ?? "#ffffff";
    this.alignItems = config.alignItems ?? "center";
    this.emoteHeight = config.emoteHeight ?? this.fontSize;
    this.badgeHeight = config.badgeHeight ?? Math.round(this.fontSize * 0.9);
    this.gap = config.gap ?? 6;
  }

  override async init(): Promise<void> {
    logger.debug("[ChatMessageElement] init() called", {
      state: this.state,
      username: this.chat.username,
      messageText: this.chat.message,
    });

    this.grid = new GridLayoutElement({
      columns: 0,
      gap: this.gap,
      alignItems: this.alignItems,
    });

    this.appendBadges();
    this.appendUsername();
    this.appendMessageParts();

    this.addChild(this.grid);
    await super.init();

    // Propagate measured size for convenience
    this.setWidth(this.grid.getWidth());
    this.setHeight(this.grid.getHeight());
  }

  override play(): void {
    super.play();
  }

  override getWidth(): number | null {
    return this.grid?.getWidth() ?? super.getWidth();
  }

  override getHeight(): number | null {
    return this.grid?.getHeight() ?? super.getHeight();
  }

  private appendBadges(): void {
    if (!this.grid || !this.chat.badges || this.chat.badges.length === 0)
      return;

    logger.debug("[ChatMessageElement] appendBadges start", {
      badgeCount: this.chat.badges.length,
    });

    for (const badge of this.chat.badges) {
      const img = new ImageElement({
        imageUrl: badge.imageUrl,
        height: this.badgeHeight,
        scaleStrategy: "fit",
      });
      logger.debug("[ChatMessageElement] Adding badge image", {
        url: badge.imageUrl,
      });
      this.grid.addChild(img);
    }
  }

  private appendUsername(): void {
    if (!this.grid) return;
    logger.debug("[ChatMessageElement] appendUsername start", {
      username: this.chat.username,
    });
    const username = new TextElement({
      text: this.chat.username,
      font: this.font,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      color: this.usernameColor,
      textBaseline: "top",
    });
    logger.debug("[ChatMessageElement] Adding username text", {
      username: this.chat.username,
    });
    this.grid.addChild(username);
  }

  private appendMessageParts(): void {
    if (!this.grid) return;

    const emotes = this.chat.emotes ?? [];
    logger.debug("[ChatMessageElement] appendMessageParts start", {
      message: this.chat.message,
      messageLength: this.chat.message.length,
      emoteCount: emotes.length,
    });

    // Sort emotes by start index
    const sorted = [...emotes].sort((a, b) => a.startIndex - b.startIndex);

    let currentIndex = 0;
    let nextEmote: Emote | undefined;

    while ((nextEmote = sorted.shift())) {
      // Add text before emote
      if (currentIndex < nextEmote.startIndex) {
        const textSlice = this.chat.message.substring(
          currentIndex,
          nextEmote.startIndex,
        );
        if (textSlice) {
          logger.debug("[ChatMessageElement] Adding text before emote", {
            text: textSlice,
          });
          this.grid.addChild(
            new TextElement({
              text: textSlice,
              font: this.font,
              fontSize: this.fontSize,
              fontWeight: this.fontWeight,
              color: this.textColor,
              textBaseline: "top",
            }),
          );
        }
        currentIndex = nextEmote.startIndex;
      }

      // Add emote
      const img = new ImageElement({
        imageUrl: nextEmote.imageUrl,
        height: this.emoteHeight,
        scaleStrategy: "fit",
      });
      logger.debug("[ChatMessageElement] Adding emote image", {
        emoteName: nextEmote.name,
        url: nextEmote.imageUrl,
      });
      this.grid.addChild(img);

      currentIndex = nextEmote.endIndex + 1;
    }

    // Add remaining text after last emote
    if (currentIndex < this.chat.message.length) {
      const remainingText = this.chat.message.substring(currentIndex);
      logger.debug("[ChatMessageElement] Adding remaining text", {
        text: remainingText,
      });
      this.grid.addChild(
        new TextElement({
          text: remainingText,
          font: this.font,
          fontSize: this.fontSize,
          fontWeight: this.fontWeight,
          color: this.textColor,
          textBaseline: "top",
        }),
      );
    }
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.grid = null;
  }
}
