import { TransformElement } from "./TransformElement";
import { getImage, loadExternalImage, type ImageKey } from "../core/resources";

export class ImageElement extends TransformElement {
  imageKey?: ImageKey;
  imageUrl?: string;
  image: HTMLImageElement | null = null;

  constructor(config: { imageKey?: ImageKey; imageUrl?: string }) {
    super();
    this.imageKey = config.imageKey;
    this.imageUrl = config.imageUrl;

    if (!this.imageKey && !this.imageUrl) {
      throw new Error("ImageElement requires either imageKey or imageUrl");
    }
  }

  async init(): Promise<void> {
    if (this.imageKey) {
      this.image = await getImage(this.imageKey);
    } else if (this.imageUrl) {
      this.image = await loadExternalImage(this.imageUrl);
    }
    await super.init();
  }

  getWidth(): number {
    //if (this.width !== null) return this.width;
    return this.image ? this.image.naturalWidth * this.scaleX : -1;
  }

  getHeight(): number {
    //if (this.height !== null) return this.height;
    return this.image ? this.image.naturalHeight * this.scaleY : -1;
  }

  update(deltaTime: number): void {
    //console.log("ImageElement update:", this.imageKey, deltaTime);
    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    //console.log("ImageElement draw:", this.imageKey, this.image, this.opacity);
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
