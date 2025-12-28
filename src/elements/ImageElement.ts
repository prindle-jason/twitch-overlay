import { Element } from "./Element";
import { getImage, type ImageKey } from "../core/resources";

export class ImageElement extends Element {
  imageKey: ImageKey;
  image: HTMLImageElement | null = null;
  private loadPromise: Promise<void> | null = null;
  x = 0;
  y = 0;
  width: number | null = null;
  height: number | null = null;
  opacity = 1;
  scaleX = 1;
  scaleY = 1;
  rotation = 0;
  filter = "none";

  constructor(imageKey: ImageKey) {
    super();
    this.imageKey = imageKey;
  }

  init(): void {
    this.loadPromise = getImage(this.imageKey).then((img) => {
      this.image = img;
    });
  }

  async ready(): Promise<void> {
    if (this.loadPromise) {
      await this.loadPromise;
    }
    this.state = "READY";
  }

  getWidth(): number {
    if (this.width !== null) return this.width;
    return this.image ? this.image.naturalWidth * this.scaleX : 0;
  }

  getHeight(): number {
    if (this.height !== null) return this.height;
    return this.image ? this.image.naturalHeight * this.scaleY : 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.image || this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    ctx.drawImage(this.image, 0, 0, this.getWidth(), this.getHeight());
    ctx.restore();
  }
}
