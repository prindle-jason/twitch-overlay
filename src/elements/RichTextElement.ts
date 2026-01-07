import { TransformElement } from "./TransformElement";
import { TextElement } from "./TextElement";
import { ImageElement } from "./ImageElement";
import { Emote } from "../utils/chat/chatTypes";

interface RichTextConfig {
  fontSize?: number;
  color?: string;
  font?: string;
  fontWeight?: string;
  textBaseline?: CanvasTextBaseline;
  emoteHeight?: number;
  emotePadding?: number;
  opacity?: number;
}

/** @deprecated Use GridLayoutElement instead. */
export class RichTextElement extends TransformElement {
  text: string;
  emoteData: Emote[];
  font: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  textBaseline: CanvasTextBaseline;
  emoteHeight: number;
  emotePadding: number;

  //private width: number = 0;
  //private height: number = 0;

  constructor(text: string, emoteData?: Emote[], config: RichTextConfig = {}) {
    super();
    this.text = text || "";
    this.emoteData = emoteData || [];
    this.font = config.font ?? "Arial";
    this.fontSize = config.fontSize ?? 24;
    this.color = config.color ?? "#ffffff";
    this.fontWeight = config.fontWeight ?? "normal";
    this.textBaseline = config.textBaseline ?? "middle";
    this.emoteHeight = config.emoteHeight ?? this.fontSize;
    this.emotePadding = config.emotePadding ?? 2;

    this.opacity = config.opacity ?? 1;
  }

  async init(): Promise<void> {
    await this.createChildElements();
    await super.init();
    this.calculateLayout();
  }

  private async createChildElements(): Promise<void> {
    const sortedEmotes = this.emoteData.sort(
      (a, b) => a.startIndex - b.startIndex
    );

    let currentPos = 0;
    let nextEmote: Emote | undefined;
    while ((nextEmote = sortedEmotes.shift())) {
      // Text before next emote
      if (currentPos < nextEmote.startIndex) {
        this.createTextElement(
          this.text.substring(currentPos, nextEmote.startIndex)
        );
        currentPos = nextEmote.startIndex;
      }
      try {
        this.addChild(new ImageElement({ imageUrl: nextEmote.imageUrl }));
      } catch (err) {
        this.createTextElement(
          this.text.substring(nextEmote.startIndex, nextEmote.endIndex + 1)
        );
      }
      currentPos = nextEmote.endIndex + 1;
    }

    // Text after all emotes (or no emotes at all)
    this.createTextElement(this.text.substring(currentPos));
  }

  private createTextElement(textContent: string): void {
    if (!textContent) return;
    this.addChild(
      new TextElement({
        text: textContent,
        font: this.font,
        fontSize: this.fontSize,
        fontWeight: this.fontWeight,
        color: this.color,
        textBaseline: this.textBaseline,
      })
    );
  }

  private calculateLayout(): void {
    let totalWidth = 0;
    let maxHeight = this.fontSize;

    let currentX = 0;
    for (const child of this.children) {
      if (child instanceof TransformElement === false) continue;

      const transformChild = child as TransformElement;
      const childWidth = transformChild.getWidth() ?? 0;
      const childHeight = transformChild.getHeight() ?? 0;

      transformChild.x = currentX;

      if (child instanceof TextElement) {
        transformChild.y = 0;
        currentX += childWidth;
      } else if (child instanceof ImageElement) {
        const scaledEmoteHeight = Math.min(this.emoteHeight, childHeight);
        transformChild.setScale(this.emoteHeight / Math.max(childHeight, 1));
        transformChild.y =
          this.textBaseline === "middle"
            ? this.emoteHeight / 2 - scaledEmoteHeight / 2
            : 0;
        currentX += this.emotePadding + this.emoteHeight + this.emotePadding;
        maxHeight = Math.max(maxHeight, this.emoteHeight);
      }
    }

    this.setWidth(currentX);
    this.setHeight(maxHeight);
  }
}
