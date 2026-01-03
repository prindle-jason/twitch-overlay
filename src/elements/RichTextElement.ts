import { TransformElement } from "./TransformElement";
import { TextElement } from "./TextElement";
import { AnimatedImageElement } from "./AnimatedImageElement";

export interface EmoteData {
  name: string;
  url: string;
  start: number;
  end: number;
}

interface RichTextConfig {
  fontSize?: number;
  color?: string;
  font?: string;
  fontWeight?: string;
  textBaseline?: CanvasTextBaseline;
  textAlign?: CanvasTextAlign;
  // strokeColor?: string;
  // strokeWidth?: number;
  emoteHeight?: number;
  emotePadding?: number;
  opacity?: number;
}

export class RichTextElement extends TransformElement {
  text: string;
  emoteData: EmoteData[];
  font: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  emoteHeight: number;
  emotePadding: number;

  private width: number = 0;
  private height: number = 0;

  constructor(
    text: string,
    emoteData: EmoteData[] = [],
    config: RichTextConfig = {}
  ) {
    super();
    this.text = text || "";
    this.emoteData = emoteData || [];
    this.font = config.font ?? "Arial";
    this.fontSize = config.fontSize ?? 24;
    this.color = config.color ?? "#ffffff";
    this.fontWeight = config.fontWeight ?? "normal";
    this.textAlign = config.textAlign ?? "center";
    this.textBaseline = config.textBaseline ?? "middle";
    this.emoteHeight = config.emoteHeight ?? this.fontSize;
    this.emotePadding = config.emotePadding ?? 2;

    this.opacity = config.opacity ?? 1;
  }

  async init(): Promise<void> {
    console.log(
      `[RichTextElement] init() - text: "${this.text}", emotes: ${this.emoteData.length}`
    );
    this.createChildElements();
    console.log(`[RichTextElement] Created ${this.children.length} children`);
    await super.init();
    this.calculateLayout();
    console.log(
      `[RichTextElement] Layout complete - width: ${this.width}, height: ${this.height}, position: (${this.x}, ${this.y})`
    );
  }

  private createChildElements(): void {
    const sortedEmotes = [...(this.emoteData || [])].sort(
      (a, b) => a.start - b.start
    );

    let currentPos = 0;
    let nextEmote: EmoteData | undefined;
    while ((nextEmote = sortedEmotes.shift())) {
      // Text before next emote
      if (currentPos < nextEmote.start) {
        this.createTextElement(
          this.text.substring(currentPos, nextEmote.start)
        );
        currentPos = nextEmote.start;
      }
      this.addChild(new AnimatedImageElement(nextEmote.url));
      currentPos = nextEmote.end + 1;
    }

    // Text after all emotes (or no emotes at all)
    this.createTextElement(this.text.substring(currentPos));
    currentPos = this.text.length;
  }

  private createTextElement(textContent: string): void {
    console.log(
      `[RichTextElement] Creating TextElement with content: "${textContent}"`
    );
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
      const transformChild = child as TransformElement;
      const childWidth = transformChild.getWidth();
      const childHeight = transformChild.getHeight();

      transformChild.x = currentX;

      if (child instanceof TextElement) {
        transformChild.y = 0;
        currentX += childWidth;
        console.log(
          `[RichTextElement] TextElement - width: ${childWidth}, x: ${transformChild.x}`
        );
      } else if (child instanceof AnimatedImageElement) {
        const scaledEmoteHeight = Math.min(this.emoteHeight, childHeight);
        transformChild.setScale(this.emoteHeight / Math.max(childHeight, 1));
        transformChild.y =
          this.textBaseline === "middle"
            ? this.emoteHeight / 2 - scaledEmoteHeight / 2
            : 0;
        currentX += this.emotePadding + this.emoteHeight + this.emotePadding;
        maxHeight = Math.max(maxHeight, this.emoteHeight);
        console.log(
          `[RichTextElement] AnimatedImageElement - height: ${childHeight}, scaled: ${scaledEmoteHeight}, x: ${transformChild.x}, y: ${transformChild.y}`
        );
      }
    }

    this.width = currentX;
    this.height = maxHeight;

    console.log(
      `[RichTextElement] Before alignment - width: ${this.width}, textAlign: ${this.textAlign}`
    );

    // Apply text alignment by adjusting all children
    if (this.textAlign === "center" && this.width > 0) {
      const offset = -this.width / 2;
      console.log(`[RichTextElement] Applying center offset: ${offset}`);
      for (const child of this.children) {
        const transformChild = child as TransformElement;
        transformChild.x += offset;
      }
    } else if (this.textAlign === "right" && this.width > 0) {
      const offset = -this.width;
      console.log(`[RichTextElement] Applying right offset: ${offset}`);
      for (const child of this.children) {
        const transformChild = child as TransformElement;
        transformChild.x += offset;
      }
    }
  }

  override getWidth(): number {
    return this.width;
  }

  override getHeight(): number {
    return this.height;
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    // Draw canvas-based children (TextElement); skip DOM-rendered children (AnimatedImageElement)
    for (const child of this.children) {
      if (!(child instanceof AnimatedImageElement)) {
        child.draw(ctx);
      }
    }

    ctx.restore();
  }
}
