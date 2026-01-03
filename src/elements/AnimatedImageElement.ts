import { TransformElement } from "./TransformElement";
import { getOverlayContainer } from "../utils/overlayContainer";

/**
 * AnimatedImageElement renders images/animated media as DOM <img> elements
 * positioned via CSS absolute positioning over the canvas.
 * Supports GIF, animated WebP, and other formats natively via the browser.
 */
export class AnimatedImageElement extends TransformElement {
  imageUrl: string;
  img: HTMLImageElement | null = null;
  wrapper: HTMLDivElement | null = null;
  naturalWidth: number = 0;
  naturalHeight: number = 0;

  constructor(imageUrl: string) {
    super();
    this.imageUrl = imageUrl;
  }

  async init(): Promise<void> {
    const overlay = getOverlayContainer();

    // Create wrapper div for positioning
    this.wrapper = document.createElement("div");
    this.wrapper.style.position = "absolute";
    this.wrapper.style.pointerEvents = "none";

    // Create img element
    this.img = document.createElement("img");
    this.img.crossOrigin = "anonymous";
    this.img.style.display = "block";
    this.img.style.height = "100%";
    this.img.style.width = "auto";

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      this.img?.addEventListener(
        "load",
        () => {
          this.naturalWidth = this.img?.naturalWidth || 0;
          this.naturalHeight = this.img?.naturalHeight || 0;
          resolve();
        },
        { once: true }
      );
      this.img?.addEventListener(
        "error",
        () => {
          reject(new Error(`Failed to load image: ${this.imageUrl}`));
        },
        { once: true }
      );
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(
        this.imageUrl
      )}`;
      this.img!.src = proxiedUrl;
    });

    this.wrapper.appendChild(this.img);
    overlay.appendChild(this.wrapper);

    await super.init();
  }

  getWidth(): number {
    return this.naturalWidth > 0 ? this.naturalWidth * this.scaleX : -1;
  }

  getHeight(): number {
    return this.naturalHeight > 0 ? this.naturalHeight * this.scaleY : -1;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    // Sync DOM style with transform state
    this.syncDomStyle();
  }

  private syncDomStyle(): void {
    if (!this.wrapper) return;

    const pos = this.getAbsolutePosition();

    const transforms: string[] = [];
    transforms.push(`translate(${pos.x}px, ${pos.y}px)`);
    if (this.rotation !== 0) {
      transforms.push(`rotate(${this.rotation}rad)`);
    }
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      transforms.push(`scale(${this.scaleX}, ${this.scaleY})`);
    }

    this.wrapper.style.transform = transforms.join(" ");
    this.wrapper.style.opacity = String(this.opacity);
    if (this.filter !== "none") {
      this.wrapper.style.filter = this.filter;
    }
  }

  override finish(): void {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    super.finish();
  }
}
