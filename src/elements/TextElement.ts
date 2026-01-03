import { TransformElement } from "./TransformElement";
import { measureText } from "../utils/canvasUtils";
import { sanitizeText } from "../utils/textSanitizer";

export class TextElement extends TransformElement {
  text: string;
  font: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textBaseline: CanvasTextBaseline;

  private cachedWidth: number | null = null;

  constructor(config: {
    text: string;
    font?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textBaseline?: CanvasTextBaseline;
  }) {
    super();
    this.text = sanitizeText(config.text);
    this.font = config.font ?? "Arial";
    this.fontSize = config.fontSize ?? 24;
    this.fontWeight = config.fontWeight ?? "normal";
    this.color = config.color ?? "#ffffff";
    this.textBaseline = config.textBaseline ?? "middle";
  }

  private getFontString(): string {
    return `${this.fontWeight} ${this.fontSize}px ${this.font}`;
  }

  private measureWidth(): number {
    return measureText(this.text, this.getFontString());
  }

  override getWidth(): number {
    if (this.cachedWidth === null) {
      this.cachedWidth = this.measureWidth();
    }
    return this.cachedWidth * this.scaleX;
  }

  override getHeight(): number {
    return this.fontSize * this.scaleY;
  }

  draw(ctx: CanvasRenderingContext2D): void {
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

    ctx.font = this.getFontString();
    ctx.fillStyle = this.color;
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}
